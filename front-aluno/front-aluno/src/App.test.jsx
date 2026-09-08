import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { limparCache } from "./api";

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
  },
];

function apiFake({ falhar = false } = {}) {
  return vi.fn(async (url) => {
    if (falhar) throw new TypeError("Failed to fetch");

    const corpo = url.includes("/disciplinas")
      ? DISCIPLINAS
      : url.includes("/horarios")
        ? HORARIOS
        : AVISOS;

    return { ok: true, status: 200, text: async () => JSON.stringify(corpo) };
  });
}

beforeEach(() => {
  limparCache();
  window.history.replaceState({}, "", "/");
});

describe("App", () => {
  it("mostra disciplinas, aulas e avisos vindos da API", async () => {
    vi.stubGlobal("fetch", apiFake());
    render(<App />);

    // "Cálculo I" aparece no card da disciplina, no bloco da grade e no
    // aviso — por isso findAllByText em vez de findByText.
    expect(await screen.findAllByText("Cálculo I")).not.toHaveLength(0);
    expect(await screen.findByText("Prova na sexta")).toBeInTheDocument();
    // "Banco de Dados" também está na <option> do filtro, então busca-se
    // pelo papel de cabeçalho para atingir só o card.
    expect(screen.getByRole("heading", { name: "Banco de Dados" })).toBeInTheDocument();
  });

  it("escreve o filtro na URL ao escolher uma disciplina", async () => {
    vi.stubGlobal("fetch", apiFake());
    const usuario = userEvent.setup();
    render(<App />);

    const seletor = await screen.findByLabelText("Disciplina");
    await usuario.selectOptions(seletor, "1");

    await waitFor(() => {
      expect(new URLSearchParams(window.location.search).get("disciplina")).toBe("1");
    });
  });

  it("reflete o filtro no título da aba", async () => {
    vi.stubGlobal("fetch", apiFake());
    const usuario = userEvent.setup();
    render(<App />);

    const seletor = await screen.findByLabelText("Disciplina");
    await usuario.selectOptions(seletor, "1");

    await waitFor(() => expect(document.title).toBe("Cálculo I | ClassPath"));
  });

  it("mostra o estado de erro quando a API está fora do ar", async () => {
    vi.stubGlobal("fetch", apiFake({ falhar: true }));
    render(<App />);

    expect(await screen.findByRole("alert")).toHaveTextContent(/servidor/i);
    expect(screen.getByRole("button", { name: /tentar de novo/i })).toBeInTheDocument();
  });

  it("não quebra quando a API responde algo que não é lista", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ erro: "formato inesperado" }),
      })),
    );

    render(<App />);
    expect(await screen.findByText(/Nenhuma disciplina cadastrada/i)).toBeInTheDocument();
  });

  it("alterna entre a grade da semana e a lista", async () => {
    vi.stubGlobal("fetch", apiFake());
    const usuario = userEvent.setup();
    render(<App />);

    await screen.findAllByText("Cálculo I");

    const botaoLista = screen.getByRole("button", { name: "Lista" });
    await usuario.click(botaoLista);

    expect(botaoLista).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Sala 12")).toBeInTheDocument();
  });
});
