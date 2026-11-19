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

### Configuração e execução

O [guia de segurança](../docs/seguranca.md) mostra como gerar o hash da senha de login, a chave de sessão e os tokens independentes das APIs.

Prefira o Compose da raiz para executar os serviços na mesma rede. Para executar apenas o BFF, use `.env.example` deste diretório e preencha `URL_SPRING_BOOT` e `URL_FASTAPI` com os endereços alcançáveis pelo processo Flask. Em Docker Desktop, `host.docker.internal` representa o host, desde que as APIs estejam acessíveis por esse endereço. Quando o Flask roda no host, `localhost` aponta para o host.

Neste diretório, execute `docker compose up -d --build` para iniciar o painel em `http://localhost:5000/login` e `docker compose down` para parar. Em HTTP local, use `SESSION_COOKIE_SECURE=false`. Em HTTPS, use `true`.

Para executar os testes unitários após instalar `requirements.txt`, rode `python -m unittest discover -s tests -v`.
