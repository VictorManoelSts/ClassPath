import { useEffect, useMemo } from "react";

import Topbar from "./components/Topbar";
import FilterBar from "./components/FilterBar";
import SummaryGrid from "./components/SummaryGrid";
import DisciplineList from "./components/DisciplineList";
import ScheduleView from "./components/ScheduleView";
import NoticeList from "./components/NoticeList";
import ErrorState from "./components/ErrorState";

import { useDadosAcademicos } from "./hooks/useDadosAcademicos";
import { useFiltroNaUrl } from "./hooks/useFiltroNaUrl";
import { useOnline } from "./hooks/useOnline";
import { useTituloDaPagina } from "./hooks/useTituloDaPagina";
import { dataDeHoje } from "./utils/formato";

const PERIODO_ATUAL = import.meta.env?.VITE_PERIODO || "2026.2";

export default function App() {
  const [disciplinaId, alterarDisciplina, substituirDisciplina] = useFiltroNaUrl("disciplina");
  const online = useOnline();

  const { disciplinas, horarios, avisos, primeiraCarga, revalidando, erro, recarregar } =
    useDadosAcademicos(disciplinaId);

  const disciplinaSelecionada = useMemo(
    () => disciplinas.find((disciplina) => String(disciplina.id) === disciplinaId),
    [disciplinas, disciplinaId],
  );

  // Link antigo apontando para uma disciplina que não existe mais.
  useEffect(() => {
    if (!disciplinaId || !disciplinas.length) return;
    const existe = disciplinas.some((disciplina) => String(disciplina.id) === disciplinaId);
    if (!existe) substituirDisciplina("");
  }, [disciplinas, disciplinaId, substituirDisciplina]);

  useTituloDaPagina(disciplinaSelecionada?.nome);

  const disciplinasVisiveis = disciplinaSelecionada ? [disciplinaSelecionada] : disciplinas;
  const classeConteudo = revalidando && !primeiraCarga ? "is-revalidating" : undefined;

  return (
    <div className="app-shell">
      <a className="pular-para-conteudo" href="#inicio">
        Pular para o conteúdo
      </a>

      {!online && (
        <div className="offline-bar" role="status">
          Você está sem conexão. Os dados na tela podem estar desatualizados.
        </div>
      )}

      <Topbar />

      <main id="inicio" className="page-content" tabIndex={-1}>
        <section className="welcome-row">
          <div>
            <span className="welcome-date">{dataDeHoje()}</span>
            <h1>Sua rotina acadêmica em um só lugar</h1>
            <p>Consulte a grade de aulas e os avisos publicados para cada disciplina.</p>
          </div>
          <div className="academic-period">
            <span>Período</span>
            <strong>{PERIODO_ATUAL}</strong>
          </div>
        </section>

        <FilterBar
          disciplinas={disciplinas}
          disciplinaId={disciplinaId}
          aoAlterar={alterarDisciplina}
          desabilitado={primeiraCarga && disciplinas.length === 0}
        />

        {erro && <ErrorState mensagem={erro} aoTentarNovamente={recarregar} />}

        <SummaryGrid
          totais={{
            disciplinas: disciplinaSelecionada ? 1 : disciplinas.length,
            aulas: horarios.length,
            avisos: avisos.length,
          }}
        />

        <section id="disciplinas" className="content-section">
          <div className="section-heading">
            <h2>{disciplinaSelecionada ? disciplinaSelecionada.nome : "Disciplinas"}</h2>
            {disciplinaSelecionada && <span className="active-filter">Filtro ativo</span>}
          </div>

          <DisciplineList
            disciplinas={disciplinasVisiveis}
            carregando={primeiraCarga}
            temFiltro={Boolean(disciplinaSelecionada)}
            aoSelecionar={alterarDisciplina}
          />
        </section>

        <section id="horarios" className="content-section">
          <div className="section-heading">
            <h2>Grade de horários</h2>
            <span className="section-count">
              {horarios.length} {horarios.length === 1 ? "aula" : "aulas"}
            </span>
          </div>

          <div className={classeConteudo}>
            <ScheduleView horarios={horarios} carregando={primeiraCarga} />
          </div>
        </section>

        <section id="avisos" className="content-section">
          <div className="section-heading">
            <h2>Avisos</h2>
            <span className="section-count">
              {avisos.length} {avisos.length === 1 ? "aviso" : "avisos"}
            </span>
          </div>

          <div className={classeConteudo}>
            <NoticeList avisos={avisos} carregando={primeiraCarga} />
          </div>
        </section>
      </main>

      <footer>
        <div className="footer-brand">
          <span aria-hidden="true">CP</span>
          <strong>ClassPath</strong>
        </div>
        <p>Disciplinas, horários e avisos do período {PERIODO_ATUAL}.</p>
      </footer>
    </div>
  );
}
