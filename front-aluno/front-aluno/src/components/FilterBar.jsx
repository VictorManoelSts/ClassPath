import { ChevronDown, X } from "lucide-react";

export default function FilterBar({ disciplinas, disciplinaId, aoAlterar, desabilitado }) {
  return (
    <section className="filter-bar">
      <label htmlFor="disciplina">Disciplina</label>

      <div className="select-wrap">
        <select
          id="disciplina"
          value={disciplinaId}
          onChange={(evento) => aoAlterar(evento.target.value)}
          disabled={desabilitado}
        >
          <option value="">Todas as disciplinas</option>
          {disciplinas.map((disciplina) => (
            <option key={disciplina.id} value={disciplina.id}>
              {disciplina.nome}
            </option>
          ))}
        </select>
        <ChevronDown size={16} aria-hidden="true" />
      </div>

      {disciplinaId && (
        <button className="clear-filter" type="button" onClick={() => aoAlterar("")}>
          <X size={15} aria-hidden="true" />
          Limpar
        </button>
      )}
    </section>
  );
}
