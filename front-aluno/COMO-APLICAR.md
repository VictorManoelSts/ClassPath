# Como aplicar

## front-admin

Substitua o conteúdo da pasta `front-admin`:

```
index.html      substitui   busca, ordenação, diálogo, skip link, campo de token
style.css       substitui   layout minimalista + tokens claro/escuro
app.js          substitui   reescrito: CRUD genérico dirigido por configuração
theme.js        novo        controle de tema, carregado no <head>
favicon.svg     novo
```

Continua sem build:

```bash
python -m http.server 5500
```

### O que mudou no `app.js`

Antes, disciplina, horário e aviso repetiam a mesma estrutura três vezes: `cancelar`,
`editar`, `excluir`, `submit`, `carregar`. Agora existe um objeto `RECURSOS` que
descreve cada um — rota, campos do formulário, colunas da tabela, como o item vira
texto de busca — e um controlador único que serve os três.

Para adicionar um quarto recurso, você escreve o HTML do formulário e da lista e
acrescenta uma entrada em `RECURSOS`. Nenhuma função nova.

## front-aluno

A pasta `src` foi reorganizada. Copie tudo:

```
src/App.jsx                      só orquestra; ~150 linhas em vez de 400
src/api.js                       fetch com timeout, cache de 30s, normalização
src/main.jsx
src/styles.css
src/setupTests.js                novo
src/components/                  Topbar, FilterBar, SummaryGrid, DisciplineList,
                                 ScheduleView, NoticeList, EmptyState, ErrorState,
                                 Skeletons, ThemeToggle
src/hooks/                       useDadosAcademicos, useFiltroNaUrl, useTema,
                                 useOnline, useTituloDaPagina
src/utils/                       formato.js, grade.js (+ testes)
index.html                       script anti-flash, favicon, manifest
package.json                     scripts de lint, formatação e teste
eslint.config.js                 novo
.prettierrc / .prettierignore    novo
vite.config.js                   ganhou a seção de testes
.env.example                     ganhou VITE_PERIODO
public/favicon.svg
public/manifest.webmanifest
```

Depois de copiar:

```bash
cd front-aluno
npm install
npm run verificar
npm run dev
```

`npm run verificar` roda lint, formatação, os 32 testes e o build. Se passar limpo,
está tudo no lugar.

## Trocar a cor de acento

Está em quatro variáveis, repetidas nos blocos claro e escuro de cada CSS:

```css
--accent: #1f6b58;        /* cor principal */
--accent-hover: #175646;  /* hover do botão primário */
--accent-soft: #e6f1ee;   /* fundo de badges, anel de foco, blocos da grade */
--accent-text: #ffffff;   /* texto sobre o acento */
```

No tema escuro o acento precisa ser mais claro que o fundo, não mais escuro. Se
voltar para o azul da marca, algo como `#2f6fd0` no claro e `#7aa9f0` no escuro —
e ajuste `--accent-text` para uma cor escura no tema escuro.

## O arquivo `shared/theme.css`

Não é usado por nenhum dos dois projetos — os tokens estão duplicados no topo de
cada CSS para que o admin funcione sem build. Está aí para quando os dois fronts
virarem um monorepo.
