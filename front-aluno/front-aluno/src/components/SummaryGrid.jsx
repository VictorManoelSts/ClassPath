import { Bell, BookOpen, CalendarDays } from "lucide-react";

const CARTOES = [
  { chave: "disciplinas", icone: BookOpen, rotulo: "Disciplinas" },
  { chave: "aulas", icone: CalendarDays, rotulo: "Aulas na semana" },
  { chave: "avisos", icone: Bell, rotulo: "Avisos publicados" },
];

export default function SummaryGrid({ totais }) {
  return (
    <section className="summary-grid" aria-label="Resumo acadêmico" aria-live="polite">
      {CARTOES.map(({ chave, icone: Icone, rotulo }) => (
        <article className="summary-card" key={chave}>
          <Icone size={19} aria-hidden="true" />
          <div>
            <strong>{totais[chave]}</strong>
            <span>{rotulo}</span>
          </div>
        </article>
      ))}
    </section>
  );
}
