import { ChangeDetectionStrategy, Component, computed, inject } from "@angular/core";
import { TemaService } from "../../core/tema.service";

@Component({
  selector: "app-theme-toggle",
  templateUrl: "./theme-toggle.html",
  styles: [":host { display: contents; }"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeToggle {
  private readonly temaService = inject(TemaService);

  protected readonly escuro = computed(() => this.temaService.tema() === "dark");

  protected alternar(): void {
    this.temaService.alternar();
  }
}
