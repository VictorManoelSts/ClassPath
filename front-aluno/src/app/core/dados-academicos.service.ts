import { Injectable, computed, effect, inject, signal } from "@angular/core";

import { buscarLista, limparCache, rotas } from "./api";
import { FiltroUrlService } from "./filtro-url.service";
import type { Aviso, Disciplina, Horario } from "./modelos";

/**
 * Reúne disciplinas, horários e avisos.
 *
 * Duas listas com ciclos de vida diferentes:
 *   - disciplinas mudam raramente e são buscadas uma vez;
 *   - horários e avisos acompanham o filtro.
 *
 * `primeiraCarga` distingue o esqueleto inicial da revalidação. Sem
 * essa distinção, trocar o filtro derruba a página inteira em skeleton.
 */
@Injectable({ providedIn: "root" })
export class DadosAcademicosService {
  private readonly filtro = inject(FiltroUrlService);

  private readonly listaDisciplinas = signal<Disciplina[]>([]);
  private readonly listaHorarios = signal<Horario[]>([]);
  private readonly listaAvisos = signal<Aviso[]>([]);
  private readonly carregandoPrimeiraVez = signal(true);
  private readonly revalidandoAgora = signal(false);
  private readonly mensagemDeErro = signal("");
  private readonly tentativa = signal(0);

  readonly disciplinas = this.listaDisciplinas.asReadonly();
  readonly horarios = this.listaHorarios.asReadonly();
  readonly avisos = this.listaAvisos.asReadonly();
  readonly primeiraCarga = this.carregandoPrimeiraVez.asReadonly();
  readonly revalidando = this.revalidandoAgora.asReadonly();
  readonly erro = this.mensagemDeErro.asReadonly();

  /** Disciplina apontada pelo filtro, quando ela existe na lista. */
  readonly disciplinaSelecionada = computed(() => {
    const id = this.filtro.disciplina();
    return this.listaDisciplinas().find((disciplina) => String(disciplina.id) === id);
  });

  constructor() {
    // Disciplinas: uma busca só, refeita apenas ao "tentar de novo".
    effect((aoLimpar) => {
      const tentativa = this.tentativa();
      const controller = new AbortController();
      aoLimpar(() => controller.abort());

      buscarLista<Disciplina>(rotas.disciplinas(), {
        signal: controller.signal,
        ignorarCache: tentativa > 0,
      })
        .then((lista) => this.listaDisciplinas.set(lista))
        .catch((falha: Error) => {
          if (falha.name !== "AbortError") this.mensagemDeErro.set(falha.message);
        });
    });

    // Horários e avisos: acompanham o filtro.
    effect((aoLimpar) => {
      const disciplinaId = this.filtro.disciplina();
      const tentativa = this.tentativa();

      const controller = new AbortController();
      let cancelado = false;

      aoLimpar(() => {
        cancelado = true;
        controller.abort();
      });

      this.revalidandoAgora.set(true);
      this.mensagemDeErro.set("");

      Promise.all([
        buscarLista<Horario>(rotas.horarios(disciplinaId), {
          signal: controller.signal,
          ignorarCache: tentativa > 0,
        }),
        buscarLista<Aviso>(rotas.avisos(disciplinaId), {
          signal: controller.signal,
          ignorarCache: tentativa > 0,
        }),
      ])
        .then(([listaHorarios, listaAvisos]) => {
          if (cancelado) return;
          this.listaHorarios.set(listaHorarios);
          this.listaAvisos.set(listaAvisos);
        })
        .catch((falha: Error) => {
          if (cancelado || falha.name === "AbortError") return;
          this.mensagemDeErro.set(falha.message || "Não foi possível carregar o portal.");
        })
        .finally(() => {
          if (cancelado) return;
          this.revalidandoAgora.set(false);
          this.carregandoPrimeiraVez.set(false);
        });
    });

    // Link antigo apontando para uma disciplina que não existe mais.
    effect(() => {
      const id = this.filtro.disciplina();
      const disciplinas = this.listaDisciplinas();

      if (!id || !disciplinas.length) return;
      const existe = disciplinas.some((disciplina) => String(disciplina.id) === id);
      if (!existe) this.filtro.substituir("");
    });
  }

  recarregar(): void {
    limparCache();
    this.tentativa.update((valor) => valor + 1);
  }
}
