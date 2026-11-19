import { ChangeDetectionStrategy, Component, effect, inject } from "@angular/core";
import { MaterialList } from "../componentes/material-list/material-list";
import { rotas } from "../core/api";
import { DadosAcademicosService } from "../core/dados-academicos.service";
import { FiltroUrlService } from "../core/filtro-url.service";
import { MateriaisService } from "../core/materiais.service";
import { PaginaAcademica } from "./pagina-academica";

@Component({
  imports: [MaterialList, PaginaAcademica],
  templateUrl: "./materiais.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Materiais {
  protected readonly filtro = inject(FiltroUrlService);
  protected readonly materiais = inject(MateriaisService).materiais;
  protected readonly disciplinas = inject(DadosAcademicosService).disciplinas.itens;

  constructor() {
    effect(() => this.materiais.carregar(rotas.materiais(this.filtro.disciplina())));
  }
}
