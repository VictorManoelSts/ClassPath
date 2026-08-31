import os

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorGridFSBucket

# URI e nome do banco configuráveis via variável de ambiente.
# Em desenvolvimento local (sem docker-compose), sobe um mongod em localhost:27017.
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "classpath_materiais")

client = AsyncIOMotorClient(MONGO_URI)
database = client[MONGO_DB_NAME]

# Bucket do GridFS. Cria automaticamente as coleções
# "materiais.files" (metadados) e "materiais.chunks" (conteúdo binário).
fs_bucket = AsyncIOMotorGridFSBucket(database, bucket_name="materiais")
