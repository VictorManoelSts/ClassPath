/**
 * Configuração de produção.
 *
 * Gerado/ajustado por `npm run config` a partir das variáveis de
 * ambiente API_URL e PERIODO — é assim que o Dockerfile injeta o
 * endereço do back-end sem precisar editar o código.
 */
export const environment = {
  producao: true,
  apiUrl: "http://localhost:8080",
  periodo: "2026.2",
};
