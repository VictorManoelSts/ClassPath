import { ChangeDetectionStrategy, Component, computed, effect, inject } from "@angular/core";
import { DisciplineList } from "../componentes/discipline-list/discipline-list";
import { ErrorState } from "../componentes/error-state/error-state";
import { ScheduleView } from "../componentes/schedule-view/schedule-view";
import { rotas } from "../core/api";
import { DadosAcademicosService } from "../core/dados-academicos.service";
import { FiltroUrlService } from "../core/filtro-url.service";
import { PaginaAcademica } from "./pagina-academica";

@Component({
  imports: [DisciplineList, ErrorState, ScheduleView, PaginaAcademica],
  templateUrl: "./horarios.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Horarios {
  protected readonly filtro = inject(FiltroUrlService);
  protected readonly dados = inject(DadosAcademicosService);
  protected readonly horarios = this.dados.horarios;
  protected readonly disciplinasVisiveis = computed(() => {
    const selecionada = this.dados.disciplinaSelecionada();
    return selecionada ? [selecionada] : this.dados.disciplinas.itens();
  });

  constructor() {
    effect(() => this.horarios.carregar(rotas.horarios(this.filtro.disciplina())));
  }
}
