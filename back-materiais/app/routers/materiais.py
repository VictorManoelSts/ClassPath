from datetime import datetime, timezone
from typing import List, Optional

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

from app.database import fs_bucket
from app.models import MaterialMetadata

router = APIRouter(prefix="/materiais", tags=["materiais"])

CONTENT_TYPE_PDF = "application/pdf"


def _to_object_id(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except InvalidId:
        raise HTTPException(status_code=400, detail="ID de arquivo inválido.")


@router.post("", status_code=201, response_model=MaterialMetadata)
async def upload_material(
    disciplina: str = Form(..., description="Identificador/nome da disciplina"),
    file: UploadFile = File(..., description="Arquivo PDF do slide/material"),
):
    """
    Recebe um PDF do Front Admin, salva no GridFS e devolve os metadados
    (incluindo o file_id que deve ser usado depois para download).
    """
    if file.content_type != CONTENT_TYPE_PDF:
        raise HTTPException(status_code=400, detail="Apenas arquivos PDF são aceitos.")

    conteudo = await file.read()
    if not conteudo:
        raise HTTPException(status_code=400, detail="Arquivo vazio.")

    data_upload = datetime.now(timezone.utc)

    file_id = await fs_bucket.upload_from_stream(
        file.filename,
        conteudo,
        metadata={
            "disciplina": disciplina,
            "content_type": file.content_type,
            "data_upload": data_upload.isoformat(),
        },
    )

    return MaterialMetadata(
        id=str(file_id),
        nome=file.filename,
        disciplina=disciplina,
        data_upload=data_upload,
        tamanho=len(conteudo),
        content_type=file.content_type,
    )


@router.get("", response_model=List[MaterialMetadata])
async def listar_materiais(
    disciplina: Optional[str] = None,
):
    """
    Lista os materiais cadastrados. Se `disciplina` for informado,
    filtra apenas os arquivos daquela disciplina.
    """
    query = {}
    if disciplina:
        query["metadata.disciplina"] = disciplina

    resultados: List[MaterialMetadata] = []
    cursor = fs_bucket.find(query).sort("uploadDate", -1)
    async for grid_out in cursor:
        meta = grid_out.metadata or {}
        data_upload_raw = meta.get("data_upload")
        data_upload = (
            datetime.fromisoformat(data_upload_raw)
            if data_upload_raw
            else grid_out.upload_date
        )
        resultados.append(
            MaterialMetadata(
                id=str(grid_out._id),
                nome=grid_out.filename,
                disciplina=meta.get("disciplina", ""),
                data_upload=data_upload,
                tamanho=grid_out.length,
                content_type=meta.get("content_type"),
            )
        )
    return resultados


@router.get("/{file_id}")
async def baixar_material(file_id: str):
    """
    Faz o streaming do conteúdo binário do arquivo para download.
    """
    oid = _to_object_id(file_id)

    try:
        grid_out = await fs_bucket.open_download_stream(oid)
    except Exception:
        raise HTTPException(status_code=404, detail="Arquivo não encontrado.")

    async def stream_gerador():
        while True:
            chunk = await grid_out.readchunk()
            if not chunk:
                break
            yield chunk

    meta = grid_out.metadata or {}
    content_type = meta.get("content_type", CONTENT_TYPE_PDF)

    return StreamingResponse(
        stream_gerador(),
        media_type=content_type,
        headers={
            "Content-Disposition": f'attachment; filename="{grid_out.filename}"'
        },
    )
