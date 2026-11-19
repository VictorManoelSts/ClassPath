# Usamos uma imagem oficial e leve do Python
FROM python:3.12-slim

# Definimos o diretório de trabalho dentro do container
WORKDIR /app

# Copiamos o arquivo de dependências primeiro (otimiza o cache do build)
COPY requirements.txt .

# Instalamos as bibliotecas (Flask, Requests, etc) sem guardar cache inútil
RUN pip install --no-cache-dir -r requirements.txt

# Copiamos o restante do código do projeto para dentro do container
COPY . .

# Sinalizamos que o container vai se comunicar pela porta 5000
EXPOSE 5000

# O comando que mantém o BFF rodando, escutando conexões externas (0.0.0.0)
CMD ["python", "-c", "from app import create_app; from waitress import serve; app = create_app(); serve(app, listen='0.0.0.0:5000', max_request_body_size=max(app.config['MAX_CONTENT_LENGTH'], app.config['MATERIALS_MAX_UPLOAD_BYTES'] + 65536))"]
