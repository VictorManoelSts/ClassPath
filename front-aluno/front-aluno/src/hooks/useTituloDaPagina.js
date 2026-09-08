import { useEffect } from "react";

/** Reflete o filtro ativo no título da aba: "Cálculo I | ClassPath". */
export function useTituloDaPagina(sufixo) {
  useEffect(() => {
    document.title = sufixo ? `${sufixo} | ClassPath` : "ClassPath | Portal do aluno";
  }, [sufixo]);
}
