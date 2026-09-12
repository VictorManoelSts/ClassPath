import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core";

import { agruparPorDia, formatarHorario } from "../../utils/formato";
import type { Horario } from "../../core/modelos";

@Component({
  selector: "app-schedule-list",
  templateUrl: "./schedule-list.html",
  styles: [":host { display: contents; }"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleList {
  readonly horarios = input<Horario[]>([]);

  protected readonly porDia = computed(() =>
    agruparPorDia(this.horarios()).map(([dia, aulas]) => ({ dia, aulas })),
  );

  protected hora(valor: string | undefined): string {
    return formatarHorario(valor);
  }
}
