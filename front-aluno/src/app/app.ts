import { ChangeDetectionStrategy, Component, effect, inject } from "@angular/core";
import { RouterOutlet } from "@angular/router";

import { environment } from "../environments/environment";
import { Topbar } from "./componentes/topbar/topbar";
import { DadosAcademicosService } from "./core/dados-academicos.service";
import { OnlineService } from "./core/online.service";
import { TituloService } from "./core/titulo.service";

@Component({
  selector: "app-root",
  imports: [RouterOutlet, Topbar],
  templateUrl: "./app.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly periodo = environment.periodo;
  protected readonly online = inject(OnlineService).online;

  constructor() {
    const dados = inject(DadosAcademicosService);
    const titulo = inject(TituloService);
    effect(() => titulo.definir(dados.disciplinaSelecionada()?.nome));
  }

  protected focarConteudo(evento: Event, conteudo: HTMLElement): void {
    evento.preventDefault();
    conteudo.focus();
  }
}
