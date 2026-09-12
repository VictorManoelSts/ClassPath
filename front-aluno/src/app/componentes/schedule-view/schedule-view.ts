import { ChangeDetectionStrategy, Component, computed, input, signal } from "@angular/core";

import { EmptyState } from "../empty-state/empty-state";
import { LoadingRows } from "../skeletons/loading-rows";
import { ScheduleList } from "./schedule-list";
import { WeekGrid } from "./week-grid";
import { ordenarHorarios } from "../../utils/formato";
import type { Horario } from "../../core/modelos";

type Visao = "grade" | "lista";

@Component({
  selector: "app-schedule-view",
  imports: [EmptyState, LoadingRows, ScheduleList, WeekGrid],
  templateUrl: "./schedule-view.html",
  styles: [":host { display: contents; }"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleView {
  readonly horarios = input<Horario[]>([]);
  readonly carregando = input(false);

  protected readonly visao = signal<Visao>("grade");
  protected readonly ordenados = computed(() => ordenarHorarios(this.horarios()));

  protected mostrar(visao: Visao): void {
    this.visao.set(visao);
  }
}
