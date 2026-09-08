export function LoadingCards({ quantidade = 3 }) {
  return (
    <div className="loading-grid" aria-label="Carregando informações" aria-busy="true">
      {Array.from({ length: quantidade }, (_, indice) => (
        <div className="loading-card" key={indice}>
          <span />
          <span />
          <span />
        </div>
      ))}
    </div>
  );
}

export function LoadingRows({ quantidade = 4 }) {
  return (
    <div className="loading-rows" aria-label="Carregando horários" aria-busy="true">
      {Array.from({ length: quantidade }, (_, indice) => (
        <span key={indice} />
      ))}
    </div>
  );
}
