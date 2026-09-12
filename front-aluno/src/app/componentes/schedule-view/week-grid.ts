import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core";

import { ScheduleList } from "./schedule-list";
import { abreviarDia, formatarHorario } from "../../utils/formato";
import { montarGrade } from "../../utils/grade";
import type { Horario } from "../../core/modelos";

@Component({
  selector: "app-week-grid",
  imports: [ScheduleList],
  templateUrl: "./week-grid.html",
  styles: [":host { display: contents; }"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeekGrid {
  readonly horarios = input<Horario[]>([]);

  protected readonly grade = computed(() => montarGrade(this.horarios()));

  /** Valores de `--colunas` e `--altura` precisam ser texto para o setProperty. */
  protected readonly colunas = computed(() => String(this.grade().dias.length));
  protected readonly altura = computed(() => `${this.grade().altura}px`);

  /** A primeira hora coincide com o topo da coluna, então não vira linha. */
  protected readonly linhas = computed(() => this.grade().horas.slice(1));

  protected readonly semHorario = computed(() => this.grade().semHorario);

  protected abreviar(dia: string): string {
    return abreviarDia(dia);
  }

  protected intervalo(inicio: string | undefined, fim: string | undefined): string {
    return `${formatarHorario(inicio)}–${formatarHorario(fim)}`;
  }
}
