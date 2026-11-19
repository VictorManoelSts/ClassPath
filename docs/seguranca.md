# Configuração de segurança

## Desenvolvimento local

Copie o `.env.example` da raiz para `.env` e preencha os campos vazios. Escolha um usuário para o painel e uma senha exclusiva. Reserve `SESSION_COOKIE_SECURE=false` para HTTP em loopback. Use aspas simples nos valores que contêm `$` no `.env`, para preservar literalmente os hashes.

Para gerar os valores, instale `bcrypt` e `Werkzeug` em um ambiente Python e execute o código abaixo no interpretador. O terminal exibirá os segredos gerados. Registre-os diretamente no `.env` local ou no gerenciador de segredos.

```python
import bcrypt
from getpass import getpass
from hashlib import sha256
from secrets import token_urlsafe
from werkzeug.security import generate_password_hash

password = getpass("Senha exclusiva para o operador do painel: ")
assert 16 <= len(password) <= 256
academic, materials = token_urlsafe(32), token_urlsafe(32)

print("ADMIN_PASSWORD_HASH='" + generate_password_hash(password, method="scrypt:32768:8:1") + "'")
print("ADMIN_SECRET_KEY=" + token_urlsafe(32))
print("POSTGRES_PASSWORD=" + token_urlsafe(32))
print("MONGO_INITDB_ROOT_PASSWORD=" + token_urlsafe(32))
print("MONGO_APP_PASSWORD=" + token_urlsafe(32))
print("ACADEMIC_ADMIN_TOKEN=" + academic)
print("ACADEMIC_ADMIN_TOKEN_HASH='" + bcrypt.hashpw(academic.encode(), bcrypt.gensalt(12)).decode() + "'")
print("MATERIALS_ADMIN_TOKEN=" + materials)
print("MATERIALS_ADMIN_TOKEN_HASH=" + sha256(materials.encode()).hexdigest())
```

No Compose, `POSTGRES_PASSWORD` é encaminhada ao Spring como `DATABASE_PASSWORD`, e `ADMIN_SECRET_KEY` chega ao Flask como `SECRET_KEY`. Ao rodar os serviços diretamente, configure os nomes que cada processo lê. O BFF precisa de `URL_SPRING_BOOT` e `URL_FASTAPI` terminadas em `/api`. O Spring recebe apenas o hash BCrypt do token acadêmico, e o serviço de Materiais recebe apenas o SHA-256 de um token aleatório independente de 256 bits. A senha de login usa scrypt e serve para autenticar o operador no Flask.

Defina `CORS_ALLOWED_ORIGINS` com as origens HTTP(S) do Angular, separadas por vírgula, incluindo a porta quando aplicável. Use o endereço exato aberto no navegador, como `http://localhost:5173`. Uma lista vazia impede acesso de outras origens. A leitura pública continua disponível a clientes sem CORS, como o Android.

Execute `docker compose up -d --build --wait` na raiz e abra `http://localhost:5000/login`. As APIs são acessadas entre contêineres pelos nomes dos serviços. O PostgreSQL e o MongoDB não publicam portas no host. Em execuções separadas, configure um endereço alcançável de dentro do contêiner Flask. `localhost` referencia o próprio contêiner.

Volumes PostgreSQL existentes mantêm a senha configurada na criação do usuário. Ao migrar, altere a senha da função PostgreSQL de modo interativo e atualize o segredo correspondente no Compose. O procedimento preserva o volume e os dados.

O MongoDB usa uma rede interna exclusiva com o Back Materiais. A conta da aplicação tem `readWrite` apenas em `MONGO_DB_NAME`. Para volumes MongoDB existentes, siga o [procedimento de migração do GridFS](../back-materiais/README.md#volume-mongodb-existente).

## Produção

- Use HTTPS no proxy público, configure `SESSION_COOKIE_SECURE=true` e proteja a comunicação do BFF com as APIs em uma rede privada confiável ou por TLS. Restrinja o painel a operadores autorizados. Evite registrar headers `Authorization`, `Cookie` e corpos de login. Use um gerenciador de segredos.
- Use `SPRING_PROFILES_ACTIVE=prod` no Compose e aplique o esquema previamente com um usuário de migração. Hibernate valida o esquema por padrão. Somente o perfil `dev` usa `ddl-auto=update`. Dê ao usuário da aplicação apenas os privilégios necessários sobre os dados.
- No proxy, limite a taxa por origem e o corpo das requisições. O upload de materiais aceita 20 MiB por padrão (`MATERIALS_MAX_UPLOAD_BYTES`), mais até 64 KiB de envelope multipart. O BFF mantém as sessões por 30 minutos e aplica limites de 8 tentativas de login e 60 escritas por minuto. O Spring admite até 120 requisições autenticáveis em rotas administrativas por minuto. Os limites locais são globais por processo e podem afetar outros operadores durante tráfego abusivo. Use sessões e limites compartilhados para replicar o BFF.
- O Swagger e `/v3/api-docs` exigem o token de serviço no cabeçalho Bearer, inclusive nas requisições aos recursos da interface. Use um cliente HTTP administrativo para consultar ou exportar o OpenAPI e mantenha o token fora do navegador.
- Os métodos de escrita acadêmicos definidos no Spring dispensam CSRF porque exigem um cabeçalho Bearer explícito e o Spring opera sem sessão. No Flask, o cookie de sessão exige um token CSRF nos formulários de login e logout e nas escritas feitas pelo JavaScript.

## Dependências

Atualização para Spring Boot 3.5.16 e SpringDoc 2.10.0, compatíveis entre si. O Spring Boot 3.5.16 foi o último lançamento OSS da série 3.5. Planeje uma linha com suporte comercial ou uma migração avaliada para o Spring Boot 4. O Tomcat foi atualizado dentro da série 10.1 para 10.1.61, que inclui as correções das CVE-2026-86350 e CVE-2026-101356. O Spring Framework 6.2.19 também corrige a CVE-2024-38809, presente na versão anteriormente gerenciada. [Spring Boot 3.5.16](https://spring.io/blog/2026/06/25/spring-boot-3-5-16-available-now/) · [Matriz SpringDoc](https://springdoc.org/v2/) · [Avisos Tomcat](https://tomcat.apache.org/security-10.html) · [CVE-2024-38809](https://spring.io/security/cve-2024-38809)

O OSV consultou 86 artefatos de compilação e execução resolvidos pelo Maven. Foram encontrados avisos em seis artefatos. A atualização de Commons Lang para 3.18.0, Log4j API para 2.25.5, Jackson Core e Databind para 2.21.7 e pgJDBC para 42.7.12 trata os avisos com correções compatíveis. [Commons Lang](https://commons.apache.org/proper/commons-lang/changes.html) · [Log4j](https://logging.apache.org/security.html) · [Jackson Databind](https://github.com/advisories/GHSA-cxp5-3px4-pw24) · [Jackson Core](https://github.com/advisories/GHSA-7hhh-6rmp-j9qf) · [pgJDBC](https://jdbc.postgresql.org/security/)

A segunda consulta ao OSV retornou apenas CVE-2026-47890 e CVE-2026-47884, ambas no Spring WebMVC. O Spring Framework 6.2.19 também está na faixa afetada pela CVE-2026-59283, identificada nos avisos do fornecedor. A aplicação serve JSON e não usa renderização de fragmentos SSE, `XsltView` nem compilação SpEL, condições dos respectivos avisos. As correções públicas exigem Spring Framework 7. [CVE-2026-47890](https://spring.io/security/cve-2026-47890/) · [CVE-2026-47884](https://spring.io/security/cve-2026-47884/) · [CVE-2026-59283](https://spring.io/security/cve-2026-59283/)

O BFF também atualiza Flask e Requests. O serviço de Materiais atualiza FastAPI e python-multipart para corrigir versões antigas do processamento de formulários. [Flask](https://github.com/pallets/flask/releases) · [Requests](https://github.com/psf/requests/releases) · [Starlette](https://github.com/Kludex/starlette/security) · [python-multipart](https://github.com/Kludex/python-multipart/security)

A execução do OWASP Dependency-Check 13.0.0 parou na atualização do NVD, sem chave de API e sem base local. Para concluir a auditoria, configure `NVD_API_KEY` no ambiente e execute no Back Acadêmico

```bash
mvn org.owasp:dependency-check-maven:13.0.0:check -DnvdApiKeyEnvironmentVariable=NVD_API_KEY
```

## Teste de integração

Use uma pilha Compose isolada, com banco de teste e cookie HTTP local. Exporte a senha do operador de teste como `CLASSPATH_TEST_PASSWORD` no shell que executará o comando. O teste cria e remove seus próprios registros.

```bash
docker compose exec -T -e CLASSPATH_TEST_PASSWORD front-admin python tests/integration_smoke.py
```
