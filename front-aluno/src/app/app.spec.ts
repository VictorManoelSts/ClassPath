import { APP_BASE_HREF, BrowserPlatformLocation, PlatformLocation } from "@angular/common";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NavigationEnd, Router, provideRouter } from "@angular/router";
import { filter, firstValueFrom } from "rxjs";

import { App } from "./app";
import { routes } from "./app.routes";
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
              ? HORARIOS.filter(
                  (aula) => !url.includes("disciplinaId=2") || aula.disciplinaId === 2,
                )
              : AVISOS.filter(
                  (aviso) => !url.includes("disciplinaId=2") || aviso.disciplinaId === 2,
                );

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

async function montar(url = "/") {
  window.history.replaceState({}, "", url);
  await TestBed.configureTestingModule({
    imports: [App],
    providers: [
      provideRouter(routes),
      { provide: APP_BASE_HREF, useValue: "/" },
      { provide: PlatformLocation, useClass: BrowserPlatformLocation },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(App);
  fixture.detectChanges();
  TestBed.inject(Router).initialNavigation();
  await assentar(fixture);
  return fixture;
}

function navegar(fixture: ComponentFixture<App>, pagina: string): void {
  const link = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>(
    `.main-nav a[href="/${pagina}"]`,
  );
  if (!link) throw new Error(`Link de ${pagina} não encontrado`);
  link.click();
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
  it("abre Avisos e consulta apenas os dados das páginas visitadas", async () => {
    const espiao = apiFake();
    vi.stubGlobal("fetch", espiao);
    const fixture = await montar();
    const host = fixture.nativeElement as HTMLElement;
    const topo = host.querySelector("header");

    expect(TestBed.inject(Router).url).toBe("/avisos");
    expect(texto(fixture)).toContain("Prova na sexta");
    expect(espiao.mock.calls.map(([url]) => url)).toEqual([
      "http://localhost:8080/api/disciplinas",
      "http://localhost:8080/api/avisos",
    ]);

    navegar(fixture, "horarios");
    await assentar(fixture);
    expect(texto(fixture)).toContain("Disciplinas do semestre");
    expect(texto(fixture)).toContain("Ana Ribeiro");
    expect(texto(fixture)).toContain("Sala 12");
    expect(host.querySelector('[aria-current="page"]')?.getAttribute("href")).toBe("/horarios");

    const titulos = [...host.querySelectorAll(".discipline-card h3")].map((elemento) =>
      elemento.textContent?.trim(),
    );

    expect(titulos).toContain("Cálculo I");
    expect(titulos).toContain("Banco de Dados");
    navegar(fixture, "materiais");
    await assentar(fixture);
    expect(texto(fixture)).toContain("Aula 01 - Introdução.pdf");
    expect(texto(fixture)).not.toContain("Sala 12");
    expect(host.querySelector("header")).toBe(topo);

    navegar(fixture, "avisos");
    await assentar(fixture);
    expect(texto(fixture)).toContain("Prova na sexta");
    expect(espiao).toHaveBeenCalledTimes(4);
  });

  it("redireciona URLs desconhecidas para Avisos", async () => {
    vi.stubGlobal("fetch", apiFake());
    const fixture = await montar("/desconhecida");
    expect(TestBed.inject(Router).url).toBe("/avisos");
    expect(texto(fixture)).toContain("Prova na sexta");
  });

  it("consulta e baixa materiais pelo Back Materiais", async () => {
    const espiao = apiFake();
    vi.stubGlobal("fetch", espiao);
    const fixture = await montar("/materiais");

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
    const fixture = await montar("/materiais");

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

  it("mantém a consulta de materiais pendente ao sair e voltar à página", async () => {
    const api = apiFake();
    const urlMateriais = "http://localhost:8000/api/materiais";
    let liberar!: () => void;
    const pendente = new Promise<void>((resolve) => {
      liberar = resolve;
    });
    const espiao = vi.fn(async (url: string) => {
      if (url === urlMateriais) await pendente;
      return api(url);
    });
    vi.stubGlobal("fetch", espiao);
    const fixture = await montar("/materiais");
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('app-material-list [aria-busy="true"]')).toBeTruthy();
    navegar(fixture, "avisos");
    await assentar(fixture);
    expect(texto(fixture)).toContain("Prova na sexta");
    navegar(fixture, "materiais");
    await assentar(fixture);

    expect(espiao.mock.calls.filter(([url]) => url === urlMateriais)).toHaveLength(1);
    liberar();
    await assentar(fixture);
    expect(texto(fixture)).toContain("Aula 01 - Introdução.pdf");
  });

  it("permite repetir uma consulta de materiais que falhou", async () => {
    const api = apiFake();
    const espiao = vi.fn(api);
    espiao.mockImplementationOnce(api).mockRejectedValueOnce(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", espiao);
    const fixture = await montar("/materiais");

    expect(texto(fixture)).toMatch(/servidor/i);
    botaoPorTexto(fixture, "Tentar de novo").click();
    await assentar(fixture);
    expect(texto(fixture)).toContain("Aula 01 - Introdução.pdf");
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
    vi.stubGlobal("fetch", apiFake());
    const fixture = await montar("/avisos?disciplina=2");

    const seletor = (fixture.nativeElement as HTMLElement).querySelector(
      "#disciplina",
    ) as HTMLSelectElement;

    expect(seletor.value).toBe("2");
    expect(texto(fixture)).toContain("Nenhum aviso por enquanto");
    navegar(fixture, "horarios");
    await assentar(fixture);
    const novoSeletor = (fixture.nativeElement as HTMLElement).querySelector<HTMLSelectElement>(
      "#disciplina",
    );
    expect(novoSeletor?.value).toBe("");
    expect(texto(fixture)).toContain("Sala 12");
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
    const fixture = await montar("/horarios");

    expect(texto(fixture)).toContain("Nenhuma disciplina cadastrada");
  });

  it("alterna entre a grade da semana e a lista", async () => {
    vi.stubGlobal("fetch", apiFake());
    const fixture = await montar("/horarios");

    const botaoLista = botaoPorTexto(fixture, "Lista");
    botaoLista.click();
    await assentar(fixture);

    expect(botaoLista.getAttribute("aria-pressed")).toBe("true");
    expect(texto(fixture)).toContain("Sala 12");
  });

  it("desenha a grade da semana com uma coluna por dia", async () => {
    vi.stubGlobal("fetch", apiFake());
    const fixture = await montar("/horarios");

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
    vi.stubGlobal("fetch", apiFake());
    const fixture = await montar("/?disciplina=1");

    botaoPorTexto(fixture, "Limpar").click();
    await assentar(fixture);

    expect(new URLSearchParams(window.location.search).get("disciplina")).toBeNull();
    expect(document.title).toBe("ClassPath | Portal do aluno");
  });

  it("desfaz o filtro quando o usuário aperta voltar no navegador", async () => {
    vi.stubGlobal("fetch", apiFake());
    const fixture = await montar("/horarios");

    const seletor = (fixture.nativeElement as HTMLElement).querySelector(
      "#disciplina",
    ) as HTMLSelectElement;
    seletor.value = "2";
    seletor.dispatchEvent(new Event("change"));
    await assentar(fixture);

    expect(texto(fixture)).toContain("Nenhuma aula nesta seleção");

    const voltou = firstValueFrom(
      TestBed.inject(Router).events.pipe(filter((evento) => evento instanceof NavigationEnd)),
    );
    window.history.back();
    await voltou;
    await assentar(fixture);

    expect(
      (fixture.nativeElement as HTMLElement).querySelectorAll(".discipline-card"),
    ).toHaveLength(2);
    expect(texto(fixture)).toContain("Sala 12");
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
    navegar(fixture, "materiais");
    await assentar(fixture);
    expect(document.documentElement.dataset["theme"]).toBe(
      window.localStorage.getItem("classpath-tema"),
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
