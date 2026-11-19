import re
import secrets
import unittest
from unittest.mock import Mock, patch

from requests import HTTPError
from werkzeug.security import generate_password_hash

from app import create_app


class AdminSecurityTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.password = secrets.token_urlsafe(24)
        cls.config = {
            "TESTING": True,
            "SECRET_KEY": secrets.token_urlsafe(32),
            "ADMIN_USERNAME": "test-operator",
            "ADMIN_PASSWORD_HASH": generate_password_hash(cls.password, method="scrypt:32768:8:1"),
            "ACADEMIC_ADMIN_TOKEN": secrets.token_urlsafe(32),
            "MATERIALS_ADMIN_TOKEN": secrets.token_urlsafe(32),
            "URL_SPRING_BOOT": "https://spring.invalid/api",
            "URL_FASTAPI": "https://materials.invalid/api",
            "SESSION_COOKIE_SECURE": True,
        }

    def setUp(self):
        self.app = create_app(self.config)
        self.client = self.app.test_client()

    def login(self, password=None):
        login_page = self.client.get("/login")
        token = re.search(r'name="csrf_token" value="([^"]+)"', login_page.get_data(as_text=True))[1]
        return self.client.post("/login", data={
            "username": self.config["ADMIN_USERNAME"],
            "password": self.password if password is None else password,
            "csrf_token": token,
        })

    def csrf_headers(self):
        html = self.client.get("/").get_data(as_text=True)
        return {"X-CSRF-Token": re.search(r'name="csrf-token" content="([^"]+)"', html)[1]}

    def test_missing_key_fails_startup(self):
        with self.assertRaisesRegex(RuntimeError, "SECRET_KEY"):
            create_app({**self.config, "SECRET_KEY": None})

    def test_anonymous_page_and_operations_are_blocked(self):
        response = self.client.get("/")
        self.assertEqual((302, "/login"), (response.status_code, response.location))
        for method, path in [
            ("GET", "/api/disciplinas"), ("POST", "/api/avisos"),
            ("PUT", "/api/horarios/1"), ("DELETE", "/api/disciplinas/1"),
            ("GET", "/materiais/file"), ("DELETE", "/materiais/file"),
        ]:
            with self.subTest(method=method, path=path):
                self.assertEqual(self.client.open(path, method=method).status_code, 401)

    def test_login_logout_cookie_and_revocation(self):
        self.assertEqual(self.login("invalid").status_code, 401)
        response = self.login()
        self.assertEqual(response.status_code, 302)
        for attribute in ("Secure", "HttpOnly", "SameSite=Lax"):
            self.assertIn(attribute, response.headers["Set-Cookie"])
        self.assertEqual(self.client.get("/").status_code, 200)
        session_cookie = self.client.get_cookie("session").value
        self.assertEqual(self.client.post("/logout").status_code, 403)
        self.assertEqual(self.client.post("/logout", headers=self.csrf_headers()).status_code, 302)
        self.assertEqual(self.client.get("/").status_code, 302)
        self.client.set_cookie("session", session_cookie)
        self.assertEqual(self.client.get("/").status_code, 302)

    def test_csrf_protects_login_writes_and_upload(self):
        self.assertEqual(self.client.post("/login").status_code, 403)
        self.login()
        with patch("services.spring_api.requests.request") as spring:
            self.assertEqual(self.client.post("/api/disciplinas", json={}).status_code, 403)
            self.assertEqual(self.client.put("/api/horarios/1", json={},
                                             headers={"X-CSRF-Token": "wrong"}).status_code, 403)
            spring.assert_not_called()
        self.assertEqual(self.client.post("/api/materiais").status_code, 403)
        self.assertEqual(self.client.delete("/materiais/file").status_code, 403)

    def test_login_attempts_are_limited(self):
        for _ in range(8):
            self.assertEqual(self.login("invalid").status_code, 401)
        response = self.login()
        self.assertEqual(response.status_code, 429)
        self.assertIn("Retry-After", response.headers)

    def test_all_academic_crud_uses_server_side_credentials_for_writes(self):
        self.login()
        headers = self.csrf_headers()
        bearer = {"Authorization": "Bearer " + self.config["ACADEMIC_ADMIN_TOKEN"]}
        with patch("services.spring_api.requests.request") as write, patch("services.spring_api.requests.get") as read:
            read.return_value.json.return_value = []
            for resource in ("disciplinas", "horarios", "avisos"):
                with self.subTest(resource=resource):
                    self.assertEqual(self.client.get(f"/api/{resource}").json, [])
                    self.assertNotIn("headers", read.call_args.kwargs)
                    for method, suffix, status in (("POST", "", 201), ("PUT", "/1", 200), ("DELETE", "/1", 200)):
                        write.return_value = Mock(content=b"", is_redirect=False)
                        url = f"/api/{resource}{suffix}"
                        response = self.client.open(url, method=method, json={}, headers=headers)
                        self.assertEqual(response.status_code, status)
                        self.assertEqual(write.call_args.args, (method, "https://spring.invalid" + url))
                        self.assertEqual(write.call_args.kwargs["headers"], bearer)
                        self.assertFalse(write.call_args.kwargs["allow_redirects"])
                        self.assertNotIn(self.config["ACADEMIC_ADMIN_TOKEN"], response.get_data(as_text=True))

    def test_upstream_auth_errors_keep_status_and_hide_details(self):
        self.login()
        headers = self.csrf_headers()
        with patch("services.spring_api.requests.request") as write:
            for status in (401, 403):
                upstream = Mock(status_code=status)
                write.side_effect = HTTPError("internal details", response=upstream)
                response = self.client.post("/api/disciplinas", json={}, headers=headers)
                self.assertEqual(response.status_code, status)
                self.assertNotIn("internal details", response.get_data(as_text=True))

    def test_authenticated_write_limit(self):
        self.login()
        headers = self.csrf_headers()
        with patch("services.spring_api.requests.request") as write:
            write.return_value = Mock(content=b"", is_redirect=False)
            for _ in range(60):
                self.assertEqual(self.client.post("/api/disciplinas", json={}, headers=headers).status_code, 201)
            self.assertEqual(self.client.post("/api/disciplinas", json={}, headers=headers).status_code, 429)
            self.assertEqual(write.call_count, 60)


if __name__ == "__main__":
    unittest.main()
