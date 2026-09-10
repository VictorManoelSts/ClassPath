import os
from dotenv import load_dotenv

# Carrega as variáveis do arquivo .env
load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-key-padrao')
    URL_SPRING_BOOT = os.getenv('URL_SPRING_BOOT')
    URL_FASTAPI = os.getenv('URL_FASTAPI')