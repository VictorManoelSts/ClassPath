import { useCallback, useEffect, useState } from "react";

const CHAVE = "classpath-tema";

function temaSalvo() {
  try {
    const valor = localStorage.getItem(CHAVE);
    return valor === "dark" || valor === "light" ? valor : null;
  } catch {
    return null;
  }
}

function temaDoSistema() {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Tema em três camadas: preferência do sistema, escolha do usuário e
 * persistência. Enquanto o usuário não escolher, a página acompanha o
 * sistema operacional em tempo real.
 */
export function useTema() {
  const [tema, setTema] = useState(() => temaSalvo() || temaDoSistema());
  const [seguindoSistema, setSeguindoSistema] = useState(() => !temaSalvo());

  useEffect(() => {
    document.documentElement.dataset.theme = tema;
  }, [tema]);

  useEffect(() => {
    if (!seguindoSistema || !window.matchMedia) return undefined;
    const consulta = window.matchMedia("(prefers-color-scheme: dark)");
    const aoMudar = (evento) => setTema(evento.matches ? "dark" : "light");
    consulta.addEventListener("change", aoMudar);
    return () => consulta.removeEventListener("change", aoMudar);
  }, [seguindoSistema]);

  const alternar = useCallback(() => {
    setTema((atual) => {
      const proximo = atual === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(CHAVE, proximo);
      } catch {
        /* modo anônimo: só não persiste */
      }
      return proximo;
    });
    setSeguindoSistema(false);
  }, []);

  return { tema, alternar };
}
