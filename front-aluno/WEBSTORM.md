# Rodando e verificando no WebStorm

## 1. Abrir o projeto

**File → Open** e escolha a pasta que contém `front-admin` e `front-aluno`. Abrir só
uma das subpastas funciona, mas você perde o `classpath.http` da raiz.

Depois, **Settings → Languages & Frameworks → Node.js**: o campo *Node interpreter*
tem que apontar para Node 20.19 ou mais recente. Se estiver vazio, o WebStorm não
roda nada de npm.

Marque também **Coding assistance for Node.js**, para o IDE reconhecer `process` e
os módulos internos.

## 2. Instalar as dependências

Abra `front-aluno/package.json`. O WebStorm mostra uma faixa amarela no topo com
*Run 'npm install'*. Clique. Ou: botão direito no `package.json` → **Run 'npm
install'**.

## 3. Rodar os scripts

A janela **npm** (View → Tool Windows → npm) lista todos os scripts do
`package.json`. Duplo clique roda e já cria uma configuração reutilizável.

A ordem que interessa:

| Script | Quando |
|---|---|
| `verificar` | antes de commitar ou entregar — roda lint, formatação, testes e build |
| `dev` | enquanto desenvolve |
| `test:watch` | deixe rodando num terminal lateral |
| `build` | conferir que o bundle sai limpo |

Para deixar `dev` no seletor do canto superior direito: **Run → Edit Configurations
→ + → npm** → *package.json*: `front-aluno/package.json`, *Command*: `run`,
*Scripts*: `dev`.

## 4. ESLint dentro do editor

**Settings → Languages & Frameworks → JavaScript → Code Quality Tools → ESLint** →
marque **Automatic ESLint configuration**.

O projeto usa flat config (`eslint.config.js`), suportado a partir do WebStorm
2024.1. Se o IDE não encontrar sozinho, troque para **Manual ESLint configuration**
e aponte:

- *ESLint package*: `front-aluno/node_modules/eslint`
- *Working directories*: `front-aluno`
- *Configuration file*: `front-aluno/eslint.config.js`

Marque **Run eslint --fix on save** se quiser correção automática ao salvar.

Erro de lint aparece sublinhado no editor, e `Alt+Enter` em cima oferece a correção.

## 5. Prettier ao salvar

**Settings → Languages & Frameworks → Prettier** → **Automatic Prettier
configuration** → marque **On save** e **On 'Reformat Code' action**.

Em *Run for files*, deixe: `{**/*,*}.{js,jsx,css,json,md}`

Assim `npm run format:check` nunca mais reclama.

## 6. Rodar os testes

O WebStorm tem suporte nativo a Vitest. Três formas:

- **Um teste só**: clique no ▶ verde na margem, ao lado de um `it(...)`.
- **Um arquivo**: ▶ ao lado do `describe(...)`.
- **Tudo**: botão direito na pasta `src` → **Run 'Vitest in src'**.

Os resultados aparecem em árvore, e clicar numa falha leva direto à linha.

Para depurar um teste, use o ícone de inseto em vez do ▶ — os breakpoints funcionam
normalmente dentro dos testes.

**Run with Coverage** (ícone do escudo) marca as linhas cobertas em verde e as não
cobertas em vermelho, direto na margem do editor. É a forma mais rápida de ver o que
falta testar.

Se o ▶ não aparecer: **Run → Edit Configurations → + → Vitest**, *Working
directory*: `front-aluno`, *Vitest package*: `front-aluno/node_modules/vitest`.

## 7. Depurar o portal no navegador

1. Rode `npm run dev`.
2. No terminal do WebStorm, o endereço `http://localhost:5173` vira link. Segure
   **Ctrl** (ou **Cmd**) e clique — o IDE oferece abrir em modo debug.
3. Ponha breakpoints direto no `.jsx`. O WebStorm resolve o source map do Vite
   sozinho.

Alternativa: **Run → Edit Configurations → + → JavaScript Debug**, URL
`http://localhost:5173`.

## 8. O front-admin — o detalhe que trava todo mundo

O `front-admin` não tem `package.json`. A tentação é abrir o `index.html` e clicar no
ícone do navegador no canto do editor. Isso funciona, **mas o servidor embutido do
WebStorm usa a porta 63342**, e a URL fica assim:

```
http://localhost:63342/classpath-ui/front-admin/index.html
```

Aí o `fetch` para `localhost:8080` é bloqueado por CORS, porque o back só libera
5173 e 5500. Você vai ver `blocked by CORS policy` no console e vai achar que o
front quebrou.

Duas saídas:

**A) Servir na porta 5500, como o resto da documentação assume.**
**Run → Edit Configurations → + → Shell Script**:

- *Execute*: `Script text`
- *Script text*: `python -m http.server 5500`
- *Working directory*: a pasta `front-admin`

Rode essa configuração e abra `http://localhost:5500`. Fim do problema.

**B) Usar o servidor embutido mesmo.** Então libere a origem no back:

Ou seja, sua API teria que aceitar também a origem `http://localhost:63342`.

Você pode trocar a porta embutida em **Settings → Build, Execution, Deployment →
Debugger → Built-in server port**, mas ela é do IDE inteiro, não só deste projeto.

O detalhe é que a correção fica na sua API, não aqui.

A opção A é a melhor: mantém o front-admin igual em qualquer máquina.

## 9. Testar a API sem sair do IDE

Abra `classpath.http` na raiz. Ele é só um cliente HTTP apontando para a **sua** API
— não sobe nada. Cada bloco tem um ▶ verde na margem. Clique de cima para baixo: o
arquivo guarda os IDs criados, então o horário e o aviso já saem ligados à
disciplina.

Alguns blocos têm asserções (`client.test`). Eles aparecem como teste passou ou
falhou na janela de resposta — inclusive o que confirma o **HTTP 409** ao tentar
excluir uma disciplina com dependências.

No canto superior direito do editor há um seletor de ambiente, alimentado por
`http-client.env.json`. Troque entre `local` e `producao` sem editar as URLs.

Truque útil: copie um comando `curl` e cole dentro de um arquivo `.http` — o
WebStorm converte para o formato dele automaticamente.

## 10. Análise do projeto inteiro

**Code → Inspect Code → Whole project**. Vai além do ESLint: pega import não usado,
CSS morto, atributo HTML inválido, promessa sem `await`, acessibilidade básica.

Roda em alguns segundos e costuma achar duas ou três coisas reais. Vale antes de
entregar.

## 11. Atalhos que economizam tempo aqui

| Atalho | O que faz |
|---|---|
| `Shift Shift` | busca qualquer arquivo, ação ou configuração |
| `Ctrl+Shift+F` / `Cmd+Shift+F` | busca em todo o projeto |
| `Alt+Enter` | corrige o problema sob o cursor |
| `Ctrl+Alt+L` / `Cmd+Alt+L` | reformata com Prettier |
| `Ctrl+Shift+F10` | roda o teste sob o cursor |
| `Shift+F10` | repete a última configuração executada |
| `Ctrl+B` num componente | pula para a definição |
