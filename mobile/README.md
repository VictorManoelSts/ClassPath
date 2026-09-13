# Mobile

Aplicativo Android desenvolvido em **Kotlin + Jetpack Compose**, integrando os dois back-ends do sistema (Back Acadêmico e Back Materiais). Equivalente em funcionalidade ao Front Aluno: só consulta, sem login e sem publicação de conteúdo.

## O que já está implementado

- **Grade de Horários** — consome disciplinas + horários (Back Acadêmico), com filtro por disciplina e agrupamento por dia da semana.
- **Avisos** — consome avisos (Back Acadêmico), com filtro por disciplina; avisos gerais aparecem sempre.
- **Materiais** — consome disciplinas (Back Acadêmico) + materiais (Back Materiais) e junta as duas informações na tela, sem que os backs se comuniquem entre si (a "regra de ouro" da arquitetura). Filtro por disciplina e botão de download por item.
- Navegação por barra inferior (3 abas), com estados de carregamento, erro e lista vazia em todas as telas.

## Configuração (local.properties)

A configuração de ambiente **não fica mais fixa no código**. Ela agora vem do `local.properties` (arquivo local, fora do controle de versão) e é injetada em tempo de build via `BuildConfig`:

1. Copie `local.properties.example` para `local.properties`.
2. Ajuste as chaves conforme seu ambiente:

```properties
sdk.dir=C:\\Android\\Sdk

# Troque o IP exemplo para o IP da sua rede
USE_MOCK=false
URL_ACADEMICO="http://192.1xx.xx.xxx:8080/"
URL_MATERIAIS="http://192.1xx.xx.xxx:8000/"
```

- `USE_MOCK=true` → app roda inteiro com dados fictícios (nenhum back-end precisa estar no ar).
- `USE_MOCK=false` → app consome os back-ends reais, nos endereços informados em `URL_ACADEMICO`/`URL_MATERIAIS`.

Esses valores chegam em `AppConfig.kt` através de `BuildConfig.USE_MOCK`, `BuildConfig.URL_ACADEMICO` e `BuildConfig.URL_MATERIAIS` (antes eram constantes fixas no próprio `AppConfig.kt`). Nenhuma tela ou ViewModel precisa ser alterada — eles dependem só das interfaces de repositório (`AcademicoRepository`/`MateriaisRepository`).

## Dados fictícios (mock) enquanto os back-ends não existem

- `data/repository/FakeAcademicoRepository.kt` e `FakeMateriaisRepository.kt` têm listas fixas de disciplinas, horários, avisos e materiais.
- Caminho real, pronto para os back-ends de verdade:
  - `data/remote/AcademicoApiService.kt` e `MateriaisApiService.kt` — interfaces Retrofit com os endpoints do projeto.
  - `data/remote/NetworkModule.kt` — configuração do Retrofit/OkHttp/serialização.
  - `data/repository/RemoteAcademicoRepository.kt` e `RemoteMateriaisRepository.kt` — implementações reais dos mesmos contratos usados pelas telas.

## Alinhamento recente com os back-ends

Os modelos e endpoints foram ajustados para bater com o contrato real dos back-ends:

- `Aviso.mensagem` → renomeado para `Aviso.descricao`.
- `Horario.horaInicio` / `Horario.horaFim` → renomeados para `Horario.horarioInicio` / `Horario.horarioFim`.
- `Material` ganhou os campos `tamanho` (Long) e `contentType` (mapeado de `content_type`); `dataUpload` agora é mapeado de `data_upload` via `@SerialName`. O campo `url` deixou de ser recebido do back-end e passou a ser calculado no próprio app, a partir de `AppConfig.BASE_URL_MATERIAIS` + id do material.
- Endpoint de materiais mudou de `materiais` para `api/materiais` em `MateriaisApiService.kt`.
- Versão do Android Gradle Plugin (AGP) atualizada de `9.3.2` para `9.4.0`.

## Estrutura de pacotes

```
com.classpath.mobile
├── data
│   ├── model          # Disciplina, Horario, Aviso, Material
│   ├── remote         # Retrofit (ApiServices + NetworkModule)
│   └── repository     # Interfaces + implementações Fake (mock) e Remote (real)
└── ui
    ├── common         # UiState, FilterDropdown, TagChip, Loading/Error/Empty states
    ├── navigation     # Bottom navigation + NavHost
    └── screens
        ├── horarios
        ├── avisos
        └── materiais
```

## Como rodar

1. Copie `local.properties.example` para `local.properties` e ajuste `sdk.dir`, `USE_MOCK` e as URLs dos back-ends conforme necessário.
2. Abra a pasta no Android Studio e rode em um emulador ou dispositivo físico (minSdk 26).
3. Com `USE_MOCK=true`, não precisa de nenhum back-end no ar — os dados fictícios já deixam o app funcional de ponta a ponta.
        └── materiais
```

## Como rodar
Abrir a pasta no Android Studio e rodar em um emulador ou dispositivo físico (minSdk 26). Não precisa de nenhum back-end no ar — os dados fictícios já deixam o app funcional de ponta a ponta.
