## Estrutura do Front do Aluno

O Front do Aluno é a interface usada pelos estudantes para consultar as informações acadêmicas do ClassPath.

Ele foi desenvolvido com Angular e se comunica com dois back-ends:

- **Back Acadêmico:** fornece disciplinas, horários e avisos.
- **Back de Materiais:** fornece a lista de materiais e permite baixar arquivos.

### Estrutura principal

```text
front-aluno/
├── public/
├── src/
│   ├── app/
│   │   ├── components/
│   │   ├── core/
│   │   ├── app.html
│   │   └── app.ts
│   ├── main.ts
│   └── styles.css
├── .env.example
├── angular.json
├── docker-compose.yml
├── Dockerfile
├── nginx.conf
├── package.json
├── package-lock.json
└── tsconfig.json
```

### Explicação das pastas e arquivos

#### `src/`

Contém o código-fonte principal da aplicação Angular.

#### `src/app/`

Contém a estrutura da aplicação, seus componentes, serviços e a página principal.

#### `src/app/components/`

Contém os componentes visuais da aplicação. Cada componente representa uma parte da interface, como:

- lista de disciplinas;
- grade de horários;
- lista de avisos;
- lista de materiais;
- filtros;
- mensagens de carregamento e erro.

O componente de materiais mostra os arquivos relacionados à disciplina selecionada e fornece a opção de download.

#### `src/app/core/`

Contém os serviços responsáveis pela comunicação com as APIs.

Entre eles está o serviço de materiais, que consulta o Back de Materiais para carregar os arquivos disponíveis.

Os serviços evitam colocar requisições HTTP diretamente nos componentes, deixando o projeto mais organizado.

#### `src/app/app.ts`

É o componente principal da aplicação. Ele controla a página, os dados selecionados e a integração entre os diferentes componentes.

#### `src/app/app.html`

Define a estrutura visual da página principal, incluindo as seções de disciplinas, horários, avisos e materiais.

#### `src/main.ts`

É o ponto de entrada do Angular. Esse arquivo inicia a aplicação no navegador.

#### `src/styles.css`

Contém os estilos globais usados pela aplicação.

#### `public/`

Contém arquivos públicos e estáticos, como imagens e ícones.

#### `.env.example`

É um exemplo das variáveis de ambiente necessárias para executar o projeto.

O arquivo `.env` real deve ser criado localmente e não deve conter senhas ou informações privadas enviadas ao GitHub.

Exemplo:

```env
API_URL=http://localhost:8080/api
MATERIAIS_API_URL=http://localhost:8000/api
PERIODO=2026.2
```

#### `package.json`

Contém as dependências, informações e comandos do projeto Angular.

#### `package-lock.json`

Registra as versões exatas das dependências instaladas para que todos os integrantes utilizem as mesmas versões.

#### `angular.json`

Contém as configurações de compilação e execução do Angular.

#### `Dockerfile`

Define como a imagem Docker do Front do Aluno será construída.

O processo possui duas etapas:

1. O Node.js instala as dependências e gera a versão de produção do Angular.
2. O Nginx disponibiliza os arquivos gerados para o navegador.

#### `docker-compose.yml`

Configura o contêiner do Front do Aluno, suas variáveis de ambiente e a porta utilizada.

Por padrão, o front fica disponível em:

```text
http://localhost:5173
```

#### `nginx.conf`

Configura o Nginx responsável por disponibilizar a aplicação Angular dentro do contêiner.

## Comunicação com os back-ends

### Back Acadêmico

Endereço padrão:

```text
http://localhost:8080/api
```

Fornece:

- disciplinas;
- horários;
- avisos.

### Back de Materiais

Endereço padrão:

```text
http://localhost:8000/api
```

Fornece:

- materiais cadastrados;
- materiais filtrados por disciplina;
- download dos arquivos.

Quando o aluno seleciona uma disciplina, o front pode realizar uma requisição semelhante a:

```http
GET /api/materiais?disciplina=1
```

Para baixar um material, é utilizado:

```http
GET /api/materiais/{id}
```

O envio e a exclusão de materiais são realizados pelo painel administrativo. O Front do Aluno é responsável apenas pela consulta e pelo download.

## Fluxo de funcionamento

1. O aluno abre o sistema.
2. O front consulta as disciplinas no Back Acadêmico.
3. O aluno pode selecionar uma disciplina.
4. O front busca os horários e avisos correspondentes.
5. O serviço de materiais consulta o Back de Materiais usando o ID da disciplina.
6. Os arquivos encontrados são exibidos na seção de materiais.
7. Ao clicar em baixar, o navegador solicita o arquivo ao Back de Materiais.

## Execução com Docker

Na pasta que contém o `docker-compose.yml`, execute:

```powershell
docker compose --env-file ".env" up --build -d
```

Para verificar o contêiner:

```powershell
docker compose ps
```

Para encerrar:

```powershell
docker compose down
```

O comando `docker compose down` encerra o front sem apagar os bancos de dados dos outros serviços.
