import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core";

@Component({
  selector: "app-loading-rows",
  template: `
    <div class="loading-rows" aria-label="Carregando horários" aria-busy="true">
      @for (indice of itens(); track indice) {
        <span></span>
      }
    </div>
  `,
  styles: [":host { display: contents; }"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingRows {
  readonly quantidade = input(4);
  protected readonly itens = computed(() =>
    Array.from({ length: this.quantidade() }, (_, indice) => indice),
  );
}
