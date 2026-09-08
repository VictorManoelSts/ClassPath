import { describe, expect, it } from "vitest";
import { montarGrade } from "./grade";

const aula = (extra) => ({
  id: 1,
  diaSemana: "Segunda-feira",
  horarioInicio: "08:00:00",
  horarioFim: "10:00:00",
  disciplinaNome: "Cálculo I",
  ...extra,
});

describe("montarGrade", () => {
  it("posiciona a aula pelo horário de início", () => {
    const { dias, altura } = montarGrade([aula()]);
    const bloco = dias[0].aulas[0];

    expect(bloco.topo).toBe(0);
    expect(bloco.altura).toBeGreaterThan(0);
    expect(altura).toBeGreaterThan(0);
  });

  it("desloca a segunda aula do dia proporcionalmente", () => {
    const { dias } = montarGrade([
      aula({ id: 1, horarioInicio: "08:00:00", horarioFim: "10:00:00" }),
      aula({ id: 2, horarioInicio: "10:00:00", horarioFim: "12:00:00" }),
    ]);

    const [primeira, segunda] = dias[0].aulas;
    expect(segunda.topo).toBeCloseTo(primeira.topo + primeira.altura, 1);
  });

  it("ordena as colunas na ordem da semana", () => {
    const { dias } = montarGrade([
      aula({ id: 1, diaSemana: "Quarta-feira" }),
      aula({ id: 2, diaSemana: "Segunda-feira" }),
    ]);

    expect(dias.map((d) => d.dia)).toEqual(["Segunda-feira", "Quarta-feira"]);
  });

  it("separa aulas com horário inválido em vez de escondê-las", () => {
    const { dias, semHorario } = montarGrade([
      aula({ id: 1 }),
      aula({ id: 2, horarioInicio: null }),
      aula({ id: 3, horarioInicio: "10:00", horarioFim: "09:00" }),
    ]);

    expect(dias[0].aulas).toHaveLength(1);
    expect(semHorario.map((a) => a.id)).toEqual([2, 3]);
  });

  it("gera rótulos de hora cheia cobrindo o intervalo", () => {
    const { horas } = montarGrade([aula({ horarioInicio: "08:30", horarioFim: "10:15" })]);
    expect(horas.map((h) => h.rotulo)).toEqual(["08:00", "09:00", "10:00", "11:00"]);
  });

  it("devolve grade vazia quando não há nenhuma aula válida", () => {
    const { dias, semHorario } = montarGrade([aula({ horarioInicio: null, horarioFim: null })]);
    expect(dias).toHaveLength(0);
    expect(semHorario).toHaveLength(1);
  });
});
