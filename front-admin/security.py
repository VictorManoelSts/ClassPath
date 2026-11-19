from collections import deque
from hmac import compare_digest
from secrets import token_urlsafe
from threading import Lock
from time import monotonic

from flask import jsonify, redirect, render_template, request, session, url_for
from werkzeug.security import check_password_hash


def init_security(app):
    sessions = {}
    login_attempts = deque()
    admin_requests = deque()
    lock = Lock()

    def allow(events, limit):
        now = monotonic()
        with lock:
            while events and now - events[0] >= 60:
                events.popleft()
            if len(events) >= limit:
                return False
            events.append(now)
            return True

    def csrf_token():
        if "csrf_token" not in session:
            session["csrf_token"] = token_urlsafe(32)
        return session["csrf_token"]

    def authenticated():
        with lock:
            return sessions.get(session.get("admin_session"), 0) > monotonic()

    @app.before_request
    def protect_admin():
        if request.endpoint in (None, "static"):
            return None
        is_login = request.endpoint == "login"
        if not is_login and not authenticated():
            if request.path.startswith(("/api/", "/materiais/")):
                return jsonify(erro="Autenticação necessária."), 401
            return redirect(url_for("login"))
        if request.method not in ("GET", "HEAD", "OPTIONS"):
            # Read the header first so a rejected upload need not be parsed.
            supplied = request.headers.get("X-CSRF-Token", "")
            if is_login or request.endpoint == "logout":
                supplied = supplied or request.form.get("csrf_token", "")
            expected = session.get("csrf_token")
            if not expected or not compare_digest(supplied.encode(), expected.encode()):
                return jsonify(erro="Token CSRF inválido ou ausente."), 403
            if not is_login and request.endpoint != "logout" and not allow(admin_requests, 60):
                return jsonify(erro="Limite de operações atingido."), 429, {"Retry-After": "60"}
        return None

    @app.after_request
    def protect_response(response):
        if request.endpoint != "static":
            response.headers["Cache-Control"] = "no-store"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; img-src 'self' data:; object-src 'none'; "
            "base-uri 'none'; frame-ancestors 'none'; form-action 'self'"
        )
        return response

    @app.route("/login", methods=["GET", "POST"])
    def login():
        if authenticated():
            return redirect(url_for("web.index"))
        if request.method == "POST":
            if not allow(login_attempts, 8):
                return render_template("login.html", erro="Aguarde um minuto e tente novamente."), 429, {"Retry-After": "60"}
            username = request.form.get("username", "")
            password = request.form.get("password", "")
            password_ok = len(password) <= 256 and check_password_hash(app.config["ADMIN_PASSWORD_HASH"], password)
            if not (password_ok and compare_digest(username.encode(), app.config["ADMIN_USERNAME"].encode())):
                return render_template("login.html", erro="Credenciais inválidas."), 401
            session.clear()
            sid = token_urlsafe(32)
            now = monotonic()
            with lock:
                for expired in [key for key, expires in sessions.items() if expires <= now]:
                    del sessions[expired]
                sessions[sid] = now + app.permanent_session_lifetime.total_seconds()
            session["admin_session"] = sid
            session.permanent = True
            return redirect(url_for("web.index"))
        return render_template("login.html")

    @app.post("/logout")
    def logout():
        with lock:
            sessions.pop(session.get("admin_session"), None)
        session.clear()
        return redirect(url_for("login"))

    app.jinja_env.globals["csrf_token"] = csrf_token
