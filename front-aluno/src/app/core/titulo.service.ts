import { Injectable, inject } from "@angular/core";
import { Title } from "@angular/platform-browser";

/** Reflete o filtro ativo no título da aba: "Cálculo I | ClassPath". */
@Injectable({ providedIn: "root" })
export class TituloService {
  private readonly title = inject(Title);

  definir(sufixo?: string | null): void {
    this.title.setTitle(sufixo ? `${sufixo} | ClassPath` : "ClassPath | Portal do aluno");
  }
}
