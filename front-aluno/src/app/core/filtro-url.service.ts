import { Injectable, inject } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { NavigationEnd, Router } from "@angular/router";
import { filter, map } from "rxjs";

@Injectable({ providedIn: "root" })
export class FiltroUrlService {
  private readonly router = inject(Router);

  /** Cada entrada do histórico guarda o filtro da sua própria página. */
  readonly disciplina = toSignal(
    this.router.events.pipe(
      filter((evento) => evento instanceof NavigationEnd),
      map((evento) => this.ler(evento.urlAfterRedirects)),
    ),
    { initialValue: this.ler(this.router.url) },
  );

  alterar(disciplina: string): void {
    this.navegar(disciplina, false);
  }

  substituir(disciplina: string): void {
    this.navegar(disciplina, true);
  }

  private ler(url: string): string {
    return this.router.parseUrl(url).queryParamMap.get("disciplina") ?? "";
  }

  private navegar(disciplina: string, replaceUrl: boolean): void {
    void this.router.navigate([], {
      queryParams: { disciplina: disciplina || null },
      queryParamsHandling: "merge",
      preserveFragment: true,
      replaceUrl,
    });
  }
}
