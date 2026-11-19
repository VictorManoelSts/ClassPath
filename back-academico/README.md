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

### Configuração local

Preencha o `.env` a partir de `.env.example` e siga o [guia de segurança](../docs/seguranca.md) para gerar os segredos. Neste diretório, execute `docker compose up -d --build`. O PostgreSQL é acessível pela rede do Compose, e a API escuta em `127.0.0.1:8080` por padrão.

As leituras em `http://localhost:8080/api` são públicas. Para operações de escrita ou acesso a `/v3/api-docs` e ao Swagger, use uma ferramenta HTTP com `Authorization: Bearer …` e o token de serviço. O Flask aplica esse cabeçalho às escritas no servidor.

Para rodar com `mvn spring-boot:run`, exporte as variáveis de ambiente no shell antes de iniciar o Java e aponte para um PostgreSQL acessível a partir do host. O Spring não carrega `.env` diretamente. Use o perfil `dev` somente para o banco de desenvolvimento.

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