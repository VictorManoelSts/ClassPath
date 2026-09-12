import { extensao, formatarTamanho, normalizarAnexos, urlSegura } from "./anexos";
import type { Anexo } from "../core/modelos";

const anexo = (extra: Partial<Anexo>): Anexo => ({
  id: 1,
  url: "/a.pdf",
  nome: "arquivo",
  tipo: null,
  tamanho: null,
  ...extra,
});

describe("urlSegura", () => {
  it("aceita http, https e caminho relativo", () => {
    expect(urlSegura("https://api.exemplo/a.pdf")).toBe("https://api.exemplo/a.pdf");
    expect(urlSegura("http://api.exemplo/a.pdf")).toBe("http://api.exemplo/a.pdf");
    expect(urlSegura("/arquivos/a.pdf")).toBe("/arquivos/a.pdf");
  });

  // Sem esta barreira, uma URL vinda do banco viraria execução de código.
  it("bloqueia protocolos perigosos", () => {
    expect(urlSegura("javascript:alert(1)")).toBeNull();
    expect(urlSegura("data:text/html,<script>alert(1)</script>")).toBeNull();
    expect(urlSegura("file:///etc/passwd")).toBeNull();
  });

  it("ignora vazio e valor que não é string", () => {
    expect(urlSegura("")).toBeNull();
    expect(urlSegura("   ")).toBeNull();
    expect(urlSegura(null)).toBeNull();
    expect(urlSegura(42)).toBeNull();
  });
});

describe("normalizarAnexos", () => {
  it("lê o formato de campos soltos", () => {
    const anexos = normalizarAnexos({
      id: 1,
      arquivoUrl: "/arquivos/prova.pdf",
      arquivoNome: "prova.pdf",
      arquivoTamanho: 2048,
    });

    expect(anexos).toHaveLength(1);
    expect(anexos[0].nome).toBe("prova.pdf");
    expect(anexos[0].tamanho).toBe(2048);
  });

  it("lê o formato de objeto aninhado", () => {
    const anexos = normalizarAnexos({
      id: 1,
      arquivo: { url: "https://api/x.docx", nome: "roteiro.docx" },
    });

    expect(anexos[0].nome).toBe("roteiro.docx");
  });

  it("lê o formato de lista", () => {
    const anexos = normalizarAnexos({
      id: 1,
      anexos: [
        { id: 1, url: "/a.pdf", nome: "a.pdf" },
        { id: 2, url: "/b.png", nome: "b.png" },
      ],
    });

    expect(anexos.map((a) => a.nome)).toEqual(["a.pdf", "b.png"]);
  });

  it("aceita a lista como strings puras", () => {
    const anexos = normalizarAnexos({ id: 1, anexos: ["/arquivos/lista de presença.pdf"] });
    expect(anexos[0].nome).toBe("lista de presença.pdf");
  });

  it("descarta anexo com URL perigosa em vez de renderizá-lo", () => {
    const anexos = normalizarAnexos({
      id: 1,
      anexos: [{ url: "javascript:alert(1)", nome: "malicioso" }, { url: "/ok.pdf" }],
    });

    expect(anexos).toHaveLength(1);
    expect(anexos[0].url).toBe("/ok.pdf");
  });

  it("devolve lista vazia para aviso sem arquivo", () => {
    expect(normalizarAnexos({ id: 1, titulo: "sem anexo" })).toEqual([]);
    expect(normalizarAnexos(null)).toEqual([]);
  });

  it("inventa um nome quando a API não manda", () => {
    const anexos = normalizarAnexos({ id: 1, arquivoUrl: "https://api/files/2026/edital.pdf" });
    expect(anexos[0].nome).toBe("edital.pdf");
  });
});

describe("formatarTamanho", () => {
  it("escolhe a unidade e usa vírgula decimal", () => {
    expect(formatarTamanho(512)).toBe("512 B");
    expect(formatarTamanho(1536)).toBe("1,5 KB");
    expect(formatarTamanho(5 * 1024 * 1024)).toBe("5,0 MB");
  });

  it("devolve null quando não há tamanho", () => {
    expect(formatarTamanho(null)).toBeNull();
    expect(formatarTamanho(0)).toBeNull();
    expect(formatarTamanho(Number.NaN)).toBeNull();
  });
});

describe("extensao", () => {
  it("tira do nome do arquivo", () => {
    expect(extensao(anexo({ nome: "prova.pdf" }))).toBe("PDF");
  });

  it("cai para o mime type quando o nome não tem extensão", () => {
    expect(extensao(anexo({ nome: "arquivo", tipo: "image/png" }))).toBe("PNG");
  });

  it("tem um rótulo de reserva", () => {
    expect(extensao(anexo({ nome: "arquivo" }))).toBe("ARQUIVO");
  });
});
