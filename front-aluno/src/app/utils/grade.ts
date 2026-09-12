import { ordemDoDia, paraMinutos } from "./formato";
import type { AulaPosicionada, ColunaDoDia, Grade, Horario, LinhaDeHora } from "../core/modelos";

const PIXEIS_POR_MINUTO = 1.05;
const MINUTOS_POR_HORA = 60;

type AulaMedida = Horario & { inicio: number; fim: number };

/**
 * Monta o retângulo de cada aula na coluna do dia.
 *
 * Aulas sem horário de início ou fim não entram na grade — não há onde
 * posicioná-las — e aparecem numa lista separada abaixo, para não
 * sumirem da tela sem explicação.
 */
export function montarGrade(horarios: Horario[]): Grade {
  const comHorario: AulaMedida[] = [];
  const semHorario: Horario[] = [];

  horarios.forEach((horario) => {
    const inicio = paraMinutos(horario.horarioInicio);
    const fim = paraMinutos(horario.horarioFim);

    if (inicio === null || fim === null || fim <= inicio) semHorario.push(horario);
    else comHorario.push({ ...horario, inicio, fim });
  });

  if (!comHorario.length) return { dias: [], horas: [], altura: 0, semHorario };

  const inicioBruto = Math.min(...comHorario.map((aula) => aula.inicio));
  const fimBruto = Math.max(...comHorario.map((aula) => aula.fim));

  // Arredonda para a hora cheia, para os rótulos ficarem alinhados.
  const inicioGrade = Math.floor(inicioBruto / MINUTOS_POR_HORA) * MINUTOS_POR_HORA;
  const fimGrade = Math.ceil(fimBruto / MINUTOS_POR_HORA) * MINUTOS_POR_HORA;

  const porDia = new Map<string, AulaMedida[]>();
  comHorario.forEach((aula) => {
    const dia = aula.diaSemana || "Sem dia";
    if (!porDia.has(dia)) porDia.set(dia, []);
    porDia.get(dia)?.push(aula);
  });

  const dias: ColunaDoDia[] = [...porDia.entries()]
    .sort(([diaA], [diaB]) => ordemDoDia(diaA) - ordemDoDia(diaB))
    .map(([dia, aulas]) => ({
      dia,
      aulas: aulas
        .sort((a, b) => a.inicio - b.inicio)
        .map((aula): AulaPosicionada => ({
          ...aula,
          topo: (aula.inicio - inicioGrade) * PIXEIS_POR_MINUTO,
          altura: Math.max((aula.fim - aula.inicio) * PIXEIS_POR_MINUTO, 34),
        })),
    }));

  const horas: LinhaDeHora[] = [];
  for (let minuto = inicioGrade; minuto <= fimGrade; minuto += MINUTOS_POR_HORA) {
    horas.push({
      minuto,
      rotulo: `${String(Math.floor(minuto / 60)).padStart(2, "0")}:00`,
      topo: (minuto - inicioGrade) * PIXEIS_POR_MINUTO,
    });
  }

  return { dias, horas, altura: (fimGrade - inicioGrade) * PIXEIS_POR_MINUTO, semHorario };
}
