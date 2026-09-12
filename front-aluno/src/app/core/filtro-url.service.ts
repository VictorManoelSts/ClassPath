import { DestroyRef, Injectable, inject, signal } from "@angular/core";

/**
 * Mantém um valor sincronizado com a query string.
 *
 * Usa `pushState`, e não `replaceState`, para que o botão voltar do
 * navegador desfaça o filtro — comportamento que o usuário espera.
 * O listener de `popstate` fecha o ciclo.
 */
@Injectable({ providedIn: "root" })
export class FiltroUrlService {
  private readonly parametro = "disciplina";
  private readonly valor = signal(this.lerDaUrl());

  /** Valor atual do filtro. Vazio significa "todas as disciplinas". */
  readonly disciplina = this.valor.asReadonly();

  constructor() {
    const aoNavegar = () => this.valor.set(this.lerDaUrl());
    window.addEventListener("popstate", aoNavegar);
    inject(DestroyRef).onDestroy(() => window.removeEventListener("popstate", aoNavegar));
  }

  /** Troca o filtro e empilha no histórico (o botão voltar desfaz). */
  alterar(novoValor: string): void {
    this.valor.set(novoValor);
    window.history.pushState({}, "", this.montarUrl(novoValor));
  }

  /** Usado quando o valor da URL aponta para algo que não existe mais. */
  substituir(novoValor: string): void {
    this.valor.set(novoValor);
    window.history.replaceState({}, "", this.montarUrl(novoValor));
  }

  private lerDaUrl(): string {
    return new URLSearchParams(window.location.search).get(this.parametro) || "";
  }

  private montarUrl(novoValor: string): URL {
    const url = new URL(window.location.href);

    if (novoValor) url.searchParams.set(this.parametro, novoValor);
    else url.searchParams.delete(this.parametro);

    return url;
  }
}
