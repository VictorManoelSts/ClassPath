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
CMD ["flask", "run", "--host=0.0.0.0", "--port=5000"]