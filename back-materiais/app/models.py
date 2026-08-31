from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class MaterialMetadata(BaseModel):
    """Metadados de um arquivo de material armazenado no GridFS."""

    id: str = Field(..., description="file_id do arquivo no GridFS")
    nome: str = Field(..., description="Nome original do arquivo")
    disciplina: str = Field(..., description="Identificador/nome da disciplina associada")
    data_upload: datetime = Field(..., description="Data/hora do upload (UTC)")
    tamanho: int = Field(..., description="Tamanho do arquivo em bytes")
    content_type: Optional[str] = Field(default=None, description="Content-Type do arquivo")
