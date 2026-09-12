import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { EmptyState } from "../empty-state/empty-state";
import { LoadingCards } from "../skeletons/loading-cards";
import type { Disciplina } from "../../core/modelos";

@Component({
  selector: "app-discipline-list",
  imports: [EmptyState, LoadingCards],
  templateUrl: "./discipline-list.html",
  styles: [":host { display: contents; }"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DisciplineList {
  readonly disciplinas = input<Disciplina[]>([]);
  readonly carregando = input(false);
  readonly temFiltro = input(false);
  readonly selecionar = output<string>();

  /** A URL guarda texto; o id da API pode ser número. */
  protected aoSelecionar(id: number | string): void {
    this.selecionar.emit(String(id));
  }
}
