# Back Materiais — ClassPath

Serviço em **Python + FastAPI** responsável por upload, armazenamento e
download dos arquivos de slide de cada disciplina do ClassPath. Faz parte
independente do sistema descrito em `documentacao_classpath.md` (seção 4).

## O que este serviço faz

- Recebe upload de arquivos **PDF**.
- Armazena o conteúdo binário no **MongoDB via GridFS**.
- Guarda metadados de cada arquivo: nome sanitizado, disciplina, data de
  upload e o `file_id` (o próprio `_id` gerado pelo GridFS).
- Lista e permite baixar os arquivos, com filtro opcional por disciplina.

## O que este serviço NÃO faz (por design)

- Não conhece grade de horários, avisos ou o cadastro de disciplinas do
  Back Acadêmico. O campo `disciplina` é tratado como um texto livre
  recebido junto do arquivo — **não há validação cruzada com o outro back**.
- Não se comunica diretamente com o Back Acadêmico (Java/Spring). Quem une
  as informações das duas partes é sempre o front ou o app mobile.

## Estrutura do projeto

```
back-materiais/
├── app/
│   ├── main.py              # instância FastAPI, CORS, inclui o router
│   ├── database.py          # conexão com Mongo + bucket do GridFS
│   ├── models.py            # schema Pydantic de resposta (MaterialMetadata)
│   └── routers/
│       └── materiais.py     # upload, listagem, download e exclusão
├── requirements.txt
├── Dockerfile
├── docker-compose.yml       # sobe Mongo + API juntos
└── .env.example
```

## Como rodar

### Opção 1 — Docker (recomendado, sobe Mongo + API juntos)

```bash
cd back-materiais
# Preencha .env a partir de .env.example antes de iniciar.
docker compose up --build
```

A API sobe em `http://localhost:8000`. O MongoDB fica na rede interna do Compose.
Documentação interativa (Swagger) em `http://localhost:8000/docs`.

Tanto o Compose da raiz quanto o standalone exigem
`MONGO_INITDB_ROOT_PASSWORD` e `MONGO_APP_PASSWORD` no `.env` correspondente.
Use senhas independentes. Os nomes padrão são `classpath_mongo_admin`
(`MONGO_INITDB_ROOT_USERNAME`) e `classpath_materiais_api` (`MONGO_APP_USER`).
Em um volume novo, a inicialização cria as duas contas. A API usa somente a
conta com `readWrite` em `MONGO_DB_NAME`. Restrinja
`CORS_ALLOWED_ORIGINS` às origens do Front Aluno que acessam a API.
O Compose da raiz aceita `MATERIALS_CORS_ALLOWED_ORIGINS` para Materiais
quando a lista precisa ser diferente da do Back Acadêmico.

#### Volume MongoDB existente

Faça um backup, mantenha o mesmo projeto Compose, volume e
`MONGO_DB_NAME`, e pare a pilha. A inicialização automática roda
somente em volumes novos. Com as variáveis preenchidas, suba apenas o
MongoDB com `docker compose up -d mongo`. Se o volume veio da versão sem
autenticação e ainda não tem usuários, crie a primeira conta pelo acesso
local do próprio contêiner, usando os valores do ambiente:

```bash
docker compose exec mongo mongosh --quiet --eval 'db.getSiblingDB("admin").createUser({user: process.env.MONGO_INITDB_ROOT_USERNAME, pwd: process.env.MONGO_INITDB_ROOT_PASSWORD, roles: ["root"]})'
```

Crie a conta da API autenticando como administrador. O cliente pedirá a senha:

```bash
docker compose exec mongo sh -c 'mongosh --quiet --username "$MONGO_INITDB_ROOT_USERNAME" --authenticationDatabase admin --file /docker-entrypoint-initdb.d/10-materials.js --password'
```

Se já houver usuários, use uma conta administrativa existente para criar
a conta da API e configure as credenciais do healthcheck de acordo.
Em seguida, suba a pilha com `docker compose up -d --build` e confira a
listagem e um download existente. Preserve o volume `mongo_data` durante
todo o procedimento.

### Opção 2 — Local, sem Docker

Pré-requisito: ter um MongoDB com autenticação (local ou Atlas).

```bash
cd back-materiais
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Exporte MATERIALS_ADMIN_TOKEN_HASH e CORS_ALLOWED_ORIGINS conforme ../docs/seguranca.md.
# Exporte MONGO_URI com a URI autenticada ou use MONGO_APP_USER e
# MONGO_APP_PASSWORD com o usuário autenticado em MONGO_DB_NAME.
export MONGO_DB_NAME="classpath_materiais"

uvicorn app.main:app --reload --port 8000
```

## Endpoints

A API usa o prefixo `/api`. Listagem e download são públicos. Upload e exclusão exigem o token de serviço de Materiais no cabeçalho Bearer. O painel Flask envia esse token pelo servidor. Consulte o [guia de segurança](../docs/seguranca.md).

### `POST /materiais` — upload

Recebe `multipart/form-data`:

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `disciplina` | texto (form field) | sim | Identificador/nome da disciplina |
| `file` | arquivo | sim | Deve ser `application/pdf` |

Exemplo:

```bash
curl -X POST http://localhost:8000/api/materiais \
  -H "Authorization: Bearer $MATERIALS_ADMIN_TOKEN" \
  -F "disciplina=Web-Mobile" \
  -F "file=@aula1.pdf;type=application/pdf"
```

Resposta `201`:

```json
{
  "id": "66d1f2a1c8b9a2e4f1a2b3c4",
  "nome": "aula1.pdf",
  "disciplina": "Web-Mobile",
  "data_upload": "2026-08-22T18:00:00.000000+00:00",
  "tamanho": 152340,
  "content_type": "application/pdf"
}
```

O limite padrão é de 20 MiB por arquivo, configurável em bytes por
`MATERIALS_MAX_UPLOAD_BYTES`. Use o mesmo valor no Front Admin e no Back
Materiais se estiverem em pilhas separadas. O multipart admite até 64 KiB
adicionais. Excesso retorna `413` e PDF inválido retorna `400`.
A validação verifica assinatura, final e estrutura básica da referência
cruzada. O upload usa arquivo temporário quando o multipart ultrapassa
o limiar de spool e grava no GridFS em blocos.

### `GET /materiais?disciplina=` — listagem

`disciplina` é opcional. Para paginar, use `limit` (1 a 100) e
`offset` (a partir de 0). Clientes que omitem ambos recebem a lista
completa, com o mesmo array JSON.

```bash
curl "http://localhost:8000/api/materiais?disciplina=Web-Mobile"
```

Resposta `200`: lista de objetos no mesmo formato do upload (array de
`MaterialMetadata`).

### `GET /materiais/{id}` — download

```bash
curl -OJ http://localhost:8000/api/materiais/66d1f2a1c8b9a2e4f1a2b3c4
```

Faz streaming com `Content-Type: application/pdf`,
`X-Content-Type-Options: nosniff` e `Content-Disposition: attachment`
com nome sanitizado no cabeçalho, inclusive para registros antigos.
Retorna `404` se o `id` não existir e `400` se o `id` não for um
ObjectId válido.

## Decisões de implementação

- **Sem coleção extra de metadados**: os metadados (`disciplina`,
  `content_type`, `data_upload`) ficam guardados no próprio campo
  `metadata` do documento que o GridFS já cria em `materiais.files`. Isso
  evita duplicar dados em duas coleções e mantém `file_id` == `_id` do
  GridFS, exatamente como pedido na especificação.
- **Streaming no download**: o arquivo é lido em chunks
  (`StreamingResponse`) em vez de carregado inteiro na memória, para lidar
  bem com PDFs grandes.
- **CORS** permite leituras das origens Angular configuradas em CORS_ALLOWED_ORIGINS.

## Testando

```bash
python -m pip install -r requirements.txt httpx2
python -m unittest discover -s tests -v
python -m pip install pip-audit
pip-audit -r requirements.txt
```

O teste integrado da pilha está em `front-admin/tests/integration_smoke.py`.

### Auditoria Python

O `pip-audit` encontrou cinco avisos no PyMongo 4.8.0. As versões mínimas
corrigidas são:

| Aviso | Versão corrigida |
|---|---|
| PYSEC-2026-4294 | 4.18.1 |
| PYSEC-2026-4295, PYSEC-2026-4296, PYSEC-2026-4297 | 4.18.2 |
| CVE-2026-106435 | 4.18.3 |

O serviço usa PyMongo 4.18.3 com GridFS assíncrono. O bucket, o formato
GridFS e os IDs existentes continuam os mesmos. [Versões do driver](https://github.com/mongodb/mongo-python-driver/releases) · [CVE-2026-106435](https://github.com/advisories/GHSA-98qm-wvgf-w4cf)

A auditoria do Front Admin também encontrou a CVE-2026-28684
(PYSEC-2026-2270) no python-dotenv 1.0.1. A correção começa na 1.2.2.
[Aviso do mantenedor](https://github.com/theskumar/python-dotenv/security/advisories/GHSA-mf9w-mj56-hr94)

## Resumo para a documentação LaTeX do grupo

Trecho pronto para incorporar na seção "Metodologia e divisão de tarefas"
do relatório (`documentacao_classpath.md`, seção 9):

> O Back Materiais foi implementado em Python com FastAPI, responsável
> pelo upload, armazenamento e download dos arquivos de slide de cada
> disciplina. Os arquivos PDF são armazenados como conteúdo binário no
> MongoDB através do GridFS, mecanismo do próprio banco voltado para
> arquivos grandes, junto com metadados (nome, disciplina, data de
> upload). O serviço expõe upload e exclusão com token administrativo
> e listagem filtrável e download públicos. O campo disciplina é um
> identificador textual recebido junto do arquivo.
