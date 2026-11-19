# ClassPath — Sistema de Gestão Acadêmica

Plataforma completa para gestão acadêmica de disciplinas, horários, avisos e materiais didáticos. O sistema foi desenhado utilizando uma arquitetura de microsserviços e interfaces independentes para garantir escalabilidade, organização e separação de responsabilidades.

## 🏗️ Arquitetura do Ecossistema

O projeto é dividido em cinco componentes principais, cada um com sua responsabilidade específica:

1. **Back-end Acadêmico (Java/Spring Boot):** API RESTful que gerencia o CRUD relacional do sistema (Disciplinas, Horários e Avisos) e valida as principais regras de negócio.
2. **Back de Materiais (Python/FastAPI):** Microsserviço independente responsável exclusivamente pelo upload, armazenamento em GridFS e download de arquivos PDF (slides e materiais das aulas).
3. **Front Admin / BFF (Python/Flask):** Painel Administrativo construído sob o padrão Backend-For-Frontend (BFF). Atua como um proxy inteligente, interceptando rotas, formulários de upload e streaming de arquivos para não expor os microsserviços diretamente.
4. **Front Aluno (Angular):** Interface web (SPA) consumida pelos estudantes para visualização da grade, avisos e download de materiais.
5. **Mobile (Android/Kotlin):** Aplicativo desenvolvido em Kotlin e Jetpack Compose que oferece a mesma experiência do Front Aluno na palma da mão[cite: 5]. Ele integra os dois back-ends de forma independente e não exige login nesta versão[cite: 5].

---

## 🚀 Tecnologias Utilizadas

* **Backend:** Java 17, Spring Boot 3.3.2, Python 3.12+, FastAPI, Flask
* **Frontend Web:** Angular, HTML5, CSS3, Vanilla JavaScript
* **Frontend Mobile:** Android, Kotlin, Jetpack Compose[cite: 5]
* **Banco de Dados:** PostgreSQL 16 (Relacional), MongoDB / GridFS (NoSQL/Binários)
* **Infraestrutura:** Docker, Docker Compose, Nginx
* **Padrões e Integrações:** REST, Multipart/Form-Data, Streaming em Chunks, Padrão BFF, Injeção de dependências em tempo de build (Android)[cite: 5]

---

## ⚙️ Como Executar o Projeto

O ecossistema possui duas formas principais de execução: via Docker para os serviços web/APIs, e via Android Studio para o aplicativo mobile.

### 1. Serviços Web e APIs (Docker)

Com o Docker em execução, copie o `.env.example` da raiz para `.env` e gere as credenciais conforme o [guia de segurança](docs/seguranca.md). Na raiz, execute

```bash
docker compose up -d --build --wait
```

| Serviço | Endereço padrão |
| --- | --- |
| Front Aluno | http://localhost:5173 |
| Front Admin | http://localhost:5000 |
| Landing page | http://localhost:8081 |
| API Acadêmica (leitura pública) | http://localhost:8080/api/disciplinas |
| API de Materiais (Swagger) | http://localhost:8000/docs |

As portas são publicadas em `127.0.0.1`. Os contêineres se comunicam pelos nomes dos serviços do Compose. PostgreSQL e MongoDB usam volumes persistentes. Use `docker compose down` para parar a pilha preservando os dados.

### Trabalhar em um serviço por vez

Para iniciar serviços separadamente a partir de uma pilha parada, execute na raiz, na ordem abaixo. Cada comando espera o serviço iniciar e, quando há uma verificação de saúde, ficar pronto.

```bash
docker compose up -d --no-deps --wait postgres
docker compose up -d --no-deps --wait mongo
docker compose up -d --no-deps --wait back-academico
docker compose up -d --no-deps --wait back-materiais
docker compose up -d --no-deps --wait front-admin
docker compose up -d --no-deps --wait front-aluno
docker compose up -d --no-deps --wait landing-page
```

Com as dependências já rodando, reconstrua só o serviço alterado. Por exemplo, para o painel administrativo

```bash
docker compose up -d --build --no-deps --wait front-admin
```

Use o nome do serviço correspondente para atualizar o portal do aluno ou uma API. As alterações nos arquivos da landing page aparecem ao recarregar a página, pois o diretório é montado diretamente no contêiner.

### 2. Aplicativo Mobile (Android Studio)

O app Android foi projetado para rodar facilmente, mesmo sem a infraestrutura backend online[cite: 5].

1. Copie o arquivo `local.properties.example` para `local.properties`[cite: 5].
2. Ajuste as chaves de configuração, principalmente o caminho do SDK (`sdk.dir`) e as chaves de ambiente[cite: 5]:
    *   **`USE_MOCK=true`:** O app roda inteiro com dados fictícios (nenhum back-end precisa estar no ar)[cite: 5].
    *   **`USE_MOCK=false`:** No emulador Android, use `URL_ACADEMICO="http://10.0.2.2:8080/"` e `URL_MATERIAIS="http://10.0.2.2:8000/"` para acessar as APIs do Compose. Em dispositivo físico pela rede local, configure o endereço da máquina e publique as portas nesse endereço em `BIND_IP`.
3. Abra a pasta do projeto mobile no Android Studio e rode em um emulador ou dispositivo físico (minSdk 26)[cite: 5].

---

## 🧠 Regras de Negócio e Decisões de Design

* **Isolamento de Domínios:** O Back de Materiais não conhece a grade do Back Acadêmico. A união das informações (disciplinas + PDFs) ocorre exclusivamente nos clientes finais (Front Aluno e Mobile) sem que os back-ends se comuniquem diretamente[cite: 5].
* **Prevenção de Conflitos (Spring):** Validação automática para impedir conflitos de horários na mesma sala e bloqueio de exclusão de disciplinas em uso.
* **Armazenamento Otimizado (FastAPI):** Metadados dos materiais são salvos diretamente no documento `metadata` do MongoDB GridFS.
* **Streaming de Binários:** Tanto o FastAPI quanto o BFF (Flask) processam downloads enviando arquivos em blocos (*chunks*), evitando sobrecarga de RAM no servidor.
* **Injeção de Configuração (Mobile):** URLs e variáveis de ambiente são injetadas em tempo de build via `BuildConfig`, evitando que informações de rede fiquem hardcoded no repositório[cite: 5].

---

## 📡 Resumo de Endpoints (APIs)

### Back-end Acadêmico (`/api`)
* `/disciplinas` `[GET, POST, PUT, DELETE]` - Gestão de disciplinas.
* `/horarios` `[GET, POST, PUT, DELETE]` - Gestão da grade de horários (permite filtro `?disciplinaId=`).
* `/avisos` `[GET, POST, PUT, DELETE]` - Mural de recados (permite filtro `?disciplinaId=`).

### Back de Materiais (`/api/materiais`)
* `POST /api/materiais` - Envio de arquivo PDF via `multipart/form-data`.
* `GET /api/materiais` - Lista os arquivos (permite filtro `?disciplina=`).
* `GET /api/materiais/{id}` - Realiza o download do arquivo.
* `DELETE /api/materiais/{id}` - Deleta o material.
