import os
import unittest
from datetime import datetime, timezone
from hashlib import sha256
from secrets import token_urlsafe
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

from bson import ObjectId
from fastapi.testclient import TestClient
from gridfs.errors import NoFile
from pymongo.errors import OperationFailure, ServerSelectionTimeoutError

BASE = "/api/materiais"
ORIGIN = "http://localhost:5173"
FILE_ID = ObjectId()
LIMIT = 2 * 1024 * 1024

with patch.dict(os.environ, {"CORS_ALLOWED_ORIGINS": ORIGIN}):
    from app.main import app


def sample_pdf(use_xref_stream=False):
    header = b"%PDF-1.5\n" if use_xref_stream else b"%PDF-1.4\n"
    root = b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
    pages = b"2 0 obj\n<< /Type /Pages /Kids [] /Count 0 >>\nendobj\n"
    padding = (b"%" + b" " * 1022 + b"\n") * 1100
    xref = len(header + root + pages + padding)
    if use_xref_stream:
        entries = b"\0\0\0\0\0\xff\xff" + b"".join(
            b"\x01" + offset.to_bytes(4, "big") + b"\0\0"
            for offset in (len(header), len(header + root), xref)
        )
        stream = (
            f"3 0 obj\n<< /Type /XRef /Size 4 /Root 1 0 R /W [1 4 2] /Length {len(entries)} >>\nstream\n".encode()
            + entries + f"\nendstream\nendobj\nstartxref\n{xref}\n%%EOF\n".encode()
        )
        return header + root + pages + padding + stream
    trailer = (
        f"xref\n0 3\n0000000000 65535 f \n{len(header):010d} 00000 n \n"
        f"{len(header + root):010d} 00000 n \ntrailer\n<< /Size 3 /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n"
    )
    return header + root + pages + padding + trailer.encode()


class MaterialsSecurityTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        token = token_urlsafe(32)
        cls.auth = {"Authorization": f"Bearer {token}"}
        cls.enterClassContext(patch.dict(os.environ, {
            "MATERIALS_ADMIN_TOKEN_HASH": sha256(token.encode()).hexdigest(),
            "MATERIALS_MAX_UPLOAD_BYTES": str(LIMIT),
        }))
        cls.client = cls.enterClassContext(TestClient(app))

    def setUp(self):
        self.bucket = self.enterContext(patch("app.routers.materiais.fs_bucket"))
        self.bucket.delete = AsyncMock()
        self.bucket.open_download_stream = AsyncMock()
        self.bucket.find.return_value = MagicMock()

    def upload(self, content, filename="test.pdf"):
        return self.client.post(BASE, headers=self.auth, data={"disciplina": "7"},
                                files={"file": (filename, content, "application/pdf")})

    def test_writes_require_valid_token_and_reads_are_public(self):
        for headers in ({}, {"Authorization": "Bearer " + "x" * 43}):
            self.assertEqual(self.client.post(BASE, headers=headers).status_code, 401)
            self.assertEqual(self.client.delete(f"{BASE}/{FILE_ID}", headers=headers).status_code, 401)
        self.bucket.delete.assert_not_awaited()
        self.assertEqual(self.client.delete(f"{BASE}/{FILE_ID}", headers=self.auth).status_code, 200)
        self.assertEqual(self.client.get(BASE).json(), [])

    def test_rejects_forged_and_oversized_pdfs_before_gridfs(self):
        for data in (
            b"", b"HTML", b"%PDF-1.4\n%%EOF\n", b"%PDF-1.4\nstartxref\n9999\n%%EOF\n",
            b"%PDF-1.4\nxref\n0 1\n0000000000 65535 f \nstartxref\n9\n%%EOF\n",
        ):
            self.assertEqual(self.upload(data).status_code, 400)
        self.assertEqual(self.upload(b"x" * (LIMIT + 1)).status_code, 413)
        self.assertEqual(self.upload(b"x" * (LIMIT + 65537)).status_code, 413)
        self.bucket.open_upload_stream.assert_not_called()

    def test_chunked_request_without_content_length_is_bounded(self):
        def body():
            yield b'--boundary\r\nContent-Disposition: form-data; name="file"; filename="a.pdf"\r\n\r\n'
            for _ in range(34):
                yield b"x" * 65536
        response = self.client.post(BASE, headers={**self.auth,
            "Content-Type": "multipart/form-data; boundary=boundary"}, content=body())
        self.assertEqual(response.status_code, 413)
        self.bucket.open_upload_stream.assert_not_called()

    def test_upload_spools_and_writes_in_chunks(self):
        pdf = sample_pdf()
        grid = SimpleNamespace(_id=FILE_ID, write=AsyncMock(), close=AsyncMock())
        self.bucket.open_upload_stream.return_value = grid
        response = self.upload(pdf, "../" + "á" * 200 + ".pdf")
        self.assertEqual(response.status_code, 201, response.text)
        data = response.json()
        self.assertEqual(data["id"], str(FILE_ID))
        self.assertEqual(data["tamanho"], len(pdf))
        self.assertLessEqual(len(data["nome"].encode()), 124)
        chunks = [call.args[0] for call in grid.write.await_args_list]
        self.assertGreater(len(chunks), 1)
        self.assertLessEqual(max(map(len, chunks)), 256 * 1024)
        self.assertEqual(b"".join(chunks), pdf)
        grid.close.assert_awaited_once()

    def test_upload_accepts_pdf_with_cross_reference_stream(self):
        grid = SimpleNamespace(_id=FILE_ID, write=AsyncMock(), close=AsyncMock())
        self.bucket.open_upload_stream.return_value = grid
        response = self.upload(sample_pdf(use_xref_stream=True))
        self.assertEqual(response.status_code, 201, response.text)

    def test_failed_upload_aborts_partial_gridfs_write(self):
        grid = SimpleNamespace(write=AsyncMock(side_effect=OperationFailure("sensitive")),
                               close=AsyncMock(), abort=AsyncMock())
        self.bucket.open_upload_stream.return_value = grid
        response = self.upload(sample_pdf())
        self.assertEqual(response.status_code, 500)
        self.assertNotIn("sensitive", response.text)
        grid.abort.assert_awaited_once()
        grid.close.assert_not_awaited()

    def test_download_sanitizes_legacy_headers_and_distinguishes_errors(self):
        download = SimpleNamespace(filename='../ação"\r\n.pdf', length=3,
                                   readchunk=AsyncMock(side_effect=[b"pdf", b""]), close=AsyncMock())
        self.bucket.open_download_stream.return_value = download
        path = f"{BASE}/{FILE_ID}"
        response = self.client.get(path)
        self.assertEqual(response.content, b"pdf")
        self.assertEqual(response.headers["content-type"], "application/pdf")
        self.assertEqual(response.headers["x-content-type-options"], "nosniff")
        self.assertIn("filename*=UTF-8''a%C3%A7%C3%A3o___.pdf", response.headers["content-disposition"])
        download.close.assert_awaited_once()
        for error, status in ((NoFile("sensitive"), 404), (OperationFailure("sensitive"), 500),
                              (ServerSelectionTimeoutError("sensitive"), 503)):
            self.bucket.open_download_stream.side_effect = error
            self.bucket.delete.side_effect = error
            for response in (self.client.get(path), self.client.delete(path, headers=self.auth)):
                self.assertEqual(response.status_code, status)
                self.assertNotIn("sensitive", response.text)
        self.assertEqual(self.client.get(f"{BASE}/invalid").status_code, 400)

    def test_pagination_keeps_the_legacy_array_and_validates_bounds(self):
        self.bucket.find.return_value.__aiter__.return_value = [SimpleNamespace(
            _id=FILE_ID, filename="legacy.pdf", metadata={"disciplina": "7", "data_upload": "invalid"},
            upload_date=datetime.now(timezone.utc), length=7)]
        response = self.client.get(BASE, params={"disciplina": "7", "limit": 2, "offset": 1})
        self.assertEqual(response.json()[0]["id"], str(FILE_ID))
        self.bucket.find.assert_called_with({"metadata.disciplina": "7"},
                                            sort=[("uploadDate", -1), ("_id", -1)], skip=1, limit=2)
        self.assertEqual(self.client.get(BASE, params={"limit": 101}).status_code, 422)

    def test_cors_limits_origins_and_methods(self):
        allowed = self.client.get(BASE, headers={"Origin": ORIGIN})
        self.assertEqual(allowed.headers["access-control-allow-origin"], ORIGIN)
        denied = self.client.get(BASE, headers={"Origin": "https://unlisted.invalid"})
        self.assertNotIn("access-control-allow-origin", denied.headers)
        preflight = self.client.options(BASE, headers={
            "Origin": ORIGIN, "Access-Control-Request-Method": "POST"})
        self.assertEqual(preflight.status_code, 400)
