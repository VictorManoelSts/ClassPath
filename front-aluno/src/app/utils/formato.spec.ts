import {
  abreviarDia,
  agruparPorDia,
  formatarData,
  formatarHorario,
  ordenarAvisos,
  ordenarHorarios,
  paraMinutos,
} from "./formato";
import type { Horario } from "../core/modelos";

describe("formatarHorario", () => {
  it("corta os segundos", () => {
    expect(formatarHorario("08:30:00")).toBe("08:30");
  });

  it("não quebra com valor ausente", () => {
    expect(formatarHorario(null)).toBe("--:--");
    expect(formatarHorario(undefined)).toBe("--:--");
    expect(formatarHorario("")).toBe("--:--");
  });
});

describe("paraMinutos", () => {
  it("converte para minutos desde a meia-noite", () => {
    expect(paraMinutos("08:00:00")).toBe(480);
    expect(paraMinutos("13:45")).toBe(825);
  });

  it("devolve null para entrada inválida", () => {
    expect(paraMinutos(null)).toBeNull();
    expect(paraMinutos("abc")).toBeNull();
  });
});

describe("formatarData", () => {
  // Regressão: sem o T00:00:00 explícito, o JS interpreta como UTC
  // e em UTC-3 a data volta um dia.
  it("não volta um dia no fuso do Brasil", () => {
    expect(formatarData("2026-03-01")).toContain("01");
  });

  it("trata data ausente e inválida", () => {
    expect(formatarData(null)).toBe("Data não informada");
    expect(formatarData("não é data")).toBe("Data inválida");
  });
});

describe("ordenarHorarios", () => {
  it("ordena por dia da semana e depois por hora", () => {
    const entrada: Horario[] = [
      { id: 1, diaSemana: "Quarta-feira", horarioInicio: "08:00:00" },
      { id: 2, diaSemana: "Segunda-feira", horarioInicio: "14:00:00" },
      { id: 3, diaSemana: "Segunda-feira", horarioInicio: "08:00:00" },
    ];

    expect(ordenarHorarios(entrada).map((h) => h.id)).toEqual([3, 2, 1]);
  });

  // Regressão: o código antigo chamava localeCompare direto e estourava.
  it("não quebra quando horarioInicio vem nulo", () => {
    const entrada = [
      { id: 1, diaSemana: "Segunda-feira", horarioInicio: undefined },
      { id: 2, diaSemana: "Segunda-feira", horarioInicio: "08:00:00" },
    ];

    expect(() => ordenarHorarios(entrada)).not.toThrow();
  });

  it("não altera o array original", () => {
    const entrada: Horario[] = [
      { id: 1, diaSemana: "Sexta-feira", horarioInicio: "08:00" },
      { id: 2, diaSemana: "Segunda-feira", horarioInicio: "08:00" },
    ];
    ordenarHorarios(entrada);
    expect(entrada[0].id).toBe(1);
  });
});

describe("agruparPorDia", () => {
  it("agrupa mantendo a ordem da semana", () => {
    const grupos = agruparPorDia([
      { id: 1, diaSemana: "Sexta-feira", horarioInicio: "08:00" },
      { id: 2, diaSemana: "Segunda-feira", horarioInicio: "10:00" },
      { id: 3, diaSemana: "Segunda-feira", horarioInicio: "08:00" },
    ]);

    expect(grupos.map(([dia]) => dia)).toEqual(["Segunda-feira", "Sexta-feira"]);
    expect(grupos[0][1]).toHaveLength(2);
  });

  it("agrupa aulas sem dia num rótulo próprio", () => {
    const grupos = agruparPorDia([{ id: 1, horarioInicio: "08:00" }]);
    expect(grupos[0][0]).toBe("Sem dia definido");
  });
});

describe("ordenarAvisos", () => {
  it("coloca os mais recentes primeiro", () => {
    const ordenados = ordenarAvisos([
      { id: 1, dataPublicacao: "2026-01-10" },
      { id: 2, dataPublicacao: "2026-03-02" },
    ]);
    expect(ordenados[0].id).toBe(2);
  });
});

describe("abreviarDia", () => {
  it("tira o sufixo -feira", () => {
    expect(abreviarDia("Terça-feira")).toBe("Terça");
    expect(abreviarDia("Sábado")).toBe("Sábado");
  });
});
