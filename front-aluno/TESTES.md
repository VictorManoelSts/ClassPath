# Como testar e caçar erros

Este guia vai do mais rápido ao mais trabalhoso. Se você tiver cinco minutos, faça
só a parte 1. Antes de entregar ou apresentar, faça as partes 1 a 5.

---

## 1. O comando que resolve 80% dos casos

Dentro de `front-aluno`:

```bash
npm install
npm run verificar
```

`verificar` roda quatro coisas em sequência e para na primeira que falhar:

| Etapa | O que pega |
|---|---|
| `npm run lint` | variáveis não usadas, `useEffect` com dependência errada, comparações frouxas, JSX inválido |
| `npm run format:check` | formatação fora do padrão |
| `npm run test` | os 32 testes automatizados |
| `npm run build` | erro de import, arquivo que não existe, quebra só no build de produção |

Saída esperada, no fim:

```
Test Files  4 passed (4)
     Tests  32 passed (32)
✓ built in 3.03s
```

Se algo quebrar, corrija antes de continuar. Os outros testes partem do princípio
de que esse passou.

### Comandos avulsos

```bash
npm run lint          # só o ESLint
npm run lint:fix      # corrige o que dá para corrigir sozinho
npm run format        # reformata tudo com Prettier
npm run test:watch    # roda os testes de novo a cada arquivo salvo
npm run test:cobertura # gera coverage/index.html com o que não está testado
```

O `test:watch` é o modo de trabalhar: deixe rodando num terminal enquanto edita.

---

## 2. O que os testes automatizados já cobrem

São 32 testes em 4 arquivos. Vale saber o que eles protegem, porque se você mexer
nesses pontos e o teste ficar vermelho, é bug de verdade, não teste chato.

**`src/utils/formato.test.js` (13 testes)**
Formatação de hora e data, ordenação da semana, agrupamento por dia. Dois testes de
regressão importantes: a data que voltava um dia em UTC−3, e a ordenação que
estourava quando `horarioInicio` vinha nulo.

**`src/api.test.js` (7 testes)**
Cache não repete requisição dentro de 30s, `ignorarCache` força a atualização, erro
409 da API chega com a mensagem do back, e servidor fora do ar vira mensagem legível
em vez de `TypeError: Failed to fetch`.

**`src/utils/grade.test.js` (6 testes)**
Posicionamento dos blocos na grade da semana: aula das 8h no topo, aula das 10h
logo abaixo da anterior, colunas na ordem Segunda→Sábado, aulas com horário
inválido separadas em vez de sumirem.

**`src/App.test.jsx` (6 testes)**
Fluxo de ponta a ponta com `fetch` falso: renderiza as três listas, escreve o filtro
na URL, muda o título da aba, mostra o estado de erro quando a API cai, sobrevive a
uma resposta que não é lista, e alterna entre grade e lista.

### Escrever um teste novo

O modelo mais útil é o de `App.test.jsx`: monte um `fetch` falso, renderize, e
procure pelo texto que o usuário veria.

```jsx
it("mostra a sala da aula", async () => {
  vi.stubGlobal("fetch", apiFake());
  render(<App />);
  expect(await screen.findByText("Sala 12")).toBeInTheDocument();
});
```

Duas armadilhas que já apareceram aqui:

- **`findByText` estoura se o texto aparece mais de uma vez.** "Cálculo I" está no
  card, no bloco da grade e no aviso. Use `findAllByText`, ou aponte para o papel:
  `getByRole("heading", { name: "Cálculo I" })`.
- **Prefira `findBy*` a `getBy*` logo depois do `render`.** Os dados chegam de forma
  assíncrona; `getBy*` procura antes de a tela atualizar.

---

## 3. Testes manuais no navegador

Deixe o DevTools aberto na aba **Console** o tempo todo. Qualquer coisa em vermelho
é um bug, mesmo que a tela pareça certa.

### 3.1 Tema claro e escuro

| Passo | Esperado |
|---|---|
| Clique no botão de tema | alterna na hora |
| Aperte F5 | continua no tema que você escolheu |
| Recarregue no tema escuro e olhe o primeiro frame | **nenhum flash branco** |
| Abra o `<select>` de disciplina no tema escuro | fundo escuro, não branco |
| Abra o `<input type="date">` no admin, no tema escuro | calendário escuro |
| Apague `classpath-tema` no localStorage (DevTools → Application → Local Storage) e mude o tema do sistema | a página acompanha sozinha |
| Navegue só pelo Tab | o anel de foco aparece em todo botão e campo |

Se o `select` ou o calendário aparecerem brancos, algum `color-scheme` se perdeu no
CSS. Se piscar branco no F5, o script do `<head>` não está rodando antes do CSS.

### 3.2 Rede lenta e rede caída

DevTools → aba **Network**:

1. **Throttling → Slow 4G**, recarregue. Você deve ver o skeleton, e depois o
   conteúdo. Trocar o filtro depois disso **não** pode voltar para skeleton — só
   escurecer levemente.
2. **Throttling → Offline**, recarregue. Deve aparecer a faixa "Você está sem
   conexão" e o bloco de erro com o botão "Tentar de novo".
3. Volte para **No throttling** e clique em "Tentar de novo". A tela tem que se
   recuperar sem F5.
4. **Derrube a sua API** com a página aberta e troque o filtro. A mensagem tem que
   ser legível, não `Failed to fetch`.

### 3.3 Timeout

O caso mais difícil de reproduzir: o servidor aceita a conexão mas nunca responde.
Simule pelo console, antes de trocar o filtro:

```js
const original = window.fetch;
window.fetch = () => new Promise(() => {}); // nunca resolve
```

Em 8 segundos deve aparecer "O servidor não respondeu em 8 segundos." Para voltar
ao normal: `window.fetch = original`.

### 3.4 Filtro e URL

| Passo | Esperado |
|---|---|
| Escolha uma disciplina | a URL ganha `?disciplina=1` |
| Aperte o botão **voltar** do navegador | o filtro é desfeito na tela |
| Copie a URL com filtro e abra em outra aba | abre já filtrado |
| Edite a URL para `?disciplina=9999` | o filtro é descartado e a tela mostra tudo |
| Com filtro ativo, olhe o título da aba | `Cálculo I \| ClassPath` |

### 3.5 Grade da semana

| Passo | Esperado |
|---|---|
| Cadastre duas aulas seguidas no mesmo dia (8–10h e 10–12h) | os blocos ficam encostados, sem sobreposição nem buraco |
| Cadastre uma aula de 50 minutos | o bloco fica menor, mas ainda legível |
| Abra em tela estreita | a grade rola na horizontal, sem quebrar o layout |
| Clique em "Lista" | a mesma informação em lista, agrupada por dia |
| Cadastre uma aula sem sala | aparece "Sala a definir" na lista |

### 3.6 CRUD do admin

Ordem sugerida, que também testa as regras do back:

1. Cadastre uma disciplina. O contador do topo sobe.
2. Cadastre um horário com **fim antes do início**. Deve aparecer o erro sem chamar a API.
3. Cadastre um horário válido e um aviso na mesma disciplina.
4. Clique em **Editar** num item: o formulário rola até você, o título muda para
   "Editar #N" e o botão "Cancelar" aparece.
5. Clique em **Excluir**: abre o diálogo próprio (não o cinza do navegador). Aperte
   **Esc** — tem que cancelar. Repita e confirme.
6. Tente excluir a disciplina com horário e aviso ligados a ela. A API deve
   responder **409** e o painel "Última resposta" deve mostrar isso.
7. Exclua na ordem certa: aviso, horário, disciplina.
8. Digite na busca de cada lista. Sem resultado, a mensagem é "Nenhum resultado para
   essa busca." — diferente de "Nenhuma disciplina cadastrada."
9. Clique nos cabeçalhos da tabela. Um clique ordena crescente, outro decrescente,
   e a seta muda.
10. **Dê dois cliques rápidos em "Salvar".** Só pode criar um registro.
11. Abra `http://localhost:5500/#horarios` e aperte F5. Tem que abrir na aba de horários.

### 3.7 Teclado e leitor de tela

Percorra a página inteira só com Tab, Shift+Tab, Enter e Espaço.

| Passo | Esperado |
|---|---|
| Primeiro Tab na página | aparece "Pular para o conteúdo" |
| Tab até as abas do admin, depois **seta →** | muda de aba pela seta, não pelo Tab |
| Abra o diálogo de exclusão e aperte Tab várias vezes | o foco não escapa do diálogo |
| Feche o diálogo com Esc | volta sem excluir |

Nenhum elemento clicável pode ser inalcançável pelo teclado.

---

## 4. Auditorias automáticas do navegador

### Lighthouse

DevTools → **Lighthouse** → marque Performance, Accessibility, Best Practices, SEO →
Analyze. **Rode duas vezes: uma no tema claro e outra no escuro.** Contraste é a
falha mais comum e ela muda entre os temas.

Metas razoáveis para este projeto: Accessibility 100, Best Practices ≥ 95.

Rode no build de produção, não no `npm run dev` — o modo de desenvolvimento tem
código extra que distorce o número de performance:

```bash
npm run build && npm run preview
```

### axe DevTools

Extensão gratuita para Chrome e Firefox. Pega coisas que o Lighthouse deixa passar:
rótulo faltando, ordem de cabeçalhos quebrada, `aria-*` inválido. Rode nas duas
páginas e nos dois temas.

### Console e Network

Depois de navegar por tudo, olhe:

- **Console**: zero erros. Avisos do React sobre `key` ou `act` também contam.
- **Network**: trocar de filtro e voltar não deve refazer as mesmas requisições
  (é o cache de 30 segundos funcionando). `/disciplinas` deve ser chamada **uma vez**
  por carregamento, não a cada filtro.

---

## 5. Testar a sua API direto, sem o front

Quando algo dá errado, a primeira pergunta é: o problema é do front ou do back?
Estes comandos respondem em dez segundos.

```bash
# está no ar?
curl -i http://localhost:8080/disciplinas

# criar
curl -X POST http://localhost:8080/disciplinas \
  -H "Content-Type: application/json" \
  -d '{"nome":"Cálculo I","professor":"Ana Ribeiro"}'

# filtro por disciplina
curl "http://localhost:8080/horarios?disciplinaId=1"

# a regra de negócio: deve responder 409
curl -i -X DELETE http://localhost:8080/disciplinas/1
```

**Se o curl funciona e o navegador não, é CORS.** O erro no console vai falar em
"blocked by CORS policy". A correção é na configuração da sua API — ela precisa
aceitar as origens `http://localhost:5173` e `http://localhost:5500`. Não adianta
mexer no front. Detalhes em [INTEGRACAO.md](INTEGRACAO.md).

Outros três suspeitos frequentes quando o front não carrega:

| Sintoma | Causa provável |
|---|---|
| `Failed to fetch` e o curl funciona | CORS, ou `VITE_API_URL` apontando para o lugar errado |
| Tudo vazio, sem erro | a API respondeu `{}` ou `{"content": []}` em vez de `[]` — veja a seção 7 de INTEGRACAO.md |
| 404 em tudo | barra sobrando na URL (`http://localhost:8080/`) — o front já remove, mas confira o `.env` |
| Funciona no admin e não no aluno | o `.env` do aluno não foi criado a partir do `.env.example` |

---

## 6. Dados de teste que quebram as coisas

Testar com dados bonitos esconde bug. Cadastre estes casos de propósito:

| Caso | O que deve acontecer |
|---|---|
| Disciplina com nome de 100 caracteres | o card não pode estourar a largura |
| Aviso com descrição de 2000 caracteres | corta em 4 linhas no portal do aluno |
| Aviso com quebras de linha | as quebras aparecem (`white-space: pre-wrap`) |
| Nome com acento e `ç` | ordenação alfabética correta (usa `localeCompare` pt-BR) |
| Aula de 30 minutos | bloco pequeno mas legível na grade |
| Aula das 07:00 e outra das 22:00 | a grade estica e mostra as duas |
| Aula no sábado | vira uma coluna a mais |
| Horário sem sala | "Sala a definir" |
| Nenhum registro cadastrado | estado vazio em vez de tela em branco |
| 40 disciplinas | a busca da tabela passa a fazer diferença |
| Título de aviso com `<script>alert(1)</script>` | aparece como texto literal, não executa |

O último é o teste de XSS. Os dois fronts usam `textContent` e JSX, então o texto é
escapado automaticamente — mas vale confirmar que ninguém introduziu um
`innerHTML` no meio do caminho.

---

## 7. Antes de entregar

```
[ ] npm run verificar passa limpo
[ ] Console do navegador sem erros nas duas páginas
[ ] Lighthouse Accessibility 100 nos dois temas
[ ] Navegação completa só pelo teclado
[ ] Tela de 360px de largura sem rolagem horizontal (exceto a grade da semana)
[ ] F5 no tema escuro sem flash branco
[ ] Back-end desligado: mensagem de erro legível, não Failed to fetch
[ ] npm run build gera dist/ sem aviso
[ ] .env não está commitado (só .env.example)
```

Para a largura de 360px: DevTools → ícone de celular → escolha "Galaxy S8" ou digite
360×740 na barra de dimensões.
