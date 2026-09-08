import { Bell } from "lucide-react";
import EmptyState from "./EmptyState";
import { LoadingCards } from "./Skeletons";
import { formatarData, ordenarAvisos } from "../utils/formato";

export default function NoticeList({ avisos, carregando }) {
  if (carregando) return <LoadingCards quantidade={2} />;

  if (!avisos.length) {
    return (
      <EmptyState
        icon={Bell}
        title="Nenhum aviso por enquanto"
        text="Os avisos das suas disciplinas aparecem aqui assim que forem publicados."
      />
    );
  }

  return (
    <div className="notice-grid">
      {ordenarAvisos(avisos).map((aviso) => (
        <article className="notice-card" key={aviso.id}>
          <div className="notice-topline">
            <span>{aviso.disciplinaNome}</span>
            <time dateTime={aviso.dataPublicacao}>{formatarData(aviso.dataPublicacao)}</time>
          </div>
          <h3>{aviso.titulo}</h3>
          <p>{aviso.descricao}</p>
        </article>
      ))}
    </div>
  );
}
