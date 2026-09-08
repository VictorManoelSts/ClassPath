# Ligando o front na sua API

O front não faz suposição nenhuma sobre a linguagem ou o framework do back. Ele só
precisa que a API responda nos formatos abaixo. Se algo aí for diferente, a última
seção mostra onde adaptar — quase sempre é um arquivo só.

## 1. Endereço da API

**Portal do aluno** — `front-aluno/.env`:

```
VITE_API_URL=http://localhost:8080
VITE_PERIODO=2026.2
```

Copie de `.env.example`. Barra no final é removida automaticamente, então
`http://localhost:8080/` também funciona.

**Painel administrativo** — não tem `.env`. O endereço é um campo na própria tela e
fica salvo no `localStorage` do navegador. O valor inicial está no
`index.html`, no `value` do `<input id="api-url">`.

## 2. Endpoints

```
GET    /disciplinas
POST   /disciplinas
PUT    /disciplinas/{id}
DELETE /disciplinas/{id}

GET    /horarios
GET    /horarios?disciplinaId={id}
POST   /horarios
PUT    /horarios/{id}
DELETE /horarios/{id}

GET    /avisos
GET    /avisos?disciplinaId={id}
POST   /avisos
PUT    /avisos/{id}
DELETE /avisos/{id}
```

O **portal do aluno** usa só os cinco `GET`. O **painel** usa todos.

Se a sua API tem prefixo (`/api/v1/...`), inclua no `VITE_API_URL` e no campo de
endereço do painel: `http://localhost:8080/api/v1`.

## 3. Formato das respostas

Os `GET` de lista devem devolver um array na raiz.

**`GET /disciplinas`**

```json
[
  { "id": 1, "nome": "Cálculo I", "professor": "Ana Ribeiro" }
]
```

**`GET /horarios`**

```json
[
  {
    "id": 10,
    "disciplinaId": 1,
    "disciplinaNome": "Cálculo I",
    "diaSemana": "Segunda-feira",
    "horarioInicio": "08:00:00",
    "horarioFim": "10:00:00",
    "sala": "Laboratório 02"
  }
]
```

`horarioInicio` e `horarioFim` aceitam `"HH:mm"` ou `"HH:mm:ss"` — o front corta os
segundos. `sala` pode vir `null`; vira "Sala a definir" na tela.

**`GET /avisos`**

```json
[
  {
    "id": 20,
    "disciplinaId": 1,
    "disciplinaNome": "Cálculo I",
    "titulo": "Prova na sexta",
    "descricao": "Conteúdo das aulas 1 a 6.",
    "dataPublicacao": "2026-03-01"
  }
]
```

`dataPublicacao` no formato `YYYY-MM-DD`, sem hora. Se vier com hora ou fuso, veja a
seção 6.

**`diaSemana`** precisa ser uma destas strings, exatamente:

```
Segunda-feira  Terça-feira  Quarta-feira  Quinta-feira
Sexta-feira    Sábado       Domingo
```

É o que define a ordem das colunas na grade da semana. Outros valores caem no fim da
lista, num grupo "Sem dia definido".

## 4. Corpo dos POST e PUT

O painel envia exatamente os campos abaixo, sem `id` no corpo:

```json
// POST /disciplinas
{ "nome": "Cálculo I", "professor": "Ana Ribeiro" }

// POST /horarios
{ "disciplinaId": 1, "diaSemana": "Segunda-feira",
  "horarioInicio": "08:00", "horarioFim": "10:00", "sala": "Lab 02" }

// POST /avisos
{ "disciplinaId": 1, "titulo": "Prova na sexta",
  "descricao": "texto", "dataPublicacao": "2026-03-01" }
```

`sala` vai como `null` quando o campo fica vazio.

## 5. Erros

Qualquer status ≥ 400 vira mensagem na tela. O front procura a mensagem em, nesta
ordem: `erro`, `message`, e por último o corpo cru como texto.

```json
{ "erro": "Disciplina possui horários vinculados." }
```

Se a sua API não devolve nenhum dos dois, aparece "A API respondeu com HTTP 409" —
funciona, mas é menos útil para o usuário.

O painel trata **409** como caso esperado ao excluir disciplina com dependências, e
já avisa isso no diálogo de confirmação.

## 6. CORS — o motivo número um de "não funciona"

Isso é configuração da **sua** API, não do front. Ela precisa aceitar requisições
das origens onde o front roda:

```
http://localhost:5173    portal do aluno em desenvolvimento
http://localhost:5500    painel administrativo
```

Mais o domínio de produção, se você publicar. Métodos: `GET, POST, PUT, DELETE,
OPTIONS`.

Como reconhecer: o `curl` funciona, o navegador não, e o console mostra
`blocked by CORS policy`. Não adianta mexer no front.

## 7. Se os seus nomes forem diferentes

### Portal do aluno

Um lugar só: `src/api.js`. Adicione um tradutor dentro de `buscarLista`, logo antes
do `return`:

```js
const traduzir = {
  "/disciplinas": (item) => ({
    id: item.codigo,              // seu nome  →  nome esperado
    nome: item.titulo,
    professor: item.docente,
  }),
};

export async function buscarLista(caminho, { signal, ignorarCache = false } = {}) {
  // ...
  const bruto = comoLista(await requisicao(caminho, signal));
  const dados = traduzir[caminho] ? bruto.map(traduzir[caminho]) : bruto;
  cache.set(caminho, { dados, em: agora });
  return dados;
}
```

Nenhum componente muda: eles só enxergam os nomes já traduzidos.

### Painel administrativo

Em `app.js`, no objeto `RECURSOS`. Cada campo do formulário e cada coluna da tabela
tem uma `chave`, que é o nome no JSON:

```js
campos: [
  { chave: "titulo", id: "disciplina-nome", exigido: "Informe o nome." },
  //     ^^^^^^^^ troque aqui
],
colunas: [
  { chave: "titulo", titulo: "Nome" },
]
```

### Dias da semana em outro formato

Se a sua API devolve `"SEGUNDA"`, `"MONDAY"` ou um número, ajuste o mapa
`ORDEM_DIAS` em `front-aluno/src/utils/formato.js` e a lista de `<option>` do
`<select id="horario-dia">` no `front-admin/index.html`.

### Resposta paginada ou envelopada

Se a API responde `{ "content": [...] }` (padrão de paginação do Spring Data) ou
`{ "data": [...] }`, o front vê "nenhum registro". Desembrulhe em `comoLista`,
dentro de `front-aluno/src/api.js`:

```js
export const comoLista = (valor) => {
  if (Array.isArray(valor)) return valor;
  if (Array.isArray(valor?.content)) return valor.content;
  if (Array.isArray(valor?.data)) return valor.data;
  return [];
};
```

E o equivalente em `front-admin/app.js`, na função `comoLista`.

### Datas com hora ou fuso

Se `dataPublicacao` vem como `"2026-03-01T00:00:00Z"`, corte antes de formatar. Em
`front-aluno/src/utils/formato.js`, na primeira linha de `formatarData`:

```js
const apenasData = String(data).slice(0, 10);
```

E use `apenasData` no lugar de `data` no resto da função.

## 8. Conferir se está tudo certo

Com a sua API no ar:

```bash
curl -i http://localhost:8080/disciplinas
```

Confira três coisas na resposta: status **200**, corpo começando com `[`, e os nomes
dos campos batendo com a seção 3.

Depois abra `classpath.http` no WebStorm e rode os blocos de cima para baixo. Alguns
têm asserções automáticas — inclusive a do 409 ao excluir disciplina com
dependências e a que verifica se a API recusa horário com fim antes do início.
