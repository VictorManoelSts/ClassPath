/**
 * Camada única de acesso à API.
 *
 * Três coisas que o fetch cru não faz e que causam bug em produção:
 *   - abortar quando o servidor aceita a conexão mas nunca responde;
 *   - devolver uma lista mesmo quando a API responde outra coisa;
 *   - evitar refazer a mesma requisição quando o usuário vai e volta
 *     entre filtros.
 *
 * É um módulo simples, e não um serviço do Angular, de propósito: sem
 * dependência de injeção ele é testável direto, do mesmo jeito que era
 * na versão em React.
 */

import { environment } from "../../environments/environment";

const API_URL = (environment.apiUrl || "http://localhost:8080").replace(/\/$/, "");
const TEMPO_LIMITE = 8000;
const VALIDADE_CACHE = 30_000;

interface ItemDeCache {
  dados: unknown[];
  em: number;
}

const cache = new Map<string, ItemDeCache>();

export class ErroDeApi extends Error {
  readonly status: number;

  constructor(mensagem: string, status: number) {
    super(mensagem);
    this.name = "ErroDeApi";
    this.status = status;
  }
}

export function limparCache(): void {
  cache.clear();
}

/**
 * Junta o sinal externo (cancelamento do componente) com o de timeout.
 * `AbortSignal.any` existe em navegadores atuais; o fallback cobre o resto.
 */
function combinarSinais(sinais: (AbortSignal | undefined)[]): AbortSignal {
  const validos = sinais.filter((sinal): sinal is AbortSignal => Boolean(sinal));
  if (validos.length === 1) return validos[0];

  const any = (AbortSignal as { any?: (lista: AbortSignal[]) => AbortSignal }).any;
  if (typeof any === "function") return any.call(AbortSignal, validos);

  const controller = new AbortController();
  validos.forEach((sinal) => {
    if (sinal.aborted) controller.abort(sinal.reason);
    else sinal.addEventListener("abort", () => controller.abort(sinal.reason), { once: true });
  });
  return controller.signal;
}

/** A API manda a causa em `erro` ou em `message`; às vezes só texto puro. */
function mensagemDeErro(dados: unknown, status: number): string {
  if (dados && typeof dados === "object") {
    const corpo = dados as { erro?: string; message?: string };
    if (corpo.erro) return corpo.erro;
    if (corpo.message) return corpo.message;
  }
  if (typeof dados === "string" && dados) return dados;
  return `A API respondeu com HTTP ${status}.`;
}

async function requisicao(caminho: string, signal?: AbortSignal): Promise<unknown> {
  const controladorTempo = new AbortController();
  const expirou = setTimeout(() => controladorTempo.abort(new Error("timeout")), TEMPO_LIMITE);

  try {
    const resposta = await fetch(`${API_URL}${caminho}`, {
      signal: combinarSinais([signal, controladorTempo.signal]),
      headers: { Accept: "application/json" },
    });

    const texto = await resposta.text();
    let dados: unknown = null;

    if (texto) {
      try {
        dados = JSON.parse(texto);
      } catch {
        dados = texto;
      }
    }

    if (!resposta.ok) {
      throw new ErroDeApi(mensagemDeErro(dados, resposta.status), resposta.status);
    }

    return dados;
  } catch (erro) {
    const falha = erro as Error;

    // Timeout chega como AbortError, mas o usuário não abandonou a página.
    if (falha.name === "AbortError" && controladorTempo.signal.aborted) {
      throw new ErroDeApi(`O servidor não respondeu em ${TEMPO_LIMITE / 1000} segundos.`, 0);
    }
    if (falha.name === "AbortError") throw falha;
    if (falha instanceof ErroDeApi) throw falha;
    throw new ErroDeApi("Não foi possível falar com o servidor. Verifique sua conexão.", 0);
  } finally {
    clearTimeout(expirou);
  }
}

/** Garante uma lista. Sem isso, uma resposta inesperada quebra o `@for` no template. */
export const comoLista = (valor: unknown): unknown[] => (Array.isArray(valor) ? valor : []);

export interface OpcoesDeBusca {
  signal?: AbortSignal;
  ignorarCache?: boolean;
}

/** GET com cache curto em memória, chaveado pelo caminho completo. */
export async function buscarLista<T>(
  caminho: string,
  { signal, ignorarCache = false }: OpcoesDeBusca = {},
): Promise<T[]> {
  const agora = Date.now();
  const emCache = cache.get(caminho);

  if (!ignorarCache && emCache && agora - emCache.em < VALIDADE_CACHE) {
    return emCache.dados as T[];
  }

  const dados = comoLista(await requisicao(caminho, signal));
  cache.set(caminho, { dados, em: agora });
  return dados as T[];
}

/**
 * Resolve caminhos relativos vindos da API contra o endereço base.
 * Se a API devolve "/arquivos/prova.pdf", o link precisa apontar para
 * o servidor dela, não para o domínio onde o front está hospedado.
 */
export function urlAbsoluta(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

export const rotas = {
  disciplinas: (): string => "/disciplinas",
  horarios: (disciplinaId?: string | number): string =>
    disciplinaId ? `/horarios?disciplinaId=${encodeURIComponent(disciplinaId)}` : "/horarios",
  avisos: (disciplinaId?: string | number): string =>
    disciplinaId ? `/avisos?disciplinaId=${encodeURIComponent(disciplinaId)}` : "/avisos",
};
