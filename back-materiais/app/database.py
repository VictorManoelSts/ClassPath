import os

from gridfs import AsyncGridFSBucket
from pymongo import AsyncMongoClient

# URI e nome do banco configuráveis via variável de ambiente.
# Em desenvolvimento local (sem docker-compose), sobe um mongod em localhost:27017.
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "classpath_materiais")

credentials = {}
if os.getenv("MONGO_APP_USER") or os.getenv("MONGO_APP_PASSWORD"):
    credentials = {
        "username": os.environ["MONGO_APP_USER"],
        "password": os.environ["MONGO_APP_PASSWORD"],
        "authSource": MONGO_DB_NAME,
    }
client = AsyncMongoClient(MONGO_URI, serverSelectionTimeoutMS=4000, **credentials)
database = client[MONGO_DB_NAME]

# Bucket do GridFS. Cria automaticamente as coleções
# "materiais.files" (metadados) e "materiais.chunks" (conteúdo binário).
fs_bucket = AsyncGridFSBucket(database, bucket_name="materiais")
