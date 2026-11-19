import { ChangeDetectionStrategy, Component, effect, inject } from "@angular/core";
import { ErrorState } from "../componentes/error-state/error-state";
import { NoticeList } from "../componentes/notice-list/notice-list";
import { rotas } from "../core/api";
import { DadosAcademicosService } from "../core/dados-academicos.service";
import { FiltroUrlService } from "../core/filtro-url.service";
import { PaginaAcademica } from "./pagina-academica";

@Component({
  imports: [ErrorState, NoticeList, PaginaAcademica],
  templateUrl: "./avisos.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Avisos {
  protected readonly filtro = inject(FiltroUrlService);
  protected readonly avisos = inject(DadosAcademicosService).avisos;

  constructor() {
    effect(() => this.avisos.carregar(rotas.avisos(this.filtro.disciplina())));
  }
}
