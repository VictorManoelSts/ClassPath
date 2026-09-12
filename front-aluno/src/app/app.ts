import { ChangeDetectionStrategy, Component, computed, effect, inject } from "@angular/core";

import { DisciplineList } from "./componentes/discipline-list/discipline-list";
import { ErrorState } from "./componentes/error-state/error-state";
import { FilterBar } from "./componentes/filter-bar/filter-bar";
import { NoticeList } from "./componentes/notice-list/notice-list";
import { ScheduleView } from "./componentes/schedule-view/schedule-view";
import { SummaryGrid } from "./componentes/summary-grid/summary-grid";
import { Topbar } from "./componentes/topbar/topbar";

import { DadosAcademicosService } from "./core/dados-academicos.service";
import { FiltroUrlService } from "./core/filtro-url.service";
import { OnlineService } from "./core/online.service";
import { TituloService } from "./core/titulo.service";
import { dataDeHoje } from "./utils/formato";
import { environment } from "../environments/environment";

@Component({
  selector: "app-root",
  imports: [DisciplineList, ErrorState, FilterBar, NoticeList, ScheduleView, SummaryGrid, Topbar],
  templateUrl: "./app.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly dados = inject(DadosAcademicosService);
  private readonly filtro = inject(FiltroUrlService);
  private readonly titulo = inject(TituloService);
  private readonly onlineService = inject(OnlineService);

  protected readonly periodo = environment.periodo;
  protected readonly hoje = dataDeHoje();

  protected readonly online = this.onlineService.online;
  protected readonly disciplinas = this.dados.disciplinas;
  protected readonly horarios = this.dados.horarios;
  protected readonly avisos = this.dados.avisos;
  protected readonly primeiraCarga = this.dados.primeiraCarga;
  protected readonly erro = this.dados.erro;
  protected readonly disciplinaId = this.filtro.disciplina;
  protected readonly disciplinaSelecionada = this.dados.disciplinaSelecionada;

  /** Com filtro ativo, a lista mostra só a disciplina escolhida. */
  protected readonly disciplinasVisiveis = computed(() => {
    const selecionada = this.disciplinaSelecionada();
    return selecionada ? [selecionada] : this.disciplinas();
  });

  protected readonly totalDisciplinas = computed(() =>
    this.disciplinaSelecionada() ? 1 : this.disciplinas().length,
  );

  /** Esmaece o conteúdo durante a revalidação, mas não na carga inicial. */
  protected readonly revalidando = computed(
    () => this.dados.revalidando() && !this.primeiraCarga(),
  );

  protected readonly semSeletor = computed(
    () => this.primeiraCarga() && this.disciplinas().length === 0,
  );

  constructor() {
    effect(() => this.titulo.definir(this.disciplinaSelecionada()?.nome));
  }

  protected alterarDisciplina(valor: string): void {
    this.filtro.alterar(valor);
  }

  protected recarregar(): void {
    this.dados.recarregar();
  }
}
