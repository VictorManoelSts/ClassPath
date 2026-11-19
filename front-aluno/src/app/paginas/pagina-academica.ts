import { ChangeDetectionStrategy, Component, inject, input } from "@angular/core";

import { environment } from "../../environments/environment";
import { ErrorState } from "../componentes/error-state/error-state";
import { FilterBar } from "../componentes/filter-bar/filter-bar";
import { DadosAcademicosService } from "../core/dados-academicos.service";
import { FiltroUrlService } from "../core/filtro-url.service";
import { dataDeHoje } from "../utils/formato";

@Component({
  selector: "app-pagina-academica",
  imports: [ErrorState, FilterBar],
  templateUrl: "./pagina-academica.html",
  styles: [":host { display: block; }"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaAcademica {
  readonly titulo = input.required<string>();
  readonly descricao = input("");

  protected readonly disciplinas = inject(DadosAcademicosService).disciplinas;
  protected readonly filtro = inject(FiltroUrlService);
  protected readonly periodo = environment.periodo;
  protected readonly hoje = dataDeHoje();
}
