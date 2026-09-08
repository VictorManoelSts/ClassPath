import { useCallback, useEffect, useState } from "react";

function lerDaUrl(parametro) {
  return new URLSearchParams(window.location.search).get(parametro) || "";
}

/**
 * Mantém um valor sincronizado com a query string.
 *
 * Usa `pushState`, e não `replaceState`, para que o botão voltar do
 * navegador desfaça o filtro — comportamento que o usuário espera.
 * O listener de `popstate` fecha o ciclo.
 */
export function useFiltroNaUrl(parametro) {
  const [valor, setValor] = useState(() => lerDaUrl(parametro));

  useEffect(() => {
    const aoNavegar = () => setValor(lerDaUrl(parametro));
    window.addEventListener("popstate", aoNavegar);
    return () => window.removeEventListener("popstate", aoNavegar);
  }, [parametro]);

  const alterar = useCallback(
    (novoValor) => {
      setValor(novoValor);
      const url = new URL(window.location.href);

      if (novoValor) url.searchParams.set(parametro, novoValor);
      else url.searchParams.delete(parametro);

      window.history.pushState({}, "", url);
    },
    [parametro],
  );

  // Usado quando o valor da URL aponta para algo que não existe mais.
  const substituir = useCallback(
    (novoValor) => {
      setValor(novoValor);
      const url = new URL(window.location.href);

      if (novoValor) url.searchParams.set(parametro, novoValor);
      else url.searchParams.delete(parametro);

      window.history.replaceState({}, "", url);
    },
    [parametro],
  );

  return [valor, alterar, substituir];
}
