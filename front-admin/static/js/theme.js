(() => {
    const chave = "classpath-admin-tema";
    const raiz = document.documentElement;
    const sistema = window.matchMedia("(prefers-color-scheme: dark)");
    const corDoTema = document.querySelector('meta[name="theme-color"]');
    let preferencia;
    let botao;

    try {
        const temaSalvo = window.localStorage.getItem(chave);
        if (temaSalvo === "light" || temaSalvo === "dark") preferencia = temaSalvo;
    } catch {
        // O navegador pode bloquear o acesso ao armazenamento.
    }

    function aplicarTema() {
        const tema = preferencia ?? (sistema.matches ? "dark" : "light");
        const escuro = tema === "dark";
        raiz.dataset.theme = tema;
        if (corDoTema) corDoTema.content = escuro ? "#121312" : "#fbfbfa";
        if (botao) {
            botao.setAttribute("aria-pressed", String(escuro));
            botao.setAttribute("aria-label", escuro ? "Mudar para o tema claro" : "Mudar para o tema escuro");
        }
    }

    aplicarTema();
    sistema.addEventListener?.("change", aplicarTema);

    document.addEventListener("DOMContentLoaded", () => {
        botao = document.getElementById("alternar-tema");
        if (!botao) return;

        aplicarTema();
        botao.addEventListener("click", () => {
            preferencia = raiz.dataset.theme === "dark" ? "light" : "dark";
            aplicarTema();
            try {
                window.localStorage.setItem(chave, preferencia);
            } catch {
                // A escolha permanece ativa nesta página.
            }
        });
    });
})();
