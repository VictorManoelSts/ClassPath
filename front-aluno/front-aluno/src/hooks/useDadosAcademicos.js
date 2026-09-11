import { useCallback, useEffect, useState } from "react";
import { buscarLista, limparCache, rotas } from "../api";

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
export function useDadosAcademicos(disciplinaId) {
  const [disciplinas, setDisciplinas] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [avisos, setAvisos] = useState([]);
  const [primeiraCarga, setPrimeiraCarga] = useState(true);
  const [revalidando, setRevalidando] = useState(false);
  const [erro, setErro] = useState("");
  const [tentativa, setTentativa] = useState(0);

  const recarregar = useCallback(() => {
    limparCache();
    setTentativa((valor) => valor + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    buscarLista(rotas.disciplinas(), {
      signal: controller.signal,
      ignorarCache: tentativa > 0,
    })
      .then(setDisciplinas)
      .catch((falha) => {
        if (falha.name !== "AbortError") setErro(falha.message);
      });

    return () => controller.abort();
  }, [tentativa]);

  useEffect(() => {
    const controller = new AbortController();
    let cancelado = false;

    setRevalidando(true);
    setErro("");

    Promise.all([
      buscarLista(rotas.horarios(disciplinaId), {
        signal: controller.signal,
        ignorarCache: tentativa > 0,
      }),
      buscarLista(rotas.avisos(disciplinaId), {
        signal: controller.signal,
        ignorarCache: tentativa > 0,
      }),
    ])
      .then(([listaHorarios, listaAvisos]) => {
        if (cancelado) return;
        setHorarios(listaHorarios);
        setAvisos(listaAvisos);
      })
      .catch((falha) => {
        if (cancelado || falha.name === "AbortError") return;
        setErro(falha.message || "Não foi possível carregar o portal.");
      })
      .finally(() => {
        if (cancelado) return;
        setRevalidando(false);
        setPrimeiraCarga(false);
      });

    return () => {
      cancelado = true;
      controller.abort();
    };
  }, [disciplinaId, tentativa]);

  return { disciplinas, horarios, avisos, primeiraCarga, revalidando, erro, recarregar };
}
