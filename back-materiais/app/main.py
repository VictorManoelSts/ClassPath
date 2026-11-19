import logging
import os
import re
from contextlib import asynccontextmanager
from hashlib import sha256
from hmac import compare_digest

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pymongo.errors import ConnectionFailure, PyMongoError

from app.database import client
from app.routers import materiais

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app):
    token_hash = os.getenv("MATERIALS_ADMIN_TOKEN_HASH", "")
    if not re.fullmatch(r"[a-f0-9]{64}", token_hash):
        raise RuntimeError("Configure MATERIALS_ADMIN_TOKEN_HASH com o SHA-256 do token de serviço")
    app.state.admin_token_hash = token_hash
    limit = os.getenv("MATERIALS_MAX_UPLOAD_BYTES", "20971520")
    if not re.fullmatch(r"[1-9][0-9]{0,9}", limit):
        raise RuntimeError("Configure MATERIALS_MAX_UPLOAD_BYTES com um inteiro positivo.")
    app.state.max_upload_bytes = int(limit)
    try:
        yield
    finally:
        await client.close()


app = FastAPI(
    lifespan=lifespan,
    title="ClassPath - Back Materiais",
    description=(
        "Serviço responsável pelo upload, armazenamento (MongoDB + GridFS) "
        "e download dos arquivos de slide de cada disciplina. Não conhece "
        "grade de horários, avisos ou disciplinas cadastradas — 'disciplina' "
        "é apenas um identificador recebido junto do arquivo."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in os.getenv("CORS_ALLOWED_ORIGINS", "").split(",")
                   if origin.strip() and "*" not in origin],
    allow_methods=["GET", "HEAD"],
    allow_headers=["Accept", "Content-Type"],
)


@app.middleware("http")
async def authorize_writes(request: Request, call_next):
    if request.method not in ("GET", "HEAD", "OPTIONS"):
        scheme, _, token = request.headers.get("Authorization", "").partition(" ")
        if (scheme.lower() != "bearer" or not re.fullmatch(r"[A-Za-z0-9_-]{43,72}", token)
                or not compare_digest(sha256(token.encode()).hexdigest(), request.app.state.admin_token_hash)):
            return JSONResponse({"detail": "Autenticação necessária."}, status_code=401,
                                headers={"WWW-Authenticate": "Bearer"})
    return await call_next(request)


app.include_router(materiais.router)


@app.exception_handler(PyMongoError)
async def database_error(request: Request, exc: PyMongoError):
    logger.error("Falha no GridFS (%s)", type(exc).__name__)
    if isinstance(exc, ConnectionFailure):
        return JSONResponse({"detail": "Armazenamento indisponível."}, status_code=503)
    return JSONResponse({"detail": "Erro interno."}, status_code=500)


@app.get("/", tags=["status"])
async def status():
    return {"status": "ok", "service": "back-materiais"}
