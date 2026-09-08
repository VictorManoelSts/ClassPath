import ThemeToggle from "./ThemeToggle";

export default function Topbar() {
  return (
    <header className="topbar">
      <a className="brand" href="#inicio">
        <span className="brand-mark" aria-hidden="true">
          CP
        </span>
        <strong>ClassPath</strong>
      </a>

      <nav className="main-nav" aria-label="Navegação principal">
        <a href="#disciplinas">Disciplinas</a>
        <a href="#horarios">Grade</a>
        <a href="#avisos">Avisos</a>
      </nav>

      <ThemeToggle />
    </header>
  );
}
