import { BookOpen, UserRound } from "lucide-react";
import EmptyState from "./EmptyState";
import { LoadingCards } from "./Skeletons";

export default function DisciplineList({ disciplinas, carregando, temFiltro, aoSelecionar }) {
  if (carregando) return <LoadingCards quantidade={3} />;

  if (!disciplinas.length) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Nenhuma disciplina cadastrada"
        text="Assim que a coordenação cadastrar as disciplinas, elas aparecem aqui."
      />
    );
  }

  return (
    <div className="discipline-grid">
      {disciplinas.map((disciplina) => (
        <article className="discipline-card" key={disciplina.id}>
          <h3>{disciplina.nome}</h3>
          <p>
            <UserRound size={15} aria-hidden="true" />
            {disciplina.professor}
          </p>
          {!temFiltro && (
            <button type="button" onClick={() => aoSelecionar(String(disciplina.id))}>
              Ver só esta disciplina
            </button>
          )}
        </article>
      ))}
    </div>
  );
}
