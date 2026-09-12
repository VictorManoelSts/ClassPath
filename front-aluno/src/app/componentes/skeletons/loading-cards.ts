import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core";

@Component({
  selector: "app-loading-cards",
  template: `
    <div class="loading-grid" aria-label="Carregando informações" aria-busy="true">
      @for (indice of itens(); track indice) {
        <div class="loading-card">
          <span></span>
          <span></span>
          <span></span>
        </div>
      }
    </div>
  `,
  styles: [":host { display: contents; }"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingCards {
  readonly quantidade = input(3);
  protected readonly itens = computed(() =>
    Array.from({ length: this.quantidade() }, (_, indice) => indice),
  );
}
