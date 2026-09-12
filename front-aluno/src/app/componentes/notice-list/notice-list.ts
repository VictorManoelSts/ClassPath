import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core";

import { Attachments } from "../attachments/attachments";
import { EmptyState } from "../empty-state/empty-state";
import { LoadingCards } from "../skeletons/loading-cards";
import { formatarData, ordenarAvisos } from "../../utils/formato";
import type { Aviso } from "../../core/modelos";

@Component({
  selector: "app-notice-list",
  imports: [Attachments, EmptyState, LoadingCards],
  templateUrl: "./notice-list.html",
  styles: [":host { display: contents; }"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoticeList {
  readonly avisos = input<Aviso[]>([]);
  readonly carregando = input(false);

  protected readonly ordenados = computed(() => ordenarAvisos(this.avisos()));

  protected data(aviso: Aviso): string {
    return formatarData(aviso.dataPublicacao);
  }
}
