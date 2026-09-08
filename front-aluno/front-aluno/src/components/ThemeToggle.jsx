import { Moon, Sun } from "lucide-react";
import { useTema } from "../hooks/useTema";

export default function ThemeToggle() {
  const { tema, alternar } = useTema();
  const escuro = tema === "dark";

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={alternar}
      aria-pressed={escuro}
      aria-label={escuro ? "Mudar para o tema claro" : "Mudar para o tema escuro"}
      title={escuro ? "Tema claro" : "Tema escuro"}
    >
      {escuro ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
    </button>
  );
}
