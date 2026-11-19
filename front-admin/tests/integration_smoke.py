"""Run against an isolated Compose stack with SESSION_COOKIE_SECURE=false."""
import os
import re

import requests

TIMEOUT = 15
ACADEMIC = os.environ["URL_SPRING_BOOT"].rstrip("/")
MATERIALS = os.environ["URL_FASTAPI"].rstrip("/")
ADMIN = "http://127.0.0.1:5000"


def expect(response, status):
    assert response.status_code == status, (response.request.method, response.url, response.status_code)
    return response


def sample_pdf():
    pdf = b"%PDF-1.4\n"
    offsets = []
    objects = (
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 72 72] >>",
    )
    for index, content in enumerate(objects, 1):
        offsets.append(len(pdf))
        pdf += f"{index} 0 obj\n".encode() + content + b"\nendobj\n"
    xref = len(pdf)
    pdf += b"xref\n0 4\n0000000000 65535 f \n"
    pdf += b"".join(f"{offset:010d} 00000 n \n".encode() for offset in offsets)
    return pdf + f"trailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode()


def main():
    for resource in ("disciplinas", "horarios", "avisos"):
        path = f"{ACADEMIC}/{resource}"
        expect(requests.get(path, timeout=TIMEOUT), 200)
        for method, suffix in (("POST", ""), ("PUT", "/1"), ("DELETE", "/1")):
            expect(requests.request(method, path + suffix, timeout=TIMEOUT), 401)
    expect(requests.post(ACADEMIC + "/disciplinas", headers={"Authorization": "Bearer " + "X" * 43},
                         timeout=TIMEOUT), 401)
    expect(requests.get(MATERIALS + "/materiais", timeout=TIMEOUT), 200)
    expect(requests.post(MATERIALS + "/materiais", timeout=TIMEOUT), 401)

    with requests.Session() as browser:
        expect(browser.get(ADMIN, allow_redirects=False, timeout=TIMEOUT), 302)
        expect(browser.get(ADMIN + "/api/disciplinas", timeout=TIMEOUT), 401)
        login = expect(browser.get(ADMIN + "/login", timeout=TIMEOUT), 200)
        csrf = re.search(r'name="csrf_token" value="([^"]+)"', login.text)[1]
        password = os.environ["CLASSPATH_TEST_PASSWORD"]
        login_data = {"username": os.environ["ADMIN_USERNAME"], "csrf_token": csrf}
        expect(browser.post(ADMIN + "/login", data={**login_data, "password": password + "invalid"},
                            timeout=TIMEOUT), 401)
        expect(browser.post(ADMIN + "/login", data={**login_data, "password": password},
                            allow_redirects=False, timeout=TIMEOUT), 302)
        page = expect(browser.get(ADMIN, timeout=TIMEOUT), 200)
        csrf = re.search(r'name="csrf-token" content="([^"]+)"', page.text)[1]
        for name in ("ACADEMIC_ADMIN_TOKEN", "MATERIALS_ADMIN_TOKEN", "SECRET_KEY", "ADMIN_PASSWORD_HASH"):
            assert os.environ[name] not in page.text, f"Unexpected configuration in HTML: {name}"
        expect(browser.post(ADMIN + "/api/disciplinas", json={}, timeout=TIMEOUT), 403)

        browser.headers["X-CSRF-Token"] = csrf
        created = []
        try:
            for resource, data, field, updated in (
                ("disciplinas", {"nome": "Integration test", "professor": "Test"}, "professor", "Updated"),
                ("horarios", {"diaSemana": "Segunda-feira", "horarioInicio": "08:00",
                              "horarioFim": "10:00", "sala": "Test"}, "sala", "Updated"),
                ("avisos", {"titulo": "Integration test", "descricao": "Test",
                            "dataPublicacao": "2026-11-18"}, "descricao", "Updated"),
            ):
                if created:
                    data["disciplinaId"] = created[0][1]
                path = f"/api/{resource}"
                record = expect(browser.post(ADMIN + path, json=data, timeout=TIMEOUT), 201).json()
                record_id = record["id"]
                created.append((resource, record_id))
                data[field] = updated
                expect(browser.put(f"{ADMIN}{path}/{record_id}", json=data, timeout=TIMEOUT), 200)
                public = expect(requests.get(f"{ACADEMIC}/{resource}/{record_id}", timeout=TIMEOUT), 200)
                assert public.json()[field] == updated

            expect(browser.post(ADMIN + "/api/materiais",
                                data={"disciplina_id": created[0][1]},
                                files={"file": ("fake.pdf", b"%PDF-1.4\n%%EOF\n", "application/pdf")},
                                timeout=TIMEOUT), 400)
            pdf = sample_pdf()
            material = expect(browser.post(ADMIN + "/api/materiais",
                                           data={"disciplina_id": created[0][1]},
                                           files={"file": ("test.pdf", pdf, "application/pdf")},
                                           timeout=TIMEOUT), 201).json()
            file_id = material["id"]
            try:
                download = expect(requests.get(f"{MATERIALS}/materiais/{file_id}", timeout=TIMEOUT), 200)
                assert download.content == pdf
                assert download.headers["X-Content-Type-Options"] == "nosniff"
                page = expect(requests.get(f"{MATERIALS}/materiais",
                                           params={"disciplina": created[0][1], "limit": 1, "offset": 0},
                                           timeout=TIMEOUT), 200)
                assert [row["id"] for row in page.json()] == [file_id]
                expect(requests.delete(f"{MATERIALS}/materiais/{file_id}", timeout=TIMEOUT), 401)
            finally:
                expect(browser.delete(f"{ADMIN}/materiais/{file_id}", timeout=TIMEOUT), 200)
            expect(requests.get(f"{MATERIALS}/materiais/{file_id}", timeout=TIMEOUT), 404)
            expect(browser.delete(f"{ADMIN}/materiais/{file_id}", timeout=TIMEOUT), 404)
        finally:
            for resource, record_id in reversed(created):
                expect(browser.delete(f"{ADMIN}/api/{resource}/{record_id}", timeout=TIMEOUT), 200)
                expect(requests.get(f"{ACADEMIC}/{resource}/{record_id}", timeout=TIMEOUT), 404)

        expect(browser.post(ADMIN + "/logout", allow_redirects=False, timeout=TIMEOUT), 302)
        expect(browser.get(ADMIN + "/api/disciplinas", timeout=TIMEOUT), 401)
    print("Integration passed: Flask, Spring/PostgreSQL and Materials/MongoDB.")


if __name__ == "__main__":
    main()
