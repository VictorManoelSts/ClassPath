import { ChangeDetectionStrategy, Component, input } from "@angular/core";

/**
 * O ícone entra por projeção de conteúdo (`<svg>` entre as tags) para
 * que ele continue sendo filho direto de `.empty-state` — é assim que a
 * regra `.empty-state > svg` do CSS o encontra.
 */
@Component({
  selector: "app-empty-state",
  templateUrl: "./empty-state.html",
  styles: [":host { display: contents; }"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyState {
  readonly titulo = input.required<string>();
  readonly texto = input<string>("");
}
