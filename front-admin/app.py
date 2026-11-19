import re

from flask import Flask
from config import Config
from security import init_security


def create_app(overrides=None):
    app = Flask(__name__)
    app.config.from_object(Config)
    app.config.update(overrides or {})

    for name in ("SECRET_KEY", "ADMIN_USERNAME", "ADMIN_PASSWORD_HASH",
                 "ACADEMIC_ADMIN_TOKEN", "MATERIALS_ADMIN_TOKEN", "URL_SPRING_BOOT", "URL_FASTAPI"):
        if not app.config[name] or not app.config[name].strip():
            raise RuntimeError(f"Configure {name} no ambiente do Front Admin")
    if len(app.config["SECRET_KEY"]) < 32:
        raise RuntimeError("SECRET_KEY deve ter pelo menos 32 caracteres aleatorios")
    if not re.fullmatch(r"scrypt:32768:8:1\$[A-Za-z0-9]{16,64}\$[a-f0-9]{128}", app.config["ADMIN_PASSWORD_HASH"]):
        raise RuntimeError("ADMIN_PASSWORD_HASH deve ser gerado com Werkzeug scrypt:32768:8:1")
    for name in ("ACADEMIC_ADMIN_TOKEN", "MATERIALS_ADMIN_TOKEN"):
        if not re.fullmatch(r"[A-Za-z0-9_-]{43,72}", app.config[name]):
            raise RuntimeError(f"{name} deve ter de 43 a 72 caracteres base64url")
    if app.config["ACADEMIC_ADMIN_TOKEN"] == app.config["MATERIALS_ADMIN_TOKEN"]:
        raise RuntimeError("Configure tokens distintos para as APIs Academica e de Materiais")

    init_security(app)
    from routes.web import web_bp
    app.register_blueprint(web_bp)
    return app


if __name__ == "__main__":
    create_app().run(host="127.0.0.1", port=5000)
