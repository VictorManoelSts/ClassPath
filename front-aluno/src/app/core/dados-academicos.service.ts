import { Injectable, computed, effect, inject } from "@angular/core";
import { rotas } from "./api";
import { FiltroUrlService } from "./filtro-url.service";
import { ListaApi } from "./lista-api";
import type { Aviso, Disciplina, Horario } from "./modelos";

@Injectable({ providedIn: "root" })
export class DadosAcademicosService {
  private readonly filtro = inject(FiltroUrlService);

  readonly disciplinas = new ListaApi<Disciplina>();
  readonly horarios = new ListaApi<Horario>();
  readonly avisos = new ListaApi<Aviso>();

  readonly disciplinaSelecionada = computed(() => {
    const id = this.filtro.disciplina();
    return this.disciplinas.itens().find((disciplina) => String(disciplina.id) === id);
  });

  constructor() {
    this.disciplinas.carregar(rotas.disciplinas());

    effect(() => {
      if (
        this.filtro.disciplina() &&
        this.disciplinas.itens().length &&
        !this.disciplinaSelecionada()
      ) {
        this.filtro.substituir("");
      }
    });
  }
}
