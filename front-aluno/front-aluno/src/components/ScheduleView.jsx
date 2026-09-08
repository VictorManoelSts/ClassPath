import { useMemo, useState } from "react";
import { CalendarDays, MapPin } from "lucide-react";
import EmptyState from "./EmptyState";
import { LoadingRows } from "./Skeletons";
import { abreviarDia, agruparPorDia, formatarHorario, ordenarHorarios } from "../utils/formato";
import { montarGrade } from "../utils/grade";

function WeekGrid({ horarios }) {
  const { dias, horas, altura, semHorario } = useMemo(() => montarGrade(horarios), [horarios]);

  if (!dias.length) return <ScheduleList horarios={horarios} />;

  return (
    <>
      <div className="week-grid">
        <div
          className="week-grid-inner"
          style={{ "--colunas": dias.length, "--altura": `${altura}px` }}
        >
          <div className="week-hours" aria-hidden="true">
            <div className="week-corner" />
            <div className="week-hours-body">
              {horas.map((hora) => (
                <span className="week-hour" key={hora.minuto} style={{ top: `${hora.topo}px` }}>
                  {hora.rotulo}
                </span>
              ))}
            </div>
          </div>

          {dias.map(({ dia, aulas }) => (
            <div className="week-day" key={dia}>
              <div className="week-day-head">{abreviarDia(dia)}</div>
              <div className="week-day-body">
                {horas.slice(1).map((hora) => (
                  <div
                    className="week-line"
                    key={hora.minuto}
                    style={{ top: `${hora.topo}px` }}
                    aria-hidden="true"
                  />
                ))}

                {aulas.map((aula) => (
                  <article
                    className="week-class"
                    key={aula.id}
                    style={{ top: `${aula.topo}px`, height: `${aula.altura}px` }}
                  >
                    <strong>{aula.disciplinaNome}</strong>
                    <span className="week-class-time">
                      {formatarHorario(aula.horarioInicio)}–{formatarHorario(aula.horarioFim)}
                    </span>
                    {aula.sala && <span className="week-class-room">{aula.sala}</span>}
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {semHorario.length > 0 && (
        <p className="week-note">
          {semHorario.length} {semHorario.length === 1 ? "aula está" : "aulas estão"} sem horário
          válido e {semHorario.length === 1 ? "não aparece" : "não aparecem"} na grade.
        </p>
      )}
    </>
  );
}

function ScheduleList({ horarios }) {
  const porDia = useMemo(() => agruparPorDia(horarios), [horarios]);

  return (
    <div className="schedule-panel">
      {porDia.map(([dia, aulas]) => (
        <div className="schedule-day" key={dia}>
          <div className="schedule-day-label">{dia}</div>
          {aulas.map((horario) => (
            <article className="schedule-row" key={horario.id}>
              <div className="time-block">
                <strong>{formatarHorario(horario.horarioInicio)}</strong>
                <span>às {formatarHorario(horario.horarioFim)}</span>
              </div>
              <div className="class-block">{horario.disciplinaNome}</div>
              <div className="room-block">
                <MapPin size={15} aria-hidden="true" />
                {horario.sala || "Sala a definir"}
              </div>
            </article>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function ScheduleView({ horarios, carregando }) {
  const [visao, setVisao] = useState("grade");
  const ordenados = useMemo(() => ordenarHorarios(horarios), [horarios]);

  if (carregando) {
    return (
      <div className="schedule-panel">
        <LoadingRows quantidade={4} />
      </div>
    );
  }

  if (!ordenados.length) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="Nenhuma aula nesta seleção"
        text="Troque a disciplina no filtro para ver outra grade."
      />
    );
  }

  return (
    <>
      <div className="view-switch" role="group" aria-label="Formato da grade">
        <button
          type="button"
          className={visao === "grade" ? "ativa" : undefined}
          aria-pressed={visao === "grade"}
          onClick={() => setVisao("grade")}
        >
          Semana
        </button>
        <button
          type="button"
          className={visao === "lista" ? "ativa" : undefined}
          aria-pressed={visao === "lista"}
          onClick={() => setVisao("lista")}
        >
          Lista
        </button>
      </div>

      {visao === "grade" ? (
        <WeekGrid horarios={ordenados} />
      ) : (
        <ScheduleList horarios={ordenados} />
      )}
    </>
  );
}
