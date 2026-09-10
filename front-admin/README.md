# ClassPath - Painel Administrativo (BFF)

Este repositório contém o Painel Administrativo do ecossistema **ClassPath**. O projeto foi desenhado sob o padrão arquitetural **Backend-For-Frontend (BFF)**, utilizando Python e Flask para centralizar, tratar e rotear requisições para os microsserviços de backend, garantindo uma interface leve, segura e desacoplada.

## 🏗️ Arquitetura

O BFF atua como um *proxy* inteligente e orquestrador rodando em um container Docker, comunicando-se com dois microsserviços independentes:

1. **Serviço Acadêmico (Spring Boot + PostgreSQL):** 
   - Gerencia o CRUD relacional do sistema (Disciplinas, Horários e Avisos).
   - O BFF consome e repassa dados no formato JSON.
2. **Serviço de Materiais (FastAPI + MongoDB/GridFS):**
   - Gerencia o armazenamento de arquivos binários pesados.
   - O BFF intercepta formulários `multipart/form-data`, encaminha o fluxo (stream) de upload para o FastAPI e gerencia o streaming de download em blocos (chunks) em tempo real para o navegador, sem sobrecarregar a memória RAM do container.

## 🚀 Tecnologias Utilizadas

* **Backend:** Python 3.12+, Flask, Requests
* **Frontend:** HTML5, CSS3 (Design System customizado e minimalista), Vanilla JavaScript
* **Infraestrutura:** Docker, Docker Compose
* **Integração:** Padrão REST, Multipart/Form-Data, Streaming de Binários

## ⚙️ Como Executar o Projeto

### 1. Pré-requisitos
Certifique-se de ter o **Docker** e o **Docker Compose** instalados na sua máquina. É necessário que os microsserviços do Spring Boot e FastAPI estejam em execução (seja localmente ou em um servidor remoto).

### 2. Configuração de Ambiente (.env)
A aplicação utiliza variáveis de ambiente para rotear as requisições sem expor IPs no código-fonte. 

Crie um arquivo `.env` na raiz do projeto (use o `.env.example` como base) e defina as URLs dos seus microsserviços:

```env
Exemplo para desenvolvimento local usando a rede do Docker:
URL_SPRING_BOOT=[http://host.docker.internal:8080/api](http://host.docker.internal:8080/api)
URL_FASTAPI=[http://host.docker.internal:8000/api](http://host.docker.internal:8000/api)

# Exemplo para produção/remoto (ex: via rede Tailscale):
# URL_SPRING_BOOT=[http://100.](http://100.)x.x.x:8080/api
# URL_FASTAPI=[http://100.](http://100.)x.x.x:8000/api


### 3. Subindo o Container

Com o arquivo .env configurado, construa e inicie o container do BFF executando o seguinte comando na raiz do projeto:
Bash

docker compose up -d --build

O painel administrativo estará acessível no seu navegador através de:
http://localhost:5000
4. Encerrando a Aplicação

Para parar o container, execute:
Bash

docker compose down