import { ChangeDetectionStrategy, Component, input } from "@angular/core";

@Component({
  selector: "app-summary-grid",
  templateUrl: "./summary-grid.html",
  styles: [":host { display: contents; }"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryGrid {
  readonly disciplinas = input(0);
  readonly aulas = input(0);
  readonly avisos = input(0);
}
