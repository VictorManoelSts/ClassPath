/**
 * Configuração de produção.
 *
 * Gerado/ajustado por `npm run config` a partir das variáveis de
 * ambiente API_URL, MATERIAIS_API_URL e PERIODO — é assim que o
 * Dockerfile injeta os endereços sem precisar editar o código.
 */
export const environment = {
  producao: true,
  apiUrl: "http://localhost:8080/api",
  materiaisApiUrl: "http://localhost:8000/api",
  periodo: "2026.2",
};
