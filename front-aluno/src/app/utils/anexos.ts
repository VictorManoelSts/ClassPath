/**
 * A API pode expor o arquivo de um aviso de várias formas. Em vez de
 * exigir um formato único, o front aceita os três mais comuns e
 * normaliza tudo para a mesma estrutura:
 *
 *   { id, nome, url, tipo, tamanho }
 *
 * Formatos aceitos num aviso:
 *   1. arquivoUrl / arquivoNome / arquivoTipo / arquivoTamanho
 *   2. arquivo: { url, nome, tipo, tamanho }
 *   3. anexos: [ { url, nome, tipo, tamanho }, ... ]
 */

import type { Anexo, Aviso } from "../core/modelos";

const CHAVES_URL = ["url", "arquivoUrl", "link", "href", "caminho"];
const CHAVES_NOME = ["nome", "arquivoNome", "nomeArquivo", "fileName", "titulo"];
const CHAVES_TIPO = ["tipo", "arquivoTipo", "mimeType", "contentType"];
const CHAVES_TAMANHO = ["tamanho", "arquivoTamanho", "tamanhoBytes", "size"];

type Bruto = Record<string, unknown>;

function primeiroValor(objeto: Bruto | null | undefined, chaves: string[]): unknown {
  for (const chave of chaves) {
    const valor = objeto?.[chave];
    if (valor !== null && valor !== undefined && valor !== "") return valor;
  }
  return null;
}

/**
 * Só deixa passar http, https e caminhos relativos.
 *
 * Sem esta checagem, uma URL `javascript:` vinda do banco viraria
 * execução de código quando o usuário clicasse no botão de download.
 */
export function urlSegura(valor: unknown): string | null {
  if (typeof valor !== "string") return null;

  const url = valor.trim();
  if (!url) return null;

  // Caminho relativo: seguro por construção.
  if (url.startsWith("/") || url.startsWith("./")) return url;

  try {
    const protocolo = new URL(url, "http://base.invalid").protocol;
    return protocolo === "http:" || protocolo === "https:" ? url : null;
  } catch {
    return null;
  }
}

/** Deriva um nome de arquivo a partir da URL quando a API não mandou um. */
function nomePelaUrl(url: string): string {
  try {
    const caminho = new URL(url, "http://base.invalid").pathname;
    const ultimo = decodeURIComponent(caminho.split("/").filter(Boolean).pop() || "");
    return ultimo || "arquivo";
  } catch {
    return "arquivo";
  }
}

function normalizarUm(bruto: unknown, indice: number): Anexo | null {
  if (!bruto) return null;

  // A API pode mandar só a string da URL.
  const objeto: Bruto = typeof bruto === "string" ? { url: bruto } : (bruto as Bruto);

  const url = urlSegura(primeiroValor(objeto, CHAVES_URL));
  if (!url) return null;

  const tamanho = Number(primeiroValor(objeto, CHAVES_TAMANHO));
  const tipo = primeiroValor(objeto, CHAVES_TIPO);
  const id = objeto["id"];

  return {
    id: (id as string | number) ?? `anexo-${indice}`,
    url,
    nome: String(primeiroValor(objeto, CHAVES_NOME) || nomePelaUrl(url)),
    tipo: typeof tipo === "string" ? tipo : null,
    tamanho: Number.isFinite(tamanho) && tamanho > 0 ? tamanho : null,
  };
}

export function normalizarAnexos(aviso: Aviso | null | undefined): Anexo[] {
  if (!aviso) return [];

  if (Array.isArray(aviso.anexos)) {
    return aviso.anexos
      .map((item, indice) => normalizarUm(item, indice))
      .filter((anexo): anexo is Anexo => Boolean(anexo));
  }

  if (aviso.arquivo) {
    const unico = normalizarUm(aviso.arquivo, 0);
    return unico ? [unico] : [];
  }

  if (aviso.arquivoUrl || aviso.url) {
    const unico = normalizarUm(aviso as unknown as Bruto, 0);
    return unico ? [unico] : [];
  }

  return [];
}

/** 1536 → "1,5 KB". Devolve null quando a API não informou o tamanho. */
export function formatarTamanho(bytes: number | null | undefined): string | null {
  if (!Number.isFinite(bytes) || !bytes || bytes <= 0) return null;

  const unidades = ["B", "KB", "MB", "GB"];
  let valor = bytes;
  let indice = 0;

  while (valor >= 1024 && indice < unidades.length - 1) {
    valor /= 1024;
    indice += 1;
  }

  const casas = indice === 0 || valor >= 100 ? 0 : 1;
  return `${valor.toFixed(casas).replace(".", ",")} ${unidades[indice]}`;
}

/** "relatorio.pdf" → "PDF". Usado como rótulo curto no botão. */
export function extensao(anexo: Anexo): string {
  const doNome = anexo.nome?.includes(".") ? anexo.nome.split(".").pop() : null;
  if (doNome && doNome.length <= 5) return doNome.toUpperCase();

  const doTipo = anexo.tipo?.split("/").pop();
  if (doTipo && doTipo.length <= 5) return doTipo.toUpperCase();

  return "ARQUIVO";
}
