# ClassPath — front-end

Duas interfaces que consomem uma API acadêmica já existente. **Nenhuma delas inclui
back-end**: você aponta as duas para a sua API e elas funcionam.

| Projeto | O que é | Stack | Porta |
|---|---|---|---|
| `front-aluno` | Portal público de consulta | React, Vite | 5173 |
| `front-admin` | Painel de cadastro | HTML, CSS e JS puro, sem build | 5500 |

O que a API precisa oferecer está em **[INTEGRACAO.md](INTEGRACAO.md)** — endpoints,
nomes dos campos e o que fazer se os seus forem diferentes.

## Portal do aluno

```bash
cd front-aluno
cp .env.example .env      # aponte VITE_API_URL para a sua API
npm install
npm run dev
```

Abre em `http://localhost:5173`.

## Painel administrativo

Não tem build nem dependências. Precisa de um servidor HTTP porque o navegador
bloqueia `fetch` em `file://`:

```bash
cd front-admin
python -m http.server 5500
```

Abre em `http://localhost:5500`. O endereço da API é editável na própria tela e fica
salvo no navegador.

## Publicar

O portal do aluno é estático depois do build:

```bash
cd front-aluno
npm run build      # gera dist/
```

Sobe em Vercel, Netlify, GitHub Pages ou qualquer hospedagem estática. Defina
`VITE_API_URL` apontando para a sua API publicada e libere o domínio no CORS dela.

O painel administrativo são quatro arquivos estáticos — sobe em qualquer lugar.
Mas ele **não tem autenticação**: veja a seção de segurança abaixo antes de publicar.

## Segurança

O painel administrativo não tem login. Qualquer pessoa que alcance a URL e a API
pode apagar registros. Há um campo de token que envia `Authorization: Bearer <token>`
em toda requisição, mas ele só serve depois que a sua API passar a validar esse
cabeçalho. Enquanto isso, mantenha o painel apenas em `localhost`.

Se você não vai usar token, dá para remover: apague o `<label>` e o `<input
id="api-token">` do `index.html`, e o bloco `if (estado.token || ...)` em `app.js`.

## Documentos

- **[INTEGRACAO.md](INTEGRACAO.md)** — o contrato que o front espera da sua API.
- **[TESTES.md](TESTES.md)** — como testar e caçar erros.
- **[WEBSTORM.md](WEBSTORM.md)** — configurar o IDE: lint, Prettier, Vitest, debug.
- **[ANALISE.md](ANALISE.md)** — o que foi corrigido e por quê.
- **[COMO-APLICAR.md](COMO-APLICAR.md)** — quais arquivos substituir.
- **[classpath.http](classpath.http)** — requisições para testar a **sua** API pelo
  HTTP Client do WebStorm. É só um cliente; não sobe nada.
