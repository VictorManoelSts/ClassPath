import { DestroyRef, Injectable, inject, signal } from "@angular/core";

const CHAVE = "classpath-tema";

export type Tema = "light" | "dark";

function temaSalvo(): Tema | null {
  try {
    const valor = localStorage.getItem(CHAVE);
    return valor === "dark" || valor === "light" ? valor : null;
  } catch {
    return null;
  }
}

function temaDoSistema(): Tema {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Tema em três camadas: preferência do sistema, escolha do usuário e
 * persistência. Enquanto o usuário não escolher, a página acompanha o
 * sistema operacional em tempo real.
 */
@Injectable({ providedIn: "root" })
export class TemaService {
  private readonly estado = signal<Tema>(temaSalvo() || temaDoSistema());
  private seguindoSistema = !temaSalvo();

  readonly tema = this.estado.asReadonly();

  constructor() {
    this.aplicarNoDocumento(this.estado());

    if (!window.matchMedia) return;

    const consulta = window.matchMedia("(prefers-color-scheme: dark)");
    const aoMudar = (evento: MediaQueryListEvent) => {
      if (!this.seguindoSistema) return;
      this.definir(evento.matches ? "dark" : "light");
    };

    consulta.addEventListener("change", aoMudar);
    inject(DestroyRef).onDestroy(() => consulta.removeEventListener("change", aoMudar));
  }

  alternar(): void {
    const proximo: Tema = this.estado() === "dark" ? "light" : "dark";

    try {
      localStorage.setItem(CHAVE, proximo);
    } catch {
      /* modo anônimo: só não persiste */
    }

    this.seguindoSistema = false;
    this.definir(proximo);
  }

  private definir(tema: Tema): void {
    this.estado.set(tema);
    this.aplicarNoDocumento(tema);
  }

  private aplicarNoDocumento(tema: Tema): void {
    document.documentElement.dataset["theme"] = tema;
  }
}
