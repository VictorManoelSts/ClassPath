# Back Materiais — ClassPath

Serviço em **Python + FastAPI** responsável por upload, armazenamento e
download dos arquivos de slide de cada disciplina do ClassPath. Faz parte
independente do sistema descrito em `documentacao_classpath.md` (seção 4).

## O que este serviço faz

- Recebe upload de arquivos **PDF**.
- Armazena o conteúdo binário no **MongoDB via GridFS**.
- Guarda metadados de cada arquivo: nome original, disciplina, data de
  upload e o `file_id` (o próprio `_id` gerado pelo GridFS).
- Lista e permite baixar os arquivos, com filtro opcional por disciplina.

## O que este serviço NÃO faz (por design)

- Não conhece grade de horários, avisos ou o cadastro de disciplinas do
  Back Acadêmico. O campo `disciplina` é tratado como um texto livre
  recebido junto do arquivo — **não há validação cruzada com o outro back**.
- Não tem autenticação nesta entrega.
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
│       └── materiais.py     # os 3 endpoints (upload / listar / baixar)
├── requirements.txt
├── Dockerfile
├── docker-compose.yml       # sobe Mongo + API juntos
└── .env.example
```

## Como rodar

### Opção 1 — Docker (recomendado, sobe Mongo + API juntos)

```bash
cd back-materiais
docker compose up --build
```

A API sobe em `http://localhost:8000` e o Mongo em `localhost:27017`.
Documentação interativa (Swagger) em `http://localhost:8000/docs`.

### Opção 2 — Local, sem Docker

Pré-requisito: ter um MongoDB rodando (local ou Atlas).

```bash
cd back-materiais
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# opcional: copie .env.example para .env e ajuste MONGO_URI se necessário
export MONGO_URI="mongodb://localhost:27017"
export MONGO_DB_NAME="classpath_materiais"

uvicorn app.main:app --reload --port 8000
```

## Endpoints

### `POST /materiais` — upload

Recebe `multipart/form-data`:

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `disciplina` | texto (form field) | sim | Identificador/nome da disciplina |
| `file` | arquivo | sim | Deve ser `application/pdf` |

Exemplo:

```bash
curl -X POST http://localhost:8000/materiais \
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

Se o arquivo enviado não for PDF, retorna `400`.

### `GET /materiais?disciplina=` — listagem

`disciplina` é opcional. Sem o parâmetro, lista todos os materiais.

```bash
curl "http://localhost:8000/materiais?disciplina=Web-Mobile"
```

Resposta `200`: lista de objetos no mesmo formato do upload (array de
`MaterialMetadata`).

### `GET /materiais/{id}` — download

```bash
curl -OJ http://localhost:8000/materiais/66d1f2a1c8b9a2e4f1a2b3c4
```

Faz streaming do conteúdo binário com o `Content-Type` original e
`Content-Disposition: attachment` (nome original do arquivo preservado).
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
- **Validação mínima**: só valida `Content-Type == application/pdf` no
  upload. Não valida a disciplina contra nenhum cadastro (intencional,
  conforme a especificação).
- **CORS liberado (`*`)**: como não há autenticação nesta entrega e o
  serviço é consumido por três frontends diferentes (Front Aluno, Front
  Admin, App Mobile), o CORS foi deixado aberto para simplificar a
  integração. Isso deve ser restringido em uma entrega futura, junto com a
  autenticação.

## Testando

O upload, o filtro por disciplina e o download foram validados
manualmente durante o desenvolvimento (fluxo completo via FastAPI +
GridFS). Para rodar testes automatizados de ponta a ponta, o mais simples
é subir o `docker-compose.yml` (Mongo real) e usar o Swagger em `/docs`
ou `curl`/Postman contra os três endpoints.

## Resumo para a documentação LaTeX do grupo

Trecho pronto para incorporar na seção "Metodologia e divisão de tarefas"
do relatório (`documentacao_classpath.md`, seção 9):

> O Back Materiais foi implementado em Python com FastAPI, responsável
> pelo upload, armazenamento e download dos arquivos de slide de cada
> disciplina. Os arquivos PDF são armazenados como conteúdo binário no
> MongoDB através do GridFS, mecanismo do próprio banco voltado para
> arquivos grandes, junto com metadados (nome, disciplina, data de
> upload). O serviço expõe três endpoints REST — upload, listagem
> filtrável por disciplina e download — e não depende nem valida
> informações do Back Acadêmico, tratando a disciplina apenas como um
> identificador textual recebido junto do arquivo. Não há autenticação
> nesta entrega.
