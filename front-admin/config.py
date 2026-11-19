import os
from datetime import timedelta

from dotenv import load_dotenv

load_dotenv()


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY")
    ADMIN_USERNAME = os.getenv("ADMIN_USERNAME")
    ADMIN_PASSWORD_HASH = os.getenv("ADMIN_PASSWORD_HASH")
    ACADEMIC_ADMIN_TOKEN = os.getenv("ACADEMIC_ADMIN_TOKEN")
    MATERIALS_ADMIN_TOKEN = os.getenv("MATERIALS_ADMIN_TOKEN")
    URL_SPRING_BOOT = os.getenv("URL_SPRING_BOOT")
    URL_FASTAPI = os.getenv("URL_FASTAPI")
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    SESSION_COOKIE_SECURE = os.getenv("SESSION_COOKIE_SECURE", "true").strip().lower() != "false"
    PERMANENT_SESSION_LIFETIME = timedelta(minutes=30)
    SESSION_REFRESH_EACH_REQUEST = False
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024
    MATERIALS_MAX_UPLOAD_BYTES = int(os.getenv("MATERIALS_MAX_UPLOAD_BYTES", "20971520"))
