import logging
import re
import unicodedata
from datetime import datetime, timezone
from urllib.parse import quote

from anyio import CancelScope
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from gridfs.errors import NoFile
from pymongo.errors import PyMongoError
from starlette.datastructures import UploadFile
from starlette.formparsers import MultiPartException, MultiPartParser
from starlette.requests import ClientDisconnect

from app.database import fs_bucket
from app.models import MaterialMetadata

router = APIRouter(prefix="/api/materiais", tags=["materiais"])
logger = logging.getLogger(__name__)

CONTENT_TYPE_PDF = "application/pdf"
CHUNK_SIZE = 256 * 1024
FORM_OVERHEAD = 64 * 1024


class UploadTooLarge(MultiPartException):
    pass


def _to_object_id(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except InvalidId:
        raise HTTPException(status_code=400, detail="ID de arquivo inválido.") from None


def _safe_filename(name: str) -> str:
    name = unicodedata.normalize("NFC", name.replace("\\", "/").rsplit("/", 1)[-1])
    stem = name[:-4] if name.lower().endswith(".pdf") else name
    stem = "".join(char if char.isalnum() or char in " .-_" else "_" for char in stem)
    stem = stem.encode("utf-8")[:120].decode("utf-8", errors="ignore").strip(" .")
    return (stem or "material") + ".pdf"


async def _bounded_body(request: Request, limit: int):
    received = 0
    try:
        async for chunk in request.stream():
            received += len(chunk)
            if received > limit:
                raise UploadTooLarge("Requisição excede o limite.")
            yield chunk
    except ClientDisconnect:
        raise MultiPartException("Upload interrompido.") from None


async def _validate_pdf(file: UploadFile, size: int):
    header = await file.read(16)
    tail_size = min(size, 64 * 1024)
    await file.seek(size - tail_size)
    trailer = await file.read(tail_size)
    end = re.search(rb"startxref\s+([0-9]{1,10})\s+%%EOF[\x00\t\r\n\f ]*\Z", trailer)
    if re.match(rb"%PDF-(?:1\.[0-7]|2\.0)[\r\n]", header) and end:
        offset = int(end[1])
        if len(b"%PDF-1.0\n") <= offset < size - len(trailer) + end.start():
            await file.seek(offset)
            xref = await file.read(4096)
            classic = re.match(rb"xref\s+[0-9]+\s+[0-9]+\s+[0-9]{10}\s+[0-9]{5}\s+[nf]\s", xref)
            stream = re.match(rb"[0-9]+\s+[0-9]+\s+obj\s*<<(.*?)>>\s*stream[\r\n]", xref, re.S)
            xref_dict = b""
            if classic:
                trailer_region = trailer[max(0, offset - (size - tail_size)):end.start()]
                dictionary = re.search(rb"(?:^|[\r\n])[ \t]*trailer\s*<<(.*)>>\s*\Z", trailer_region, re.S)
                if dictionary:
                    xref_dict = dictionary[1]
            elif stream and re.search(rb"/Type\s*/XRef\b", stream[1]):
                xref_dict = stream[1]
            if (re.search(rb"/Size\s+[1-9][0-9]*\b", xref_dict)
                    and re.search(rb"/(?:Root\s+[0-9]+\s+[0-9]+\s+R|Prev\s+[0-9]+)\b", xref_dict)):
                await file.seek(0)
                return
    raise HTTPException(status_code=400, detail="Arquivo PDF inválido.")


@router.post("", status_code=201, response_model=MaterialMetadata, openapi_extra={
    "requestBody": {"required": True, "content": {"multipart/form-data": {"schema": {
        "type": "object", "required": ["disciplina", "file"], "properties": {
            "disciplina": {"type": "string"}, "file": {"type": "string", "format": "binary"},
        },
    }}}},
})
async def upload_material(request: Request):
    limit = request.app.state.max_upload_bytes
    body_limit = limit + FORM_OVERHEAD
    length = request.headers.get("content-length", "")
    if length.isdecimal() and (len(length) > 11 or int(length) > body_limit):
        raise HTTPException(status_code=413, detail="Upload excede o limite.")
    if request.headers.get("content-type", "").split(";", 1)[0].strip().lower() != "multipart/form-data":
        raise HTTPException(status_code=400, detail="Envie um formulário multipart.")

    parser = MultiPartParser(request.headers, _bounded_body(request, body_limit),
                             max_files=1, max_fields=1, max_part_size=FORM_OVERHEAD)
    try:
        form = await parser.parse()
    except UploadTooLarge:
        raise HTTPException(status_code=413, detail="Upload excede o limite.") from None
    except MultiPartException:
        raise HTTPException(status_code=400, detail="Formulário inválido.") from None
    except ValueError:
        raise HTTPException(status_code=400, detail="Formulário inválido.") from None

    try:
        file = form.get("file")
        disciplina = form.get("disciplina")
        if not isinstance(file, UploadFile) or not isinstance(disciplina, str) or not disciplina:
            errors = [
                {"type": "missing", "loc": ["body", field], "msg": "Field required", "input": None}
                for field, valid in (("file", isinstance(file, UploadFile)),
                                     ("disciplina", isinstance(disciplina, str) and disciplina)) if not valid
            ]
            raise HTTPException(status_code=422, detail=errors)
        size = file.size or 0
        if size > limit:
            raise HTTPException(status_code=413, detail="Upload excede o limite.")
        if file.content_type != CONTENT_TYPE_PDF:
            raise HTTPException(status_code=400, detail="Apenas arquivos PDF são aceitos.")
        await _validate_pdf(file, size)
        name = _safe_filename(file.filename or "")
        now = datetime.now(timezone.utc)
        grid_in = fs_bucket.open_upload_stream(
            name, metadata={
                "disciplina": disciplina,
                "content_type": CONTENT_TYPE_PDF,
                "data_upload": now.isoformat(),
            },
        )
        try:
            while chunk := await file.read(CHUNK_SIZE):
                await grid_in.write(chunk)
            await grid_in.close()
        except BaseException:
            with CancelScope(shield=True):
                try:
                    await grid_in.abort()
                except PyMongoError as exc:
                    logger.error("Falha ao limpar upload interrompido (%s)", type(exc).__name__)
            raise
        return MaterialMetadata(id=str(grid_in._id), nome=name, disciplina=disciplina,
                                data_upload=now, tamanho=size, content_type=CONTENT_TYPE_PDF)
    finally:
        await form.close()


@router.get("", response_model=list[MaterialMetadata])
async def listar_materiais(
    disciplina: str | None = None,
    limit: int | None = Query(None, ge=1, le=100),
    offset: int = Query(0, ge=0, le=2_147_483_647),
):
    query = {"metadata.disciplina": disciplina} if disciplina else {}
    cursor = fs_bucket.find(query, sort=[("uploadDate", -1), ("_id", -1)],
                            skip=offset, limit=limit or 0)
    resultados = []
    async for grid_out in cursor:
        meta = grid_out.metadata or {}
        data_upload_raw = meta.get("data_upload")
        try:
            data_upload = datetime.fromisoformat(data_upload_raw)
        except (TypeError, ValueError):
            data_upload = grid_out.upload_date
        resultados.append(MaterialMetadata(
            id=str(grid_out._id), nome=grid_out.filename, disciplina=meta.get("disciplina", ""),
            data_upload=data_upload, tamanho=grid_out.length, content_type=meta.get("content_type"),
        ))
    return resultados


@router.get("/{file_id}")
async def baixar_material(file_id: str):
    oid = _to_object_id(file_id)
    try:
        grid_out = await fs_bucket.open_download_stream(oid)
    except NoFile:
        raise HTTPException(status_code=404, detail="Arquivo não encontrado.") from None

    try:
        first_chunk = await grid_out.readchunk()
    except BaseException:
        with CancelScope(shield=True):
            await grid_out.close()
        raise

    async def stream_gerador():
        try:
            if first_chunk:
                yield first_chunk
            while chunk := await grid_out.readchunk():
                yield chunk
        except PyMongoError as exc:
            logger.error("Falha no download do GridFS (%s)", type(exc).__name__)
            raise RuntimeError("Download interrompido.") from None
        finally:
            with CancelScope(shield=True):
                await grid_out.close()

    name = _safe_filename(grid_out.filename or "")
    fallback = name[:-4].encode("ascii", errors="ignore").decode().strip(" .") or "material"
    return StreamingResponse(
        stream_gerador(),
        media_type=CONTENT_TYPE_PDF,
        headers={
            "Content-Disposition": f"""attachment; filename="{fallback}.pdf"; filename*=UTF-8''{quote(name, safe='')}""",
            "Content-Length": str(grid_out.length),
            "X-Content-Type-Options": "nosniff",
        },
    )


@router.delete("/{file_id}")
async def deletar_material(file_id: str):
    oid = _to_object_id(file_id)
    try:
        await fs_bucket.delete(oid)
    except NoFile:
        raise HTTPException(status_code=404, detail="Arquivo não encontrado ou já foi excluído.") from None
    return {"mensagem": "Material excluído com sucesso do GridFS."}
