/**
 * Camada única de acesso à API.
 *
 * Três coisas que o fetch cru não faz e que causam bug em produção:
 *   - abortar quando o servidor aceita a conexão mas nunca responde;
 *   - devolver uma lista mesmo quando a API responde outra coisa;
 *   - evitar refazer a mesma requisição quando o usuário vai e volta
 *     entre filtros.
 */

const API_URL = (import.meta.env?.VITE_API_URL || "http://localhost:8080").replace(/\/$/, "");
const TEMPO_LIMITE = 8000;
const VALIDADE_CACHE = 30_000;

const cache = new Map();

export class ErroDeApi extends Error {
  constructor(mensagem, status) {
    super(mensagem);
    this.name = "ErroDeApi";
    this.status = status;
  }
}

export function limparCache() {
  cache.clear();
}

/**
 * Junta o sinal externo (desmontagem do componente) com o de timeout.
 * `AbortSignal.any` existe em navegadores atuais; o fallback cobre o resto.
 */
function combinarSinais(sinais) {
  const validos = sinais.filter(Boolean);
  if (validos.length === 1) return validos[0];
  if (typeof AbortSignal.any === "function") return AbortSignal.any(validos);

  const controller = new AbortController();
  validos.forEach((sinal) => {
    if (sinal.aborted) controller.abort(sinal.reason);
    else sinal.addEventListener("abort", () => controller.abort(sinal.reason), { once: true });
  });
  return controller.signal;
}

async function requisicao(caminho, signal) {
  const controladorTempo = new AbortController();
  const expirou = setTimeout(() => controladorTempo.abort(new Error("timeout")), TEMPO_LIMITE);

  try {
    const resposta = await fetch(`${API_URL}${caminho}`, {
      signal: combinarSinais([signal, controladorTempo.signal]),
      headers: { Accept: "application/json" },
    });

    const texto = await resposta.text();
    let dados = null;

    if (texto) {
      try {
        dados = JSON.parse(texto);
      } catch {
        dados = texto;
      }
    }

    if (!resposta.ok) {
      const mensagem =
        (dados && typeof dados === "object" && (dados.erro || dados.message)) ||
        (typeof dados === "string" && dados) ||
        `A API respondeu com HTTP ${resposta.status}.`;
      throw new ErroDeApi(mensagem, resposta.status);
    }

    return dados;
  } catch (erro) {
    // Timeout chega como AbortError, mas o usuário não abandonou a página.
    if (erro.name === "AbortError" && controladorTempo.signal.aborted) {
      throw new ErroDeApi(`O servidor não respondeu em ${TEMPO_LIMITE / 1000} segundos.`, 0);
    }
    if (erro.name === "AbortError") throw erro;
    if (erro instanceof ErroDeApi) throw erro;
    throw new ErroDeApi("Não foi possível falar com o servidor. Verifique sua conexão.", 0);
  } finally {
    clearTimeout(expirou);
  }
}

/** Garante uma lista. Sem isso, uma resposta inesperada quebra o `.map` no JSX. */
export const comoLista = (valor) => (Array.isArray(valor) ? valor : []);

/** GET com cache curto em memória, chaveado pelo caminho completo. */
export async function buscarLista(caminho, { signal, ignorarCache = false } = {}) {
  const agora = Date.now();
  const emCache = cache.get(caminho);

  if (!ignorarCache && emCache && agora - emCache.em < VALIDADE_CACHE) {
    return emCache.dados;
  }

  const dados = comoLista(await requisicao(caminho, signal));
  cache.set(caminho, { dados, em: agora });
  return dados;
}

export const rotas = {
  disciplinas: () => "/disciplinas",
  horarios: (disciplinaId) =>
    disciplinaId ? `/horarios?disciplinaId=${encodeURIComponent(disciplinaId)}` : "/horarios",
  avisos: (disciplinaId) =>
    disciplinaId ? `/avisos?disciplinaId=${encodeURIComponent(disciplinaId)}` : "/avisos",
};
