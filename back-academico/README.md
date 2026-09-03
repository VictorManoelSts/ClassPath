# Back-end Acadêmico — ClassPath

Projeto acadêmico simples para cadastrar disciplinas, horários e avisos. Foi
desenvolvido com Java 17, Spring Boot, Spring Data JPA e PostgreSQL.

## Estrutura utilizada

O projeto utiliza um fluxo direto e fácil de apresentar:

```text
Frontend → Controller → Repository → PostgreSQL
```

- `model`: classes que representam as tabelas do banco.
- `repository`: interfaces usadas para consultar e alterar o banco.
- `controller`: recebe as requisições HTTP, faz validações simples e chama o repository.
- `dto`: usado somente em horários e avisos para receber `disciplinaId` e organizar a resposta.
- `exception`: transforma erros em respostas JSON compreensíveis.
- `config`: libera o acesso dos frontends por CORS.

Não foi criada uma camada `service` porque as regras do trabalho são pequenas e
podem ser entendidas diretamente nos controllers.

## Tecnologias

- Java 17
- Spring Boot 3.3.2
- Spring Web
- Spring Data JPA / Hibernate
- Bean Validation
- PostgreSQL
- Maven
- H2 somente para teste

## Banco de dados

Existem três tabelas:

| Tabela | Dados principais |
|---|---|
| `disciplinas` | id, nome e professor |
| `horarios` | id, disciplina, dia, início, fim e sala |
| `avisos` | id, título, descrição, disciplina e data |

Uma disciplina pode possuir vários horários e avisos. Por isso, `horarios` e
`avisos` guardam a chave estrangeira `disciplina_id`.

## Como executar

### Requisitos

- Java 17 ou superior
- Maven 3.8 ou superior
- PostgreSQL instalado ou Docker

### Opção 1: iniciar o PostgreSQL com Docker

```bash
docker compose up -d
```

### Opção 2: criar o banco manualmente

```sql
CREATE DATABASE classpath;
```

Por padrão, a aplicação usa:

```properties
URL=jdbc:postgresql://localhost:5432/classpath
USUARIO=postgres
SENHA=postgres
```

Esses valores podem ser alterados pelas variáveis `DATABASE_URL`,
`DATABASE_USERNAME` e `DATABASE_PASSWORD`.

### Iniciar a aplicação

```bash
mvn spring-boot:run
```

A API ficará disponível em `http://localhost:8080`. As tabelas serão criadas
automaticamente pelo Hibernate.

Para inserir dados de exemplo, execute manualmente o arquivo
`src/main/resources/data-exemplo.sql` depois de iniciar a aplicação.

## Endpoints de disciplinas

| Método | Rota | Operação |
|---|---|---|
| GET | `/disciplinas` | Lista todas |
| GET | `/disciplinas/{id}` | Busca uma |
| POST | `/disciplinas` | Cadastra |
| PUT | `/disciplinas/{id}` | Atualiza |
| DELETE | `/disciplinas/{id}` | Exclui |

Corpo de POST e PUT:

```json
{
  "nome": "Java",
  "professor": "Prof. Carlos Andrade"
}
```

Disciplina utiliza diretamente a entidade porque seus dados são simples. Não é
necessário um DTO somente para `nome` e `professor`.

## Endpoints de horários

| Método | Rota | Operação |
|---|---|---|
| GET | `/horarios` | Lista todos |
| GET | `/horarios?disciplinaId=1` | Filtra por disciplina |
| GET | `/horarios/{id}` | Busca um |
| POST | `/horarios` | Cadastra |
| PUT | `/horarios/{id}` | Atualiza |
| DELETE | `/horarios/{id}` | Exclui |

Corpo de POST e PUT:

```json
{
  "disciplinaId": 1,
  "diaSemana": "Segunda-feira",
  "horarioInicio": "19:00",
  "horarioFim": "20:40",
  "sala": "Sala 12"
}
```

O `HorarioRequestDTO` facilita o envio do ID da disciplina. O controller procura
a disciplina no banco, cria o objeto `Horario` e salva pelo repository. Também
verifica se o horário inicial é anterior ao horário final.

## Endpoints de avisos

| Método | Rota | Operação |
|---|---|---|
| GET | `/avisos` | Lista todos |
| GET | `/avisos?disciplinaId=1` | Filtra por disciplina |
| GET | `/avisos/{id}` | Busca um |
| POST | `/avisos` | Cadastra |
| PUT | `/avisos/{id}` | Atualiza |
| DELETE | `/avisos/{id}` | Exclui |

Corpo de POST e PUT:

```json
{
  "titulo": "Prova de Banco de Dados",
  "descricao": "A prova será realizada na próxima aula.",
  "disciplinaId": 1,
  "dataPublicacao": "2026-08-28"
}
```

Assim como em horário, o DTO permite que o frontend envie apenas
`disciplinaId`, sem precisar montar uma entidade `Disciplina` completa.

## Respostas HTTP

| Código | Significado |
|---|---|
| 200 | Consulta ou atualização realizada |
| 201 | Cadastro realizado |
| 204 | Exclusão realizada |
| 400 | Campo, JSON ou horário inválido |
| 404 | Registro não encontrado |
| 409 | Disciplina não pode ser excluída porque está sendo utilizada |

## Teste

Execute:

```bash
mvn test
```

O teste verifica se o contexto do Spring consegue iniciar. Ele usa um banco H2
em memória e não altera o PostgreSQL local.

## Observação

Autenticação não foi implementada porque este projeto representa um protótipo
acadêmico. Em um sistema real, as operações de cadastro, alteração e exclusão
deveriam ser protegidas.