/* ============================================================
   ClassPath — Painel administrativo (Adaptado para BFF Flask)
   ============================================================ */

/* ------------------------------------------------------------
   1. Estado e persistência
   ------------------------------------------------------------ */

const TEMPO_LIMITE = 30000;

const estado = {
    dados: { disciplinas: [], horarios: [], avisos: [] },
    busca: { disciplinas: "", horarios: "", avisos: "" },
    ordem: {},
};

/* ------------------------------------------------------------
   2. Utilidades de DOM
   ------------------------------------------------------------ */

const porId = (id) => document.getElementById(id);

function criar(tag, propriedades = {}, filhos = []) {
    const elemento = document.createElement(tag);
    Object.assign(elemento, propriedades);
    filhos.filter(Boolean).forEach((filho) => elemento.append(filho));
    return elemento;
}

function criarBotao(texto, classe, acao, rotuloAcessivel) {
    const botao = criar("button", { type: "button", textContent: texto, className: `botao pequeno ${classe}` });
    if (rotuloAcessivel) botao.setAttribute("aria-label", rotuloAcessivel);
    botao.addEventListener("click", acao);
    return botao;
}

function adiar(funcao, espera = 200) {
    let temporizador;
    return (...argumentos) => {
        clearTimeout(temporizador);
        temporizador = setTimeout(() => funcao(...argumentos), espera);
    };
}

const comoLista = (valor) => (Array.isArray(valor) ? valor : []);

function dataDeHojeLocal() {
    const agora = new Date();
    return new Date(agora.getTime() - agora.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

const formatarHora = (valor) => (valor ? String(valor).slice(0, 5) : "--:--");

function formatarData(valor) {
    if (!valor) return "—";
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
        .format(new Date(`${valor}T00:00:00`));
}

/* ------------------------------------------------------------
   3. Camada de rede
   ------------------------------------------------------------ */

const statusApi = porId("status-api");
const respostaApi = porId("resposta-api");
const resumoRequisicao = porId("resumo-requisicao");

function urlDaApi(caminho) {
    // Agora o JS chama as rotas do Flask (BFF) em vez do Spring Boot diretamente
    return `/api${caminho}`;
}

function definirStatus(conectado) {
    const rotulo = statusApi.querySelector("span") || statusApi;
    rotulo.textContent = conectado ? "BFF Conectado" : "BFF Desconectado";
    statusApi.className = `status ${conectado ? "status-conectado" : "status-desconectado"}`;
    statusApi.title = rotulo.textContent;
}

function mostrarResposta(metodo, caminho, status, dados) {
    resumoRequisicao.textContent = `${metodo} ${caminho} — HTTP ${status}`;
    respostaApi.textContent =
        dados === null || dados === undefined ? "Resposta sem conteúdo." : JSON.stringify(dados, null, 2);
}

async function requisicao(caminho, opcoes = {}) {
    const { registrarResposta = true, ...opcoesFetch } = opcoes;
    const metodo = opcoesFetch.method || "GET";

    const cabecalhos = { ...opcoesFetch.headers };
    // Só envia como JSON se o body for texto. Se for FormData (arquivo), o navegador monta o cabeçalho sozinho com o 'boundary'.
    if (opcoesFetch.body && typeof opcoesFetch.body === 'string') {
        cabecalhos["Content-Type"] = "application/json";
    }

    // O envio do Token de Autorização foi removido do JS.
    // Se o Spring Boot exigir token futuramente, será o Flask quem o enviará.

    const controller = new AbortController();
    const expirou = setTimeout(() => controller.abort(), TEMPO_LIMITE);

    try {
        const resposta = await fetch(urlDaApi(caminho), {
            ...opcoesFetch,
            headers: cabecalhos,
            signal: controller.signal,
        });

        const texto = await resposta.text();
        let dados = null;

        if (texto) {
            try {
                dados = JSON.parse(texto);
            } catch {
                dados = texto;
            }
        }

        if (registrarResposta || !resposta.ok) {
            mostrarResposta(metodo, caminho, resposta.status, dados);
        }

        if (!resposta.ok) {
            const detalhe = dados?.erro || dados?.message || `O BFF respondeu com HTTP ${resposta.status}`;
            const erro = new Error(detalhe);
            erro.status = resposta.status;
            throw erro;
        }

        definirStatus(true);
        return dados;
    } catch (erro) {
        if (erro.name === "AbortError") {
            definirStatus(false);
            mostrarResposta(metodo, caminho, "tempo esgotado", {
                erro: `O BFF não respondeu em ${TEMPO_LIMITE / 1000}s.`,
            });
            throw new Error(`O BFF não respondeu em ${TEMPO_LIMITE / 1000}s.`);
        }

        if (erro instanceof TypeError) {
            definirStatus(false);
            mostrarResposta(metodo, caminho, "sem resposta", {
                erro: "Não foi possível acessar o back-end (Flask). Confira se ele está rodando.",
            });
            throw new Error("Não foi possível acessar o back-end (Flask). Confira se o servidor está no ar.");
        }

        throw erro;
    } finally {
        clearTimeout(expirou);
    }
}

/* ------------------------------------------------------------
   4. Componentes de interface
   ------------------------------------------------------------ */

let temporizadorMensagem;

function mostrarMensagem(texto, tipo = "sucesso") {
    const mensagem = porId("mensagem");
    clearTimeout(temporizadorMensagem);
    mensagem.textContent = texto;
    mensagem.className = `mensagem visivel ${tipo}`;
    temporizadorMensagem = setTimeout(() => {
        mensagem.className = "mensagem";
    }, 4000);
}

const dialogo = porId("dialogo-confirmacao");
const dialogoTexto = porId("dialogo-texto");
const dialogoConfirmar = porId("dialogo-confirmar");
const dialogoCancelar = porId("dialogo-cancelar");

function confirmar(texto, rotuloAcao = "Excluir") {
    dialogoTexto.textContent = texto;
    dialogoConfirmar.textContent = rotuloAcao;
    dialogo.showModal();

    return new Promise((resolver) => {
        const finalizar = (resultado) => {
            dialogoConfirmar.removeEventListener("click", aoConfirmar);
            dialogoCancelar.removeEventListener("click", aoCancelar);
            dialogo.removeEventListener("close", aoFechar);
            if (dialogo.open) dialogo.close();
            resolver(resultado);
        };

        const aoConfirmar = () => finalizar(true);
        const aoCancelar = () => finalizar(false);
        const aoFechar = () => finalizar(false);

        dialogoConfirmar.addEventListener("click", aoConfirmar);
        dialogoCancelar.addEventListener("click", aoCancelar);
        dialogo.addEventListener("close", aoFechar);
    });
}

const statusRede = porId("status-rede");

function atualizarStatusRede() {
    statusRede.classList.toggle("oculto", navigator.onLine);
}

window.addEventListener("online", atualizarStatusRede);
window.addEventListener("offline", atualizarStatusRede);
atualizarStatusRede();

/* ------------------------------------------------------------
   5. Definição declarativa dos recursos
   ------------------------------------------------------------ */

const RECURSOS = {
    disciplinas: {
        rota: "/disciplinas",
        modo: "tabela",
        tituloNovo: "Cadastrar disciplina",
        tituloEdicao: (item) => `Editar disciplina #${item.id}`,
        idsDom: {
            formulario: "form-disciplina",
            tituloForm: "titulo-form-disciplina",
            cancelar: "cancelar-disciplina",
            campoId: "disciplina-id",
            corpoTabela: "tabela-disciplinas",
            cabecalhoTabela: "cabecalho-disciplinas",
            busca: "busca-disciplinas",
            contador: "total-disciplinas",
        },
        campos: [
            { chave: "nome", id: "disciplina-nome", exigido: "Informe o nome da disciplina." },
            { chave: "professor", id: "disciplina-professor", exigido: "Informe o nome do professor." },
        ],
        colunas: [
            { chave: "id", titulo: "ID", numerica: true },
            { chave: "nome", titulo: "Nome" },
            { chave: "professor", titulo: "Professor" },
        ],
        ordemPadrao: { chave: "nome", direcao: "asc" },
        textoBusca: (item) => `${item.id} ${item.nome} ${item.professor}`,
        rotuloItem: (item) => item.nome,
        vazio: "Nenhuma disciplina cadastrada.",
        mensagemExclusao: (item) =>
            `A disciplina “${item.nome}” será removida. Se houver horários ou avisos ligados a ela, a API vai recusar (HTTP 409).`,
        aposSalvar: ["horarios", "avisos"],
    },

    horarios: {
        rota: "/horarios",
        modo: "tabela",
        tituloNovo: "Cadastrar horário",
        tituloEdicao: (item) => `Editar horário #${item.id}`,
        idsDom: {
            formulario: "form-horario",
            tituloForm: "titulo-form-horario",
            cancelar: "cancelar-horario",
            campoId: "horario-id",
            corpoTabela: "tabela-horarios",
            cabecalhoTabela: "cabecalho-horarios",
            busca: "busca-horarios",
            contador: "total-horarios",
            filtro: "filtro-horarios",
        },
        campos: [
            {
                chave: "disciplinaId",
                id: "horario-disciplina",
                exigido: "Escolha a disciplina.",
                ler: (valor) => Number(valor),
                escrever: (item) => item.disciplinaId,
            },
            { chave: "diaSemana", id: "horario-dia", exigido: "Escolha o dia da semana." },
            {
                chave: "horarioInicio",
                id: "horario-inicio",
                exigido: "Informe o horário de início.",
                escrever: (item) => formatarHora(item.horarioInicio),
            },
            {
                chave: "horarioFim",
                id: "horario-fim",
                exigido: "Informe o horário de fim.",
                escrever: (item) => formatarHora(item.horarioFim),
            },
            { chave: "sala", id: "horario-sala", ler: (valor) => valor.trim() || null },
        ],
        validar: (dados) =>
            dados.horarioFim <= dados.horarioInicio
                ? "O horário de fim precisa ser maior que o de início."
                : null,
        colunas: [
            { chave: "id", titulo: "ID", numerica: true },
            { chave: "disciplinaNome", titulo: "Disciplina" },
            { chave: "diaSemana", titulo: "Dia" },
            {
                chave: "horarioInicio",
                titulo: "Horário",
                formatar: (item) => `${formatarHora(item.horarioInicio)} – ${formatarHora(item.horarioFim)}`,
            },
            { chave: "sala", titulo: "Sala" },
        ],
        ordemPadrao: { chave: "id", direcao: "asc" },
        textoBusca: (item) =>
            `${item.id} ${item.disciplinaNome} ${item.diaSemana} ${item.sala || ""} ${formatarHora(item.horarioInicio)}`,
        rotuloItem: (item) => `${item.disciplinaNome} — ${item.diaSemana}`,
        vazio: "Nenhum horário encontrado.",
        mensagemExclusao: (item) =>
            `O horário de ${item.diaSemana} (${formatarHora(item.horarioInicio)}) será removido.`,
    },

    avisos: {
        rota: "/avisos",
        modo: "cartoes",
        tituloNovo: "Cadastrar aviso",
        tituloEdicao: (item) => `Editar aviso #${item.id}`,
        idsDom: {
            formulario: "form-aviso",
            tituloForm: "titulo-form-aviso",
            cancelar: "cancelar-aviso",
            campoId: "aviso-id",
            lista: "lista-avisos",
            busca: "busca-avisos",
            contador: "total-avisos",
            filtro: "filtro-avisos",
        },
        campos: [
            {
                chave: "disciplinaId",
                id: "aviso-disciplina",
                exigido: "Escolha a disciplina.",
                ler: (valor) => Number(valor),
                escrever: (item) => item.disciplinaId,
            },
            { chave: "titulo", id: "aviso-titulo", exigido: "Informe o título do aviso." },
            { chave: "descricao", id: "aviso-descricao", exigido: "Escreva a descrição do aviso." },
            { chave: "dataPublicacao", id: "aviso-data", exigido: "Informe a data de publicação." },
        ],
        ordemPadrao: { chave: "dataPublicacao", direcao: "desc" },
        textoBusca: (item) => `${item.id} ${item.titulo} ${item.disciplinaNome} ${item.descricao}`,
        rotuloItem: (item) => item.titulo,
        vazio: "Nenhum aviso encontrado.",
        mensagemExclusao: (item) => `O aviso “${item.titulo}” será removido.`,
        valoresPadrao: { "aviso-data": dataDeHojeLocal },
    },
};

Object.entries(RECURSOS).forEach(([nome, config]) => {
    estado.ordem[nome] = { ...config.ordemPadrao };
});

/* ------------------------------------------------------------
   6. Renderização genérica
   ------------------------------------------------------------ */

function itensVisiveis(nome) {
    const config = RECURSOS[nome];
    const termo = estado.busca[nome].trim().toLowerCase();
    const { chave, direcao } = estado.ordem[nome];

    const filtrados = termo
        ? estado.dados[nome].filter((item) => config.textoBusca(item).toLowerCase().includes(termo))
        : [...estado.dados[nome]];

    const coluna = (config.colunas || []).find((c) => c.chave === chave);
    const sinal = direcao === "desc" ? -1 : 1;

    return filtrados.sort((a, b) => {
        const x = a[chave];
        const y = b[chave];
        if (x === y) return 0;
        if (x === null || x === undefined) return 1;
        if (y === null || y === undefined) return -1;
        if (coluna?.numerica) return (Number(x) - Number(y)) * sinal;
        return String(x).localeCompare(String(y), "pt-BR", { numeric: true }) * sinal;
    });
}

function renderizarCabecalho(nome) {
    const config = RECURSOS[nome];
    const alvo = porId(config.idsDom.cabecalhoTabela);
    if (!alvo) return;

    const linha = criar("tr");

    config.colunas.forEach((coluna) => {
        const ordem = estado.ordem[nome];
        const ativa = ordem.chave === coluna.chave;
        const celula = criar("th", { scope: "col" });
        celula.setAttribute("aria-sort", ativa ? (ordem.direcao === "asc" ? "ascending" : "descending") : "none");

        const botao = criar("button", {
            type: "button",
            className: `ordenar${ativa ? " ativa" : ""}`,
            textContent: coluna.titulo,
        });
        botao.append(criar("span", { className: "seta", textContent: ativa ? (ordem.direcao === "asc" ? "↑" : "↓") : "" }));
        botao.addEventListener("click", () => {
            const mesma = ordem.chave === coluna.chave;
            estado.ordem[nome] = {
                chave: coluna.chave,
                direcao: mesma && ordem.direcao === "asc" ? "desc" : "asc",
            };
            renderizar(nome);
        });

        celula.append(botao);
        linha.append(celula);
    });

    linha.append(criar("th", { scope: "col", textContent: "Ações" }));
    alvo.replaceChildren(linha);
}

function renderizarTabela(nome) {
    const config = RECURSOS[nome];
    const corpo = porId(config.idsDom.corpoTabela);
    const lista = itensVisiveis(nome);

    renderizarCabecalho(nome);
    corpo.replaceChildren();

    if (!lista.length) {
        const celula = criar("td", {
            textContent: estado.busca[nome] ? "Nenhum resultado para essa busca." : config.vazio,
            className: "vazio",
            colSpan: config.colunas.length + 1,
        });
        corpo.append(criar("tr", {}, [celula]));
        return;
    }

    lista.forEach((item) => {
        const linha = criar("tr");

        config.colunas.forEach((coluna) => {
            const conteudo = coluna.formatar ? coluna.formatar(item) : item[coluna.chave];
            linha.append(criar("td", { textContent: conteudo ?? "—" }));
        });

        const rotulo = config.rotuloItem(item);
        linha.append(
            criar("td", {}, [
                criarBotao("Editar", "secundario", () => editar(nome, item), `Editar ${rotulo}`),
                criarBotao("Excluir", "perigo", () => excluir(nome, item), `Excluir ${rotulo}`),
            ]),
        );

        corpo.append(linha);
    });
}

function renderizarCartoes(nome) {
    const config = RECURSOS[nome];
    const alvo = porId(config.idsDom.lista);
    const lista = itensVisiveis(nome);

    alvo.replaceChildren();

    if (!lista.length) {
        alvo.append(
            criar("p", {
                className: "vazio",
                textContent: estado.busca[nome] ? "Nenhum resultado para essa busca." : config.vazio,
            }),
        );
        return;
    }

    lista.forEach((item) => {
        const rotulo = config.rotuloItem(item);
        const acoes = criar("div", { className: "acoes-formulario" }, [
            criarBotao("Editar", "secundario", () => editar(nome, item), `Editar ${rotulo}`),
            criarBotao("Excluir", "perigo", () => excluir(nome, item), `Excluir ${rotulo}`),
        ]);

        alvo.append(
            criar("article", { className: "cartao-aviso" }, [
                criar("h3", { textContent: item.titulo }),
                criar("small", {
                    textContent: `#${item.id} · ${item.disciplinaNome} · ${formatarData(item.dataPublicacao)}`,
                }),
                criar("p", { textContent: item.descricao }),
                acoes,
            ]),
        );
    });
}

function renderizar(nome) {
    const config = RECURSOS[nome];
    porId(config.idsDom.contador).textContent = estado.dados[nome].length;

    if (config.modo === "cartoes") renderizarCartoes(nome);
    else renderizarTabela(nome);
}

/* ------------------------------------------------------------
   7. Controlador de recurso
   ------------------------------------------------------------ */

function lerFormulario(nome) {
    const config = RECURSOS[nome];
    const dados = {};

    for (const campo of config.campos) {
        const bruto = porId(campo.id).value;
        const valor = campo.ler ? campo.ler(bruto) : bruto.trim();

        if (campo.exigido && (valor === "" || valor === null || Number.isNaN(valor))) {
            porId(campo.id).focus();
            throw new Error(campo.exigido);
        }

        dados[campo.chave] = valor;
    }

    const problema = config.validar?.(dados);
    if (problema) throw new Error(problema);

    return dados;
}

function limparFormulario(nome) {
    const config = RECURSOS[nome];
    porId(config.idsDom.formulario).reset();
    porId(config.idsDom.campoId).value = "";
    porId(config.idsDom.tituloForm).textContent = config.tituloNovo;
    porId(config.idsDom.cancelar).classList.add("oculto");

    Object.entries(config.valoresPadrao || {}).forEach(([id, valor]) => {
        porId(id).value = typeof valor === "function" ? valor() : valor;
    });
}

function editar(nome, item) {
    const config = RECURSOS[nome];

    porId(config.idsDom.campoId).value = item.id;
    config.campos.forEach((campo) => {
        const valor = campo.escrever ? campo.escrever(item) : item[campo.chave];
        porId(campo.id).value = valor ?? "";
    });

    porId(config.idsDom.tituloForm).textContent = config.tituloEdicao(item);
    porId(config.idsDom.cancelar).classList.remove("oculto");

    abrirAba(nome);

    const painel = porId(nome).querySelector(".formulario-painel");
    painel?.scrollIntoView({ behavior: "smooth", block: "center" });
    config.campos[0] && porId(config.campos[0].id).focus({ preventScroll: true });
}

async function excluir(nome, item) {
    const config = RECURSOS[nome];
    const confirmado = await confirmar(config.mensagemExclusao(item));
    if (!confirmado) return;

    try {
        await requisicao(`${config.rota}/${item.id}`, { method: "DELETE" });
        mostrarMensagem(`${config.rotuloItem(item)} excluído.`);

        if (porId(config.idsDom.campoId).value === String(item.id)) limparFormulario(nome);

        await carregar(nome, false);
        if (nome === "disciplinas") atualizarSelectsDeDisciplina();
    } catch (erro) {
        mostrarMensagem(erro.message, "erro");
    }
}

async function salvar(nome) {
    // Se for material, isolamos a lógica
    if (nome === "materiais") {
        const fileInput = porId("material-arquivo");
        if (!fileInput.files.length) throw new Error("Selecione um arquivo PDF.");
        if (!porId("material-disciplina").value) throw new Error("Escolha a disciplina.");

        const formData = new FormData();
        formData.append("disciplina_id", porId("material-disciplina").value);
        formData.append("file", fileInput.files[0]);

        await requisicao("/materiais", { method: "POST", body: formData });

        mostrarMensagem("Material enviado com sucesso!");
        porId("material-arquivo").value = ""; // Limpa só o input do PDF
        await carregarMateriais();            // Atualiza a lista automaticamente!
        return; // Interrompe a execução para não rodar a lógica genérica abaixo
    }

    // --- Lógica original genérica para o Spring Boot (JSON) ---
    const config = RECURSOS[nome];
    const id = porId(config.idsDom.campoId).value;
    const dados = lerFormulario(nome);

    await requisicao(id ? `${config.rota}/${id}` : config.rota, {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(dados),
    });

    mostrarMensagem(id ? "Alterações salvas." : `${config.tituloNovo.replace("Cadastrar ", "")} cadastrado.`);
    limparFormulario(nome);

    await carregar(nome, false);
    if (nome === "disciplinas") atualizarSelectsDeDisciplina();

    for (const dependente of config.aposSalvar || []) {
        await carregar(dependente, false);
    }
}

async function carregar(nome, registrarResposta = true) {
    const config = RECURSOS[nome];
    const filtro = config.idsDom.filtro ? porId(config.idsDom.filtro).value : "";
    const consulta = filtro ? `?disciplinaId=${encodeURIComponent(filtro)}` : "";

    estado.dados[nome] = comoLista(await requisicao(`${config.rota}${consulta}`, { registrarResposta }));
    renderizar(nome);
}

async function carregarTudo() {
    try {
        await carregar("disciplinas", false);
        atualizarSelectsDeDisciplina();
        await carregar("horarios", false);
        await carregar("avisos");
        mostrarMensagem("Conectado. Dados atualizados.");
    } catch (erro) {
        mostrarMensagem(erro.message, "erro");
    }
}

function preencherSelect(select, incluirTodos = false) {
    const valorAtual = select.value;

    select.replaceChildren(
        criar("option", { value: "", textContent: incluirTodos ? "Todas as disciplinas" : "Selecione uma disciplina..." }),
        ...estado.dados.disciplinas.map((disciplina) =>
            criar("option", { value: disciplina.id, textContent: `${disciplina.nome} — ${disciplina.professor}` }),
        ),
    );

    if ([...select.options].some((opcao) => opcao.value === valorAtual)) select.value = valorAtual;
}

function atualizarSelectsDeDisciplina() {
    preencherSelect(porId("horario-disciplina"));
    preencherSelect(porId("aviso-disciplina"));
    preencherSelect(porId("filtro-horarios"), true);
    preencherSelect(porId("filtro-avisos"), true);
    preencherSelect(porId("material-disciplina"));
}

/* ------------------------------------------------------------
   8. Abas
   ------------------------------------------------------------ */

const abas = [...document.querySelectorAll(".aba")];

function abrirAba(nome, focar = false) {
    abas.forEach((aba) => {
        const ativa = aba.dataset.alvo === nome;
        aba.classList.toggle("ativa", ativa);
        aba.setAttribute("aria-selected", String(ativa));
        aba.tabIndex = ativa ? 0 : -1;
        if (ativa && focar) aba.focus();
    });

    document.querySelectorAll(".secao-recurso").forEach((secao) => {
        secao.classList.toggle("ativa", secao.id === nome);
    });

    if (location.hash.slice(1) !== nome) history.replaceState({}, "", `#${nome}`);
}

abas.forEach((aba, indice) => {
    aba.addEventListener("click", () => abrirAba(aba.dataset.alvo));
    aba.addEventListener("keydown", (evento) => {
        const passo = {
            ArrowRight: 1,
            ArrowLeft: -1,
            Home: -indice,
            End: abas.length - 1 - indice,
        }[evento.key];

        if (passo === undefined) return;
        evento.preventDefault();
        abrirAba(abas[(indice + passo + abas.length) % abas.length].dataset.alvo, true);
    });
});

/* ------------------------------------------------------------
   9. Inicialização
   ------------------------------------------------------------ */

Object.entries(RECURSOS).forEach(([nome, config]) => {
    porId(config.idsDom.formulario).addEventListener("submit", async (evento) => {
        evento.preventDefault();

        const botao = evento.currentTarget.querySelector('button[type="submit"]');
        const rotulo = botao.textContent;
        botao.disabled = true;
        botao.textContent = "Salvando...";

        try {
            await salvar(nome);
        } catch (erro) {
            mostrarMensagem(erro.message, "erro");
        } finally {
            botao.disabled = false;
            botao.textContent = rotulo;
        }
    });

    porId(config.idsDom.cancelar).addEventListener("click", () => limparFormulario(nome));

    porId(config.idsDom.busca).addEventListener(
        "input",
        adiar((evento) => {
            estado.busca[nome] = evento.target.value;
            renderizar(nome);
        }, 180),
    );

    if (config.idsDom.filtro) {
        porId(config.idsDom.filtro).addEventListener("change", async () => {
            try {
                await carregar(nome);
            } catch (erro) {
                mostrarMensagem(erro.message, "erro");
            }
        });
    }
});

porId("recarregar-disciplinas").addEventListener("click", async () => {
    try {
        await carregar("disciplinas");
        atualizarSelectsDeDisciplina();
    } catch (erro) {
        mostrarMensagem(erro.message, "erro");
    }
});

porId("limpar-resposta").addEventListener("click", () => {
    resumoRequisicao.textContent = "Nenhuma requisição realizada.";
    respostaApi.textContent = "A resposta JSON aparecerá aqui.";
});

Object.keys(RECURSOS).forEach((nome) => limparFormulario(nome));

const abaInicial = location.hash.slice(1);
if (RECURSOS[abaInicial]) abrirAba(abaInicial);

carregarTudo();

// --- Eventos da aba de Materiais ---
const formMaterial = porId("form-material");
if (formMaterial) {
    formMaterial.addEventListener("submit", async (evento) => {
        evento.preventDefault(); // <-- Isso impede a página de recarregar!

        const botao = evento.currentTarget.querySelector('button[type="submit"]');
        const rotulo = botao.textContent;
        botao.disabled = true;
        botao.textContent = "Enviando...";

        try {
            await salvar("materiais");
        } catch (erro) {
            mostrarMensagem(erro.message, "erro");
        } finally {
            botao.disabled = false;
            botao.textContent = rotulo;
        }
    });

    porId("cancelar-material")?.addEventListener("click", () => {
        formMaterial.reset();
    });
}

// --- Renderização da lista de Materiais ---
const selectDisciplinaMaterial = porId("material-disciplina");
const listaMateriais = porId("lista-materiais");

async function carregarMateriais() {
    if (!selectDisciplinaMaterial || !listaMateriais) return;

    const disciplinaId = selectDisciplinaMaterial.value;
    if (!disciplinaId) {
        listaMateriais.innerHTML = '<p class="vazio">Selecione uma disciplina para ver os materiais.</p>';
        return;
    }

    listaMateriais.innerHTML = '<p class="vazio">Carregando materiais...</p>';

    try {
        const dados = await requisicao(`/materiais?disciplinaId=${disciplinaId}`);

        if (!dados || dados.length === 0) {
            listaMateriais.innerHTML = '<p class="vazio">Nenhum material enviado para esta disciplina.</p>';
            return;
        }

        listaMateriais.innerHTML = "";
        dados.forEach(arq => {
            const dataFormatada = formatarData(arq.data_upload.split('T')[0]);
            const tamanhoMB = (arq.tamanho / (1024 * 1024)).toFixed(2);

            const artigo = criar("article", { className: "cartao-aviso" });
            artigo.append(criar("h3", { textContent: arq.nome }));
            artigo.append(criar("small", { textContent: `Data: ${dataFormatada} · Tamanho: ${tamanhoMB} MB` }));

            const acoes = criar("div", { className: "acoes-formulario" });

            // O botão de download falso por enquanto (preparando o terreno para o próximo passo!)
            const btnDownload = criarBotao("Baixar Arquivo", "secundario", () => {
                window.open(`/api/materiais/${arq.id}`, '_blank');
            });
            const btnExcluir = criarBotao("Excluir", "perigo", () => {
                deletarMaterial(arq.id);
            });
            acoes.append(btnDownload);
            acoes.append(btnExcluir);
            artigo.append(acoes);

            listaMateriais.append(artigo);
        });
    } catch (erro) {
        listaMateriais.innerHTML = `<p class="vazio" style="color: var(--danger)">Erro ao carregar: ${erro.message}</p>`;
    }
}

async function deletarMaterial(fileId) {
    if (!confirm("Tem certeza que deseja excluir este material?")) return;

    try {
        const response = await fetch(`/materiais/${fileId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert("Material excluído com sucesso!");
            window.location.reload(); // Recarrega a página para atualizar a lista
        } else {
            const data = await response.json();
            alert(data.erro || "Erro ao excluir o material.");
        }
    } catch (error) {
        console.error("Erro na requisição:", error);
        alert("Erro de conexão ao tentar excluir.");
    }
}


// Quando o usuário trocar a disciplina, recarrega a lista
if (selectDisciplinaMaterial) {
    selectDisciplinaMaterial.addEventListener("change", carregarMateriais);
}