import { DestroyRef, Injectable, inject, signal } from "@angular/core";

/** true/false conforme o navegador enxerga a rede. */
@Injectable({ providedIn: "root" })
export class OnlineService {
  private readonly estado = signal(navigator.onLine);

  readonly online = this.estado.asReadonly();

  constructor() {
    const conectou = () => this.estado.set(true);
    const desconectou = () => this.estado.set(false);

    window.addEventListener("online", conectou);
    window.addEventListener("offline", desconectou);

    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener("online", conectou);
      window.removeEventListener("offline", desconectou);
    });
  }
}
