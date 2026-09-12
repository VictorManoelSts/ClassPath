import type { Horario, Aviso } from "../core/modelos";

export const ORDEM_DIAS: Record<string, number> = {
  "Segunda-feira": 1,
  "Terça-feira": 2,
  "Quarta-feira": 3,
  "Quinta-feira": 4,
  "Sexta-feira": 5,
  Sábado: 6,
  Domingo: 7,
};

/** "08:00:00" ou "08:00" → "08:00". Valor ausente vira "--:--". */
export function formatarHorario(horario: string | null | undefined): string {
  return horario ? String(horario).slice(0, 5) : "--:--";
}

/** "08:30:00" → 510. Devolve null quando não dá para interpretar. */
export function paraMinutos(horario: string | null | undefined): number | null {
  if (!horario) return null;
  const [hora, minuto] = String(horario).split(":");
  const total = Number(hora) * 60 + Number(minuto);
  return Number.isFinite(total) ? total : null;
}

/** "Segunda-feira" → "Segunda". Usado só onde o espaço é curto. */
export function abreviarDia(dia: string | null | undefined): string {
  return dia ? dia.replace("-feira", "") : "Sem dia";
}

export function ordemDoDia(dia: string | null | undefined): number {
  if (!dia) return 99;
  return ORDEM_DIAS[dia] ?? 99;
}

/**
 * Constrói a data a partir de "YYYY-MM-DD" com T00:00:00 explícito.
 * Sem isso o JS interpreta como UTC e a data volta um dia em UTC-3.
 */
export function formatarData(data: string | null | undefined): string {
  if (!data) return "Data não informada";
  const valor = new Date(`${data}T00:00:00`);
  if (Number.isNaN(valor.getTime())) return "Data inválida";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(valor);
}

export function dataDeHoje(referencia: Date = new Date()): string {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(referencia);
}

/** Ordena por dia da semana e depois por horário de início. */
export function ordenarHorarios(horarios: Horario[]): Horario[] {
  return [...horarios].sort((primeiro, segundo) => {
    const porDia = ordemDoDia(primeiro.diaSemana) - ordemDoDia(segundo.diaSemana);
    if (porDia) return porDia;
    return (primeiro.horarioInicio || "").localeCompare(segundo.horarioInicio || "");
  });
}

/** [["Segunda-feira", [aula, aula]], ...] já na ordem certa. */
export function agruparPorDia(horarios: Horario[]): [string, Horario[]][] {
  const grupos = new Map<string, Horario[]>();

  ordenarHorarios(horarios).forEach((horario) => {
    const dia = horario.diaSemana || "Sem dia definido";
    if (!grupos.has(dia)) grupos.set(dia, []);
    grupos.get(dia)?.push(horario);
  });

  return [...grupos.entries()];
}

/** Avisos mais recentes primeiro. */
export function ordenarAvisos(avisos: Aviso[]): Aviso[] {
  return [...avisos].sort((primeiro, segundo) =>
    String(segundo.dataPublicacao || "").localeCompare(String(primeiro.dataPublicacao || "")),
  );
}
