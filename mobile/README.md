# Mobile

Aplicativo Android desenvolvido em **Kotlin + Jetpack Compose**, integrando os dois back-ends do sistema (Back Acadêmico e Back Materiais). Equivalente em funcionalidade ao Front Aluno: só consulta, sem login e sem publicação de conteúdo.

## O que já está implementado
- **Grade de Horários** — consome disciplinas + horários (Back Acadêmico), com filtro por disciplina e agrupamento por dia da semana.
- **Avisos** — consome avisos (Back Acadêmico), com filtro por disciplina; avisos gerais aparecem sempre.
- **Materiais** — consome disciplinas (Back Acadêmico) + materiais (Back Materiais) e junta as duas informações na tela, sem que os backs se comuniquem entre si (a "regra de ouro" da arquitetura). Filtro por disciplina e botão de download por item.
- Navegação por barra inferior (3 abas), com estados de carregamento, erro e lista vazia em todas as telas.

## Dados fictícios (mock) enquanto os back-ends não existem
Os dois back-ends ainda não estão prontos, então o app roda inteiro com dados fictícios:

- `data/repository/FakeAcademicoRepository.kt` e `FakeMateriaisRepository.kt` têm listas fixas de disciplinas, horários, avisos e materiais.
- `data/AppConfig.kt` tem a flag `USE_MOCK_DATA` (hoje `true`).

Já existe também o caminho real, pronto para quando os back-ends subirem:

- `data/remote/AcademicoApiService.kt` e `MateriaisApiService.kt` — interfaces Retrofit com os endpoints da documentação do projeto.
- `data/remote/NetworkModule.kt` — configuração do Retrofit/OkHttp/serialização.
- `data/repository/RemoteAcademicoRepository.kt` e `RemoteMateriaisRepository.kt` — implementações reais dos mesmos contratos (`AcademicoRepository`/`MateriaisRepository`) usados pelas telas.

**Para ligar aos back-ends de verdade:** em `AppConfig.kt`, ajuste `BASE_URL_ACADEMICO`/`BASE_URL_MATERIAIS` e troque `USE_MOCK_DATA` para `false`. Nenhuma tela ou ViewModel precisa ser alterado — eles dependem só das interfaces de repositório.

## Estrutura de pacotes
```
com.classpath.mobile
├── data
│   ├── model          # Disciplina, Horario, Aviso, Material
│   ├── remote          # Retrofit (ApiServices + NetworkModule) — pronto, ainda não usado
│   └── repository      # Interfaces + implementações Fake (mock) e Remote (real)
└── ui
    ├── common           # UiState, FilterDropdown, TagChip, Loading/Error/Empty states
    ├── navigation        # Bottom navigation + NavHost
    └── screens
        ├── horarios
        ├── avisos
        └── materiais
```

## Como rodar
Abrir a pasta no Android Studio e rodar em um emulador ou dispositivo físico (minSdk 26). Não precisa de nenhum back-end no ar — os dados fictícios já deixam o app funcional de ponta a ponta.
