# ClassPath — Portal do aluno (Angular)

Front-end do aluno do ClassPath: consulta de disciplinas, grade de horários e avisos.
Porte da versão em React/Vite para **Angular 20**, mantendo o mesmo CSS e o mesmo HTML gerado.

## Requisitos

- Node.js 20.19+ (ou 22.12+)
- Um back-end respondendo em `/disciplinas`, `/horarios` e `/avisos`

## Rodando

```bash
npm install
npm run dev          # http://localhost:5173
```

O endereço da API fica em `src/environments/`. Para apontar para outro servidor sem
editar código:

```bash
API_URL=http://192.168.0.10:8080 PERIODO=2026.2 npm run config
```

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

O `Dockerfile` aceita `API_URL` e `PERIODO` como build args (e também aceita os nomes
antigos `VITE_API_URL` / `VITE_PERIODO`, para os compose que já existiam).

## Estrutura

```
src/
├── index.html              tema aplicado antes da primeira pintura
├── styles.css              cópia byte a byte do CSS da versão React
├── environments/           apiUrl e periodo
└── app/
    ├── app.ts / app.html   componente raiz
    ├── core/
    │   ├── api.ts                    fetch com timeout, cache curto e garantia de lista
    │   ├── modelos.ts                tipos de Disciplina, Horario, Aviso e Anexo
    │   ├── dados-academicos.service.ts
    │   ├── filtro-url.service.ts     filtro sincronizado com a query string
    │   ├── online.service.ts
    │   ├── tema.service.ts
    │   └── titulo.service.ts
    ├── utils/              formato.ts, anexos.ts, grade.ts (funções puras)
    └── componentes/        um componente por pedaço da tela
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

58 testes cobrindo as funções puras (formato, anexos, grade), a camada de API (cache,
timeout, mensagens de erro) e a tela montada (filtro na URL, título da aba, estado de erro,
troca grade/lista, download de anexo, tema, offline e botão voltar).

```bash
npm test
```
