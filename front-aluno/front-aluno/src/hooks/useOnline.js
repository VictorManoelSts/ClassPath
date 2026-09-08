import { useEffect, useState } from "react";

/** true/false conforme o navegador enxerga a rede. */
export function useOnline() {
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const conectou = () => setOnline(true);
    const desconectou = () => setOnline(false);

    window.addEventListener("online", conectou);
    window.addEventListener("offline", desconectou);

    return () => {
      window.removeEventListener("online", conectou);
      window.removeEventListener("offline", desconectou);
    };
  }, []);

  return online;
}
