/**
 * O builder já inicializa o TestBed antes deste arquivo. Aqui ficam só
 * os remendos do jsdom e a limpeza entre os testes.
 */
import { afterEach, vi } from "vitest";

// jsdom não implementa matchMedia, e o serviço de tema depende dele.
if (!window.matchMedia) {
  window.matchMedia = (consulta: string) =>
    ({
      matches: false,
      media: consulta,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.localStorage.clear();
});
