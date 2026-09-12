import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import type { Disciplina } from "../../core/modelos";

@Component({
  selector: "app-filter-bar",
  templateUrl: "./filter-bar.html",
  styles: [":host { display: contents; }"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterBar {
  readonly disciplinas = input<Disciplina[]>([]);
  readonly disciplinaId = input("");
  readonly desabilitado = input(false);
  readonly alterar = output<string>();

  protected aoMudar(evento: Event): void {
    this.alterar.emit((evento.target as HTMLSelectElement).value);
  }

  /** A URL guarda texto; o id da API pode ser número. */
  protected estaSelecionada(id: number | string): boolean {
    return String(id) === this.disciplinaId();
  }
}
