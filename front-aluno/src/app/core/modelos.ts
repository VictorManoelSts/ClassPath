/**
 * Formato dos dados que a API devolve.
 *
 * Os campos opcionais existem porque a API nem sempre preenche tudo —
 * um aviso pode não ter arquivo, uma aula pode não ter sala.
 */

export interface Disciplina {
  id: number | string;
  nome: string;
  professor?: string;
}

export interface Horario {
  id: number | string;
  disciplinaId?: number | string;
  disciplinaNome?: string;
  diaSemana?: string;
  horarioInicio?: string;
  horarioFim?: string;
  sala?: string;
}

export interface Aviso {
  id: number | string;
  disciplinaId?: number | string;
  disciplinaNome?: string;
  titulo?: string;
  descricao?: string;
  dataPublicacao?: string;

  // Três formatos aceitos para o arquivo do aviso — ver utils/anexos.ts.
  anexos?: unknown[];
  arquivo?: unknown;
  arquivoUrl?: string;
  arquivoNome?: string;
  arquivoTipo?: string;
  arquivoTamanho?: number;
  url?: string;
}

export interface Anexo {
  id: string | number;
  url: string;
  nome: string;
  tipo: string | null;
  tamanho: number | null;
}

/** Aula já posicionada na grade da semana. */
export interface AulaPosicionada extends Horario {
  inicio: number;
  fim: number;
  topo: number;
  altura: number;
}

export interface ColunaDoDia {
  dia: string;
  aulas: AulaPosicionada[];
}

export interface LinhaDeHora {
  minuto: number;
  rotulo: string;
  topo: number;
}

export interface Grade {
  dias: ColunaDoDia[];
  horas: LinhaDeHora[];
  altura: number;
  semHorario: Horario[];
}
