# ClassPath — análise dos dois fronts

## Resumo

Os dois projetos estão bem escritos: nomes em português consistentes, `textContent`
em vez de `innerHTML` (sem brecha de XSS), `AbortController` no React, estados de
carregamento e de lista vazia, layout responsivo de verdade. Isso já está acima da
média de um projeto acadêmico.

Os problemas se concentram em três lugares: bugs pontuais que só aparecem em casos
de borda, decisões de UX que custam pouco para arrumar, e o fato de os dois fronts
não parecerem o mesmo produto.

---

## 1. Bugs reais

### front-admin

| Onde | Problema | Correção aplicada |
|---|---|---|
| `app.js` — data padrão do aviso | `new Date().toISOString().slice(0,10)` devolve a data em **UTC**. Em Maceió (UTC−3), das 21h à meia-noite o campo já mostra o dia seguinte. | `dataDeHojeLocal()` compensa o `getTimezoneOffset()`. |
| `carregarDisciplinas/Horarios/Avisos` | O retorno da API vai direto para o estado. Se vier um objeto de erro em vez de uma lista, o `forEach` estoura e a tela morre sem mensagem. | `comoLista()` degrada para `[]`. |
| Envio dos formulários | Nada bloqueia o duplo clique. Dois cliques rápidos = dois registros iguais. O CSS até tinha `.botao:disabled`, mas o `disabled` nunca era aplicado. | Helper `enviando()` desabilita o botão e troca o rótulo enquanto a requisição roda. |
| `editar*()` | `window.scrollTo({ top: 300 })` é um número mágico: erra o alvo em telas menores. | `scrollIntoView({ block: "center" })` no formulário. |
| Abas | `role`/`aria-selected` ausentes e sem navegação por seta. | `role="tablist"`, `aria-selected`, `tabindex` móvel e setas ←/→/Home/End. |
| Horário | Nada impede `fim <= inicio`. | Validação antes do POST/PUT. |

### front-aluno

| Onde | Problema | Correção aplicada |
|---|---|---|
| `useEffect` principal | `/disciplinas` era refeito **a cada mudança de filtro**, mesmo sem precisar. Três requisições onde bastavam duas. | Dois efeitos separados: disciplinas uma vez, horários/avisos por filtro. |
| Ordenação da grade | `primeiro.horarioInicio.localeCompare(...)` estoura se o campo vier `null`. | Fallback `(campo \|\| "")`. |
| Filtro na URL | `replaceState` não cria histórico, e o parâmetro só era lido na montagem. Voltar no navegador não desfaz o filtro. | `pushState` + listener de `popstate`. |
| Skeleton a cada filtro | `setCarregando(true)` derrubava a página inteira em skeleton toda vez que o aluno trocava de disciplina. Pisca feio. | Primeira carga mostra skeleton; as seguintes só reduzem a opacidade (`.is-revalidating`). |
| Listas da API | Mesmo risco do admin: resposta não-array quebra o `.map`. | `comoLista()`. |
| `2026.2` fixo no JSX | Vira mentira no próximo semestre. | `VITE_PERIODO` no `.env`. |
| Nav no mobile | `display: none` abaixo de 920px, sem menu alternativo — as âncoras somem. | Nav rolável na horizontal, sempre visível. |

---

## 2. O layout novo

O que tirei, e por quê:

- **Gradientes e o fundo quadriculado.** O `.app-shell` desenhava uma grade de 28px
  atrás de tudo e a marca tinha `linear-gradient(145deg, blue, cyan)`. É ruído.
- **Sombras pesadas.** `0 18px 50px` em cima de cards que já têm borda. Em modo
  escuro, sombra grande só suja. Agora a borda de 1px faz o trabalho.
- **Quatro cores de "tom" nas disciplinas** (`.tone-1` a `.tone-4`) e três cores nos
  cards de resumo. Cor deve significar alguma coisa; ali ela era decoração rotativa.
  Restou um acento só.
- **Os marcadores 01 / 02 / 03** nos cards de disciplina. Numeração sinaliza
  sequência, e uma lista de disciplinas não é sequência — o número mudava de lugar
  conforme o filtro.
- **Os rótulos em caixa alta acima de cada título** ("VISÃO ACADÊMICA", "ORGANIZE SUA
  SEMANA", "FIQUE POR DENTRO"). Não acrescentam informação e empurram o conteúdo
  para baixo.
- **Raios de borda variados** (11, 12, 13, 14, 16, 17, 18, 20px espalhados). Agora
  são três: 6 / 10 / 14.

O que ganhou destaque:

- **A grade agora é agrupada por dia da semana**, com um cabeçalho por dia, em vez de
  linhas soltas com um chip de dia repetido. É a informação que o aluno realmente
  procura ao abrir a página.
- **Números tabulares** (`font-variant-numeric: tabular-nums`) nos horários e
  contadores, para os dígitos não dançarem.

Paleta: neutros levemente quentes (papel) com um acento verde-ardósia único
(`#1f6b58` claro / `#5cbfa3` escuro). Se quiser voltar ao azul da marca, é uma linha:
troque `--accent`, `--accent-hover` e `--accent-soft` nos dois CSS.

---

## 3. Como o dark mode funciona

Três camadas, na ordem:

1. `@media (prefers-color-scheme: dark)` — o padrão quando o usuário nunca escolheu.
2. `[data-theme="dark"]` no `<html>` — sobrescreve quando ele escolheu.
3. `localStorage` sob a chave `classpath-tema` — persiste a escolha.

Dois detalhes que costumam passar batido e estão resolvidos:

- **`color-scheme`** está declarado nos dois temas. Sem ele, `<select>`, `<input
  type="date">` e as barras de rolagem continuam brancos no tema escuro, porque são
  desenhados pelo sistema operacional.
- **Anti-flash.** O tema é aplicado por um script síncrono no `<head>`, antes da
  primeira pintura. Se você aplicar só depois do React montar, a tela pisca branco a
  cada carregamento.

O botão é acessível: `aria-pressed` e um `aria-label` que descreve a ação, não o
estado atual.

---

## 4. Ideias que ficaram de fora (para você decidir)

**Alto valor, esforço baixo**

1. **Extrair o `App.jsx`.** São 400 linhas num arquivo só. `Header`, `FilterBar`,
   `SummaryGrid`, `DisciplineList`, `ScheduleList`, `NoticeList` e um hook
   `useDadosAcademicos()` deixariam cada peça testável.
2. **Fatorar o CRUD do admin.** Disciplina, horário e aviso repetem exatamente a
   mesma estrutura: `cancelar`, `editar`, `excluir`, `submit`, `carregar`. Um objeto
   de configuração por recurso (`{ rota, campos, colunas }`) e uma função genérica
   cortariam ~40% do `app.js`.
3. **Trocar `confirm()` por um diálogo próprio.** O `confirm` nativo é bloqueante,
   não estiliza e não segue o tema — no dark mode ele aparece branco.
4. **Busca e ordenação nas tabelas do admin.** Com 40 disciplinas a tabela já fica
   difícil de usar.
5. **ESLint + Prettier.** Nenhum dos dois projetos tem. Um `eslint.config.js` com
   `eslint-plugin-react-hooks` teria pego o efeito que refazia `/disciplinas` à toa.

**Alto valor, esforço médio**

6. **Grade visual da semana.** Colunas = dias, blocos posicionados pela hora, altura
   proporcional à duração. É o recurso que faria o portal parecer um produto, não um
   CRUD listado. Vale como a "peça de destaque" do projeto.
7. **Autenticação no admin.** Hoje qualquer um que alcance a porta 5500 apaga o
   banco. Mesmo um login simples com token no back mudaria a conversa numa
   apresentação.
8. **Cache e revalidação.** Trocar de filtro e voltar refaz tudo. Um `Map` de cache
   por `disciplinaId` (ou TanStack Query, se puder adicionar dependência) resolve.
9. **`fetch` com timeout.** Se o Spring subir mas travar, o portal fica em skeleton
   para sempre. `AbortSignal.timeout(8000)` já ajuda.
10. **Data e hora vindas da API.** `horarioInicio` como string `"HH:mm:ss"` funciona,
    mas o front faz `.slice(0,5)` em três lugares. Uma função `formatarHorario` já
    existe — use ela em todos.

**Polimento**

11. **Skip link** (`Pular para o conteúdo`) antes da topbar.
12. **`<title>` dinâmico** quando há filtro: `Cálculo I | ClassPath`.
13. **Favicon e manifest.** A pasta `public/` está vazia.
14. **Estado offline.** `window.addEventListener("offline")` com uma faixa discreta.
15. **Contraste.** Rode o Lighthouse nos dois temas — o `--text-3` sobre `--surface-2`
    é o par mais apertado e vale conferir se passa em AA no seu monitor.

**Para o repositório**

16. Um `README` na raiz explicando os três projetos (back, admin, aluno) e como
    subir tudo, em vez de um README por pasta.
17. Deploy do portal do aluno no Vercel ou Netlify apontando para a sua API já
    publicada. Link funcionando vale mais que print.

---

## 5. O que foi aplicado nesta rodada

Todos os itens da seção 4 foram implementados, exceto autenticação de verdade (item 7),
que depende do back-end.

### front-aluno

| Item | Como ficou |
|---|---|
| Extrair o `App.jsx` | 10 componentes em `src/components/`, 5 hooks em `src/hooks/`, formatação em `src/utils/`. O `App.jsx` só orquestra. |
| Grade visual da semana | `src/utils/grade.js` calcula a posição de cada bloco; `ScheduleView` desenha colunas por dia e altura proporcional à duração. Botão "Semana / Lista" para alternar. |
| Cache e revalidação | `src/api.js` guarda cada rota por 30s em memória. Voltar para um filtro já visto não refaz a requisição. |
| `fetch` com timeout | 8 segundos. Um back travado agora dá mensagem em vez de skeleton eterno. |
| `formatarHorario` em todo lugar | O `.slice(0,5)` espalhado virou uma função só, testada. |
| ESLint + Prettier | `eslint.config.js` com `react-hooks/exhaustive-deps` como **erro**, não aviso. Foi essa regra que pegou o efeito duplicado. |
| Testes | 32 testes com Vitest e Testing Library. `npm run verificar` roda lint, formatação, testes e build. |
| Skip link | "Pular para o conteúdo" antes da topbar. |
| Título dinâmico | `Cálculo I \| ClassPath` quando há filtro. |
| Favicon e manifest | `public/favicon.svg` e `public/manifest.webmanifest`. |
| Estado offline | Faixa no topo quando `navigator.onLine` é falso. |

### front-admin

| Item | Como ficou |
|---|---|
| Fatorar o CRUD | Um objeto `RECURSOS` descreve rota, campos, colunas e busca de cada recurso; um controlador único serve os três. O arquivo encolheu e ganhou funcionalidade. |
| Substituir o `confirm()` | `<dialog>` próprio, segue o tema, fecha no Esc, devolve `Promise<boolean>`. |
| Busca e ordenação | Campo de busca com atraso de 180ms em cada lista; cabeçalhos de tabela clicáveis com `aria-sort`. |
| `fetch` com timeout | 8 segundos, igual ao portal. |
| Skip link e foco | "Pular para o conteúdo" e foco no primeiro campo ao editar. |
| Estado offline | Selo "Sem conexão" no cabeçalho. |
| Token opcional | Campo que envia `Authorization: Bearer`. Meio caminho para o item 7 — falta o back validar. |
| Aba na URL | `#horarios` sobrevive ao F5. |

### Repositório

`README.md` na raiz cobrindo os dois fronts, `INTEGRACAO.md` com o contrato esperado
da API, `TESTES.md` com o roteiro de testes e `WEBSTORM.md` com a configuração do IDE.

### Verificado antes de entregar

```
ESLint         0 erros, 0 avisos
Prettier       todos os arquivos no padrão
Vitest         32 testes, 4 arquivos, todos passando
vite build     dist gerado, 52 kB gzip
front-admin    carregado em jsdom com fetch simulado: tabela, busca,
               ordenação, abas por teclado e data local, sem erro no console
```
