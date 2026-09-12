import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";

@Component({
  selector: "app-error-state",
  templateUrl: "./error-state.html",
  styles: [":host { display: contents; }"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorState {
  readonly mensagem = input.required<string>();
  readonly tentarNovamente = output<void>();
}
