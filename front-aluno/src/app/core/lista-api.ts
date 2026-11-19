import { DestroyRef, inject, signal } from "@angular/core";
import { buscarLista } from "./api";

/** Reutiliza o cache HTTP e mantém consultas em andamento entre visitas à página. */
export class ListaApi<T> {
  private readonly dados = signal<T[]>([]);
  private readonly pendente = signal(true);
  private readonly falha = signal("");
  private caminho?: string;
  private requisicao?: AbortController;

  readonly itens = this.dados.asReadonly();
  readonly carregando = this.pendente.asReadonly();
  readonly erro = this.falha.asReadonly();

  constructor(private readonly urlBase?: string) {
    inject(DestroyRef).onDestroy(() => this.requisicao?.abort());
  }

  carregar(caminho: string, ignorarCache = false): void {
    if (this.requisicao && caminho === this.caminho && !ignorarCache) return;
    this.requisicao?.abort();
    if (caminho !== this.caminho) this.dados.set([]);
    this.caminho = caminho;
    this.pendente.set(true);
    this.falha.set("");

    const controller = new AbortController();
    this.requisicao = controller;
    buscarLista<T>(caminho, { signal: controller.signal, ignorarCache, urlBase: this.urlBase })
      .then((lista) => {
        if (!controller.signal.aborted) this.dados.set(lista);
      })
      .catch((erro: Error) => {
        if (!controller.signal.aborted) this.falha.set(erro.message);
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        this.requisicao = undefined;
        this.pendente.set(false);
      });
  }

  recarregar(): void {
    if (this.caminho !== undefined) this.carregar(this.caminho, true);
  }
}
