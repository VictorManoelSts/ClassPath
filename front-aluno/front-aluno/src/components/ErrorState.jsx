import { CircleAlert, RefreshCw } from "lucide-react";

export default function ErrorState({ mensagem, aoTentarNovamente }) {
  return (
    <section className="error-state" role="alert">
      <CircleAlert size={20} aria-hidden="true" />
      <div>
        <strong>O portal não conseguiu falar com o servidor</strong>
        <p>{mensagem} Confira se o back-end está no ar e tente de novo.</p>
      </div>
      <button type="button" onClick={aoTentarNovamente}>
        <RefreshCw size={15} aria-hidden="true" />
        Tentar de novo
      </button>
    </section>
  );
}
