# Back-end Acadêmico — ClassPath

API RESTful para gestão acadêmica de disciplinas, horários e avisos. Desenvolvido com Java, Spring Boot, Spring Data JPA e PostgreSQL.

O projeto foi refatorado para adotar padrões de engenharia de software de nível profissional, garantindo melhor separação de responsabilidades, segurança no tráfego de dados e facilidade de deploy.

## Estrutura da Arquitetura

O projeto utiliza a arquitetura em camadas padrão de mercado:

```text
Frontend → Controller → Service → Repository → PostgreSQL
```

- **`model`**: Classes de entidade mapeadas pelo Hibernate (representam as tabelas do banco).
- **`repository`**: Interfaces do Spring Data JPA usadas para consultar e persistir dados.
- **`service`**: **[NOVO]** Coração da aplicação. Centraliza todas as regras de negócio, cálculos, tratamentos de strings e validações complexas.
- **`controller`**: Responsável apenas por receber requisições HTTP, delegar o processamento para a camada Service e devolver a resposta adequada.
- **`dto`**: **[NOVO]** Objetos de Transferência de Dados. Usados para blindar a API contra "Over-Posting" e separar os dados da web das entidades do banco.
- **`exception`**: Classes como `BusinessRuleException` e o `GlobalExceptionHandler` que interceptam erros e devolvem JSONs amigáveis e padronizados.

## Principais Regras de Negócio (Camada Service)

A adoção da camada Service permitiu implementar proteções críticas, como:
- **Prevenção de Conflitos:** O `HorarioService` impede que duas aulas sejam agendadas para a mesma sala, no mesmo dia, com horários sobrepostos.
- **Validação Lógica:** Verificação automática se o horário de término de uma aula é posterior ao horário de início.
- **Exclusão Segura:** O `DisciplinaService` impede a exclusão de uma disciplina caso ela já possua horários ou avisos atrelados.

## Tecnologias

- Java (17)
- Spring Boot 3.3.2
- Spring Web (API REST)
- Spring Data JPA / Hibernate
- Jakarta Bean Validation
- PostgreSQL 16
- Maven
- Docker e Docker Compose (Infraestrutura)
- SpringDoc OpenAPI (Swagger)

## Como executar (Ambiente Dockerizado)

A aplicação foi preparada para rodar via Docker, isolando o banco de dados e a API da sua máquina local.

### Requisitos
- Docker e Docker Compose instalados.

### 1. Configurar Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto contendo as variáveis de acesso:

```properties
POSTGRES_DB=classpath
POSTGRES_USER=postgres
POSTGRES_PASSWORD=senha_super_segura
SHOW_SQL=false
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

### 2. Subir a Infraestrutura

Execute o comando abaixo para compilar a aplicação e subir os contêineres:

```bash
docker compose up -d --build
```
*O banco de dados é acessado internamente pela rede do Docker, garantindo maior segurança ao não expor a porta 5432 externamente.*

### 3. Acessar a Aplicação e Documentação
- **API Base:** `http://localhost:8080/api`
- **Swagger UI:** `http://localhost:8080/swagger-ui.html`

*(Caso prefira rodar localmente sem o contêiner do Spring Boot, você pode iniciar apenas o PostgreSQL via Docker e rodar a aplicação usando `mvn spring-boot:run`)*.

## Resumo dos Endpoints

Abaixo estão as rotas principais, atualizadas com o prefixo `/api`.

### Disciplinas (`/api/disciplinas`)
- `GET /api/disciplinas` - Lista todas
- `GET /api/disciplinas/{id}` - Busca uma
- `POST /api/disciplinas` - Cadastra
- `PUT /api/disciplinas/{id}` - Atualiza
- `DELETE /api/disciplinas/{id}` - Exclui

### Horários (`/api/horarios`)
- `GET /api/horarios` - Lista todos
- `GET /api/horarios?disciplinaId=1` - Filtra por disciplina
- `POST /api/horarios` - Cadastra
- `PUT /api/horarios/{id}` - Atualiza
- `DELETE /api/horarios/{id}` - Exclui

### Avisos (`/api/avisos`)
- `GET /api/avisos` - Lista todos
- `GET /api/avisos?disciplinaId=1` - Filtra por disciplina
- `POST /api/avisos` - Cadastra
- `PUT /api/avisos/{id}` - Atualiza
- `DELETE /api/avisos/{id}` - Exclui

## Respostas HTTP Padronizadas

| Código | Significado |
|---|---|
| 200 OK | Consulta ou atualização realizada com sucesso |
| 201 Created | Cadastro realizado com sucesso |
| 204 No Content | Exclusão realizada com sucesso |
| 400 Bad Request | Erro de validação de campo, JSON malformado ou violação de regra de negócio (ex: conflito de horários) |
| 404 Not Found | Registro não encontrado pelo ID informado |
| 409 Conflict | Violação de integridade (ex: excluir disciplina em uso) |

## Testes

Para rodar os testes de contexto do Spring (que utilizam um banco em memória H2 sem afetar o banco principal), execute:

```bash
mvn test
```