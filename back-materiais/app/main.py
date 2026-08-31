from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import materiais

app = FastAPI(
    title="ClassPath - Back Materiais",
    description=(
        "Serviço responsável pelo upload, armazenamento (MongoDB + GridFS) "
        "e download dos arquivos de slide de cada disciplina. Não conhece "
        "grade de horários, avisos ou disciplinas cadastradas — 'disciplina' "
        "é apenas um identificador recebido junto do arquivo."
    ),
    version="1.0.0",
)

# CORS liberado para os fronts (Aluno/React, Admin/Vue) e o app mobile
# consumirem a API livremente. Sem autenticação nesta entrega.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(materiais.router)


@app.get("/", tags=["status"])
async def status():
    return {"status": "ok", "service": "back-materiais"}
