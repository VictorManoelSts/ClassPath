import { buscarLista, comoLista, limparCache, rotas, urlAbsoluta } from "./api";

function respostaOk(corpo: unknown) {
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify(corpo),
  };
}

function respostaErro(status: number, corpo: unknown) {
  return {
    ok: false,
    status,
    text: async () => JSON.stringify(corpo),
  };
}

beforeEach(() => {
  limparCache();
});

describe("comoLista", () => {
  // Regressão: a API respondendo um objeto de erro quebrava o @for no template.
  it("transforma qualquer coisa que não seja array em lista vazia", () => {
    expect(comoLista([1, 2])).toEqual([1, 2]);
    expect(comoLista({ erro: "boom" })).toEqual([]);
    expect(comoLista(null)).toEqual([]);
    expect(comoLista("texto")).toEqual([]);
  });
});

describe("rotas", () => {
  it("monta a query só quando há filtro", () => {
    expect(rotas.horarios("")).toBe("/horarios");
    expect(rotas.horarios(3)).toBe("/horarios?disciplinaId=3");
    expect(rotas.avisos("a b")).toBe("/avisos?disciplinaId=a%20b");
  });
});

describe("urlAbsoluta", () => {
  it("resolve caminho relativo contra o endereço da API", () => {
    expect(urlAbsoluta("/arquivos/a.pdf")).toBe("http://localhost:8080/arquivos/a.pdf");
    expect(urlAbsoluta("arquivos/a.pdf")).toBe("http://localhost:8080/arquivos/a.pdf");
  });

  it("deixa URL absoluta como está", () => {
    expect(urlAbsoluta("https://cdn.exemplo/a.pdf")).toBe("https://cdn.exemplo/a.pdf");
  });

  it("devolve null sem url", () => {
    expect(urlAbsoluta(null)).toBeNull();
  });
});

describe("buscarLista", () => {
  it("devolve a lista da API", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respostaOk([{ id: 1 }])));
    await expect(buscarLista("/disciplinas")).resolves.toEqual([{ id: 1 }]);
  });

  it("não repete a requisição dentro da validade do cache", async () => {
    const espiao = vi.fn().mockResolvedValue(respostaOk([{ id: 1 }]));
    vi.stubGlobal("fetch", espiao);

    await buscarLista("/disciplinas");
    await buscarLista("/disciplinas");

    expect(espiao).toHaveBeenCalledTimes(1);
  });

  it("refaz a requisição quando o cache é ignorado", async () => {
    const espiao = vi.fn().mockResolvedValue(respostaOk([]));
    vi.stubGlobal("fetch", espiao);

    await buscarLista("/avisos");
    await buscarLista("/avisos", { ignorarCache: true });

    expect(espiao).toHaveBeenCalledTimes(2);
  });

  it("usa a mensagem de erro que a API mandou", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(respostaErro(409, { erro: "Disciplina possui horários." })),
    );

    await expect(buscarLista("/disciplinas")).rejects.toThrow("Disciplina possui horários.");
  });

  it("dá mensagem legível quando o servidor está fora do ar", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(buscarLista("/disciplinas")).rejects.toThrow(/servidor/i);
  });
});
