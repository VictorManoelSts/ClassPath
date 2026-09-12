import { Injectable, effect, inject, signal } from "@angular/core";

import { buscarLista, rotas, urlsApi } from "./api";
import { FiltroUrlService } from "./filtro-url.service";
import type { Material } from "./modelos";

/**
 * Consulta o Back Materiais separadamente do Back Acadêmico.
 *
 * O campo `disciplina` salvo no GridFS contém o ID escolhido no Front
 * Admin. Por isso o mesmo ID presente na URL é enviado como filtro.
 */
@Injectable({ providedIn: "root" })
export class MateriaisService {
  private readonly filtro = inject(FiltroUrlService);

  private readonly listaMateriais = signal<Material[]>([]);
  private readonly carregandoAgora = signal(true);
  private readonly mensagemDeErro = signal("");
  private readonly tentativa = signal(0);

  readonly materiais = this.listaMateriais.asReadonly();
  readonly carregando = this.carregandoAgora.asReadonly();
  readonly erro = this.mensagemDeErro.asReadonly();

  constructor() {
    effect((aoLimpar) => {
      const disciplinaId = this.filtro.disciplina();
      const tentativa = this.tentativa();
      const controller = new AbortController();
      let cancelado = false;

      aoLimpar(() => {
        cancelado = true;
        controller.abort();
      });

      this.carregandoAgora.set(true);
      this.mensagemDeErro.set("");

      buscarLista<Material>(rotas.materiais(disciplinaId), {
        signal: controller.signal,
        ignorarCache: tentativa > 0,
        urlBase: urlsApi.materiais,
      })
        .then((lista) => {
          if (cancelado) return;
          this.listaMateriais.set(lista);
        })
        .catch((falha: Error) => {
          if (cancelado || falha.name === "AbortError") return;
          this.listaMateriais.set([]);
          this.mensagemDeErro.set(falha.message || "Não foi possível carregar os materiais.");
        })
        .finally(() => {
          if (!cancelado) this.carregandoAgora.set(false);
        });
    });
  }

  recarregar(): void {
    this.tentativa.update((valor) => valor + 1);
  }
}
