import { ComponentFixture, TestBed } from "@angular/core/testing";

import { App } from "./app";
import { limparCache } from "./core/api";

const DISCIPLINAS = [
  { id: 1, nome: "Cálculo I", professor: "Ana Ribeiro" },
  { id: 2, nome: "Banco de Dados", professor: "Carlos Andrade" },
];

const HORARIOS = [
  {
    id: 10,
    disciplinaId: 1,
    disciplinaNome: "Cálculo I",
    diaSemana: "Segunda-feira",
    horarioInicio: "08:00:00",
    horarioFim: "10:00:00",
    sala: "Sala 12",
  },
];

const AVISOS = [
  {
    id: 20,
    disciplinaId: 1,
    disciplinaNome: "Cálculo I",
    titulo: "Prova na sexta",
    descricao: "Conteúdo das aulas 1 a 6.",
    dataPublicacao: "2026-03-01",
    arquivoUrl: "/arquivos/roteiro-prova.pdf",
    arquivoNome: "roteiro-prova.pdf",
    arquivoTamanho: 1536,
  },
  {
    id: 21,
    disciplinaId: 1,
    disciplinaNome: "Cálculo I",
    titulo: "Aula cancelada",
    descricao: "Sem reposição esta semana.",
    dataPublicacao: "2026-02-20",
  },
];

const MATERIAIS = [
  {
    id: "66d1f2a1c8b9a2e4f1a2b3c4",
    nome: "Aula 01 - Introdução.pdf",
    disciplina: "1",
    data_upload: "2026-03-02T14:30:00+00:00",
    tamanho: 1_572_864,
    content_type: "application/pdf",
  },
];

function apiFake({ falhar = false, corpo }: { falhar?: boolean; corpo?: unknown } = {}) {
  return vi.fn(async (url: string) => {
    if (falhar) throw new TypeError("Failed to fetch");

    const dados =
      corpo !== undefined
        ? corpo
        : url.includes(":8000/api/materiais")
          ? MATERIAIS
          : url.includes("/disciplinas")
            ? DISCIPLINAS
            : url.includes("/horarios")
              ? HORARIOS
              : AVISOS;

    return { ok: true, status: 200, text: async () => JSON.stringify(dados) };
  });
}

/** Deixa as promessas do fetch resolverem e repinta a tela. */
async function assentar(fixture: ComponentFixture<App>) {
  for (let volta = 0; volta < 5; volta += 1) {
    await fixture.whenStable();
    fixture.detectChanges();
  }
}

async function montar() {
  await TestBed.configureTestingModule({ imports: [App] }).compileComponents();
  const fixture = TestBed.createComponent(App);
  fixture.detectChanges();
  await assentar(fixture);
  return fixture;
}

function texto(fixture: ComponentFixture<App>): string {
  return (fixture.nativeElement as HTMLElement).textContent ?? "";
}

function botaoPorTexto(fixture: ComponentFixture<App>, rotulo: string): HTMLButtonElement {
  const botoes = [...(fixture.nativeElement as HTMLElement).querySelectorAll("button")];
  const alvo = botoes.find((botao) => botao.textContent?.trim().includes(rotulo));
  if (!alvo) throw new Error(`Botão "${rotulo}" não encontrado`);
  return alvo as HTMLButtonElement;
}

beforeEach(() => {
  limparCache();
  window.history.replaceState({}, "", "/");
});

describe("App", () => {
  it("mostra disciplinas, aulas, materiais e avisos vindos das APIs", async () => {
    vi.stubGlobal("fetch", apiFake());
    const fixture = await montar();

    const titulos = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll(".discipline-card h3"),
    ].map((elemento) => elemento.textContent?.trim());

    expect(titulos).toContain("Cálculo I");
    expect(titulos).toContain("Banco de Dados");
    expect(texto(fixture)).toContain("Aula 01 - Introdução.pdf");
    expect(texto(fixture)).toContain("Prova na sexta");
  });

  it("consulta e baixa materiais pelo Back Materiais", async () => {
    const espiao = apiFake();
    vi.stubGlobal("fetch", espiao);
    const fixture = await montar();

    expect(espiao.mock.calls.some(([url]) => url === "http://localhost:8000/api/materiais")).toBe(
      true,
    );

    const link = (fixture.nativeElement as HTMLElement).querySelector(
      "a.material-download",
    ) as HTMLAnchorElement;

    expect(link.getAttribute("href")).toBe(
      "http://localhost:8000/api/materiais/66d1f2a1c8b9a2e4f1a2b3c4",
    );
    expect(link.getAttribute("download")).toBe("Aula 01 - Introdução.pdf");
    expect(link.textContent).toContain("Baixar");
  });

  it("filtra materiais com o mesmo ID de disciplina selecionado", async () => {
    const espiao = apiFake();
    vi.stubGlobal("fetch", espiao);
    const fixture = await montar();

    const seletor = (fixture.nativeElement as HTMLElement).querySelector(
      "#disciplina",
    ) as HTMLSelectElement;
    seletor.value = "1";
    seletor.dispatchEvent(new Event("change"));
    await assentar(fixture);

    expect(
      espiao.mock.calls.some(([url]) => url === "http://localhost:8000/api/materiais?disciplina=1"),
    ).toBe(true);
  });

  it("escreve o filtro na URL ao escolher uma disciplina", async () => {
    vi.stubGlobal("fetch", apiFake());
    const fixture = await montar();

    const seletor = (fixture.nativeElement as HTMLElement).querySelector(
      "#disciplina",
    ) as HTMLSelectElement;
    seletor.value = "1";
    seletor.dispatchEvent(new Event("change"));
    await assentar(fixture);

    expect(new URLSearchParams(window.location.search).get("disciplina")).toBe("1");
  });

  it("reflete o filtro no título da aba", async () => {
    vi.stubGlobal("fetch", apiFake());
    const fixture = await montar();

    const seletor = (fixture.nativeElement as HTMLElement).querySelector(
      "#disciplina",
    ) as HTMLSelectElement;
    seletor.value = "1";
    seletor.dispatchEvent(new Event("change"));
    await assentar(fixture);

    expect(document.title).toBe("Cálculo I | ClassPath");
  });

  // Regressão do porte: com [value] no <select> a opção vinda da URL não
  // era marcada, porque as opções só chegam depois da primeira pintura.
  it("marca no seletor a disciplina que veio na URL", async () => {
    window.history.replaceState({}, "", "/?disciplina=2");
    vi.stubGlobal("fetch", apiFake());
    const fixture = await montar();

    const seletor = (fixture.nativeElement as HTMLElement).querySelector(
      "#disciplina",
    ) as HTMLSelectElement;

    expect(seletor.value).toBe("2");
  });

  it("mostra o estado de erro quando a API está fora do ar", async () => {
    vi.stubGlobal("fetch", apiFake({ falhar: true }));
    const fixture = await montar();

    const alerta = (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]');
    expect(alerta?.textContent).toMatch(/servidor/i);
    expect(botaoPorTexto(fixture, "Tentar de novo")).toBeTruthy();
  });

  it("não quebra quando a API responde algo que não é lista", async () => {
    vi.stubGlobal("fetch", apiFake({ corpo: { erro: "formato inesperado" } }));
    const fixture = await montar();

    expect(texto(fixture)).toContain("Nenhuma disciplina cadastrada");
  });

  it("alterna entre a grade da semana e a lista", async () => {
    vi.stubGlobal("fetch", apiFake());
    const fixture = await montar();

    const botaoLista = botaoPorTexto(fixture, "Lista");
    botaoLista.click();
    await assentar(fixture);

    expect(botaoLista.getAttribute("aria-pressed")).toBe("true");
    expect(texto(fixture)).toContain("Sala 12");
  });

  it("desenha a grade da semana com uma coluna por dia", async () => {
    vi.stubGlobal("fetch", apiFake());
    const fixture = await montar();

    const grade = (fixture.nativeElement as HTMLElement).querySelector(
      ".week-grid-inner",
    ) as HTMLElement;

    expect(grade.style.getPropertyValue("--colunas")).toBe("1");
    expect(grade.style.getPropertyValue("--altura")).toMatch(/^\d+(\.\d+)?px$/);
  });

  it("mostra o botão de download quando o aviso tem arquivo", async () => {
    vi.stubGlobal("fetch", apiFake());
    const fixture = await montar();

    const link = (fixture.nativeElement as HTMLElement).querySelector(
      "a.attachment",
    ) as HTMLAnchorElement;

    expect(link.getAttribute("download")).toBe("roteiro-prova.pdf");
    expect(link.getAttribute("href")).toBe("http://localhost:8080/arquivos/roteiro-prova.pdf");
    expect(link.textContent).toContain("1,5 KB");
    expect(link.getAttribute("aria-label")).toMatch(/baixar roteiro-prova\.pdf/i);
  });

  it("não mostra nada de download no aviso sem arquivo", async () => {
    vi.stubGlobal("fetch", apiFake());
    const fixture = await montar();

    expect(texto(fixture)).toContain("Aula cancelada");
    expect((fixture.nativeElement as HTMLElement).querySelectorAll("a.attachment")).toHaveLength(1);
  });

  it("limpa o filtro pelo botão e tira o parâmetro da URL", async () => {
    window.history.replaceState({}, "", "/?disciplina=1");
    vi.stubGlobal("fetch", apiFake());
    const fixture = await montar();

    botaoPorTexto(fixture, "Limpar").click();
    await assentar(fixture);

    expect(new URLSearchParams(window.location.search).get("disciplina")).toBeNull();
    expect(document.title).toBe("ClassPath | Portal do aluno");
  });

  it("desfaz o filtro quando o usuário aperta voltar no navegador", async () => {
    vi.stubGlobal("fetch", apiFake());
    const fixture = await montar();

    const seletor = (fixture.nativeElement as HTMLElement).querySelector(
      "#disciplina",
    ) as HTMLSelectElement;
    seletor.value = "1";
    seletor.dispatchEvent(new Event("change"));
    await assentar(fixture);

    // O jsdom percorre o histórico de forma assíncrona e dispara o
    // popstate por conta própria; por isso o respiro antes de assentar.
    window.history.back();
    await new Promise((resolva) => setTimeout(resolva, 20));
    await assentar(fixture);

    expect(
      (fixture.nativeElement as HTMLElement).querySelectorAll(".discipline-card"),
    ).toHaveLength(2);
  });

  it("alterna o tema e guarda a escolha", async () => {
    vi.stubGlobal("fetch", apiFake());
    const fixture = await montar();

    const antes = document.documentElement.dataset["theme"];
    const botao = (fixture.nativeElement as HTMLElement).querySelector(
      ".theme-toggle",
    ) as HTMLButtonElement;

    botao.click();
    await assentar(fixture);

    expect(document.documentElement.dataset["theme"]).not.toBe(antes);
    expect(window.localStorage.getItem("classpath-tema")).toBe(
      document.documentElement.dataset["theme"],
    );
  });

  it("avisa quando o navegador está sem conexão", async () => {
    vi.stubGlobal("fetch", apiFake());
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    const fixture = await montar();

    const barra = (fixture.nativeElement as HTMLElement).querySelector(".offline-bar");
    expect(barra?.textContent).toContain("sem conexão");
  });
});
