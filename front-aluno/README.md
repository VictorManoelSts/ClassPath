# ClassPath — Portal do aluno (Angular)

Front-end do aluno do ClassPath: consulta de disciplinas, grade de horários, avisos e
materiais disponíveis para download. A versão em **Angular 20** preserva a identidade
visual do front anterior e integra separadamente o Back Acadêmico e o Back Materiais.

## Requisitos

- Node.js 20.19+ (ou 22.12+)
- Back Acadêmico em `http://localhost:8080/api`
- Back Materiais em `http://localhost:8000/api`

## Rodando

```bash
npm install
npm run dev          # http://localhost:5173
```

O endereço da API fica em `src/environments/`. Para apontar para outro servidor sem
editar código:

```bash
API_URL=http://192.168.0.10:8080/api \
MATERIAIS_API_URL=http://192.168.0.10:8000/api \
PERIODO=2026.2 npm run config
```

O Front Aluno consulta `GET /disciplinas`, `GET /horarios` e `GET /avisos` no Back
Acadêmico. Os materiais são consultados separadamente em `GET /materiais` no Back
Materiais. Ao selecionar uma disciplina, o filtro é enviado como
`GET /materiais?disciplina={id}`. O download usa `GET /materiais/{file_id}`.

## Scripts

| Script               | O que faz                                   |
| -------------------- | ------------------------------------------- |
| `npm run dev`        | Servidor de desenvolvimento na porta 5173   |
| `npm run build`      | Build de produção em `dist/front-aluno`     |
| `npm test`           | Testes (Vitest + jsdom)                     |
| `npm run test:cobertura` | Testes com relatório de cobertura       |
| `npm run lint`       | ESLint (TypeScript + templates)             |
| `npm run format`     | Prettier                                    |
| `npm run config`     | Regrava `src/environments` a partir do ambiente |
| `npm run verificar`  | lint + format:check + test + build          |

## Docker

```bash
docker compose up --build     # http://localhost:5173
```

O `Dockerfile` aceita `API_URL`, `MATERIAIS_API_URL` e `PERIODO` como build args. O
script de configuração também aceita os nomes antigos `VITE_API_URL`,
`VITE_MATERIAIS_API_URL` e `VITE_PERIODO`.

## Estrutura

```
src/
├── index.html              tema aplicado antes da primeira pintura
├── styles.css              cópia byte a byte do CSS da versão React
├── environments/           URLs das duas APIs e período
└── app/
    ├── app.ts / app.html   componente raiz
    ├── core/
    │   ├── api.ts                    fetch com timeout, cache curto e garantia de lista
    │   ├── modelos.ts                tipos acadêmicos, Material e Anexo
    │   ├── dados-academicos.service.ts
    │   ├── materiais.service.ts      listagem filtrada no Back Materiais
    │   ├── filtro-url.service.ts     filtro sincronizado com a query string
    │   ├── online.service.ts
    │   ├── tema.service.ts
    │   └── titulo.service.ts
    ├── utils/              formato.ts, anexos.ts, grade.ts (funções puras)
    └── componentes/        inclui a listagem e download de materiais
```

## De React para Angular

| Antes (React)              | Agora (Angular)                                  |
| -------------------------- | ------------------------------------------------ |
| `useState` / `useMemo`     | `signal()` / `computed()`                        |
| `useEffect`                | `effect()` com função de limpeza                 |
| `useDadosAcademicos`       | `DadosAcademicosService`                          |
| `useFiltroNaUrl`           | `FiltroUrlService`                                |
| `useTema` / `useOnline`    | `TemaService` / `OnlineService`                   |
| `useTituloDaPagina`        | `TituloService` sobre o `Title` do Angular        |
| props / callbacks          | `input()` / `output()`                            |
| `lucide-react`             | SVG inline com os mesmos desenhos                 |
| `import.meta.env.VITE_*`   | `src/environments` + `scripts/set-env.mjs`        |
| Vitest + Testing Library   | Vitest + jsdom pelo builder `@angular/build:unit-test` |

Três decisões que valem a explicação:

- **`:host { display: contents }` em todos os componentes.** O Angular cria um elemento
  extra (`<app-topbar>`, `<app-filter-bar>`…) que o React não criava. Sem `display: contents`
  esse elemento entraria no fluxo de flex e grid e quebraria o layout — por exemplo, o
  `.app-shell` é `flex-direction: column` e o `.page-content` usa `flex: 1`.
- **SVG inline no lugar do `lucide-react`.** O `lucide-angular` envolveria o `<svg>` num
  elemento próprio, e o CSS tem regras de filho direto (`.select-wrap > svg`,
  `.empty-state > svg`) que deixariam de casar. No `EmptyState` o ícone entra por projeção
  de conteúdo justamente para continuar sendo filho direto.
- **`[selected]` nas `<option>`, não `[value]` no `<select>`.** As disciplinas chegam da API
  depois da primeira pintura. Um `[value]` no `<select>` é avaliado uma vez, quando ainda não
  há opções, e abrir o portal em `?disciplina=2` mostraria "Todas as disciplinas".
  Há um teste cobrindo exatamente esse caso.

## Testes

62 testes cobrindo as funções puras (formato, anexos, grade), a camada das duas APIs
(URLs, cache separado, timeout e mensagens de erro) e a tela montada (filtro na URL,
título da aba, estado de erro, troca grade/lista, consulta e download de materiais,
download de anexo, tema, offline e botão voltar).

```bash
npm test
```
