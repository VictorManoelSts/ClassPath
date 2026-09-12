/**
 * Escreve src/environments a partir das variáveis de ambiente.
 *
 * O Vite lia import.meta.env na hora do build; o Angular não tem isso,
 * então os endereços das APIs entram por aqui. É o que o Dockerfile
 * chama antes do `ng build`, para não precisar editar código para
 * trocar de servidor.
 *
 * Aceita tanto API_URL/PERIODO quanto os nomes antigos com prefixo
 * VITE_, para os docker-compose que já existem continuarem valendo.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));
const pasta = resolve(aqui, "..", "src", "environments");

const apiUrl = process.env.API_URL || process.env.VITE_API_URL || "http://localhost:8080/api";
const materiaisApiUrl =
  process.env.MATERIAIS_API_URL ||
  process.env.VITE_MATERIAIS_API_URL ||
  "http://localhost:8000/api";
const periodo = process.env.PERIODO || process.env.VITE_PERIODO || "2026.2";

function arquivo(producao) {
  return `/** Gerado por scripts/set-env.mjs — não edite à mão. */
export const environment = {
  producao: ${producao},
  apiUrl: ${JSON.stringify(apiUrl)},
  materiaisApiUrl: ${JSON.stringify(materiaisApiUrl)},
  periodo: ${JSON.stringify(periodo)},
};
`;
}

mkdirSync(pasta, { recursive: true });
writeFileSync(resolve(pasta, "environment.ts"), arquivo(true));
writeFileSync(resolve(pasta, "environment.development.ts"), arquivo(false));

console.log(
  `environments atualizados: apiUrl=${apiUrl} materiaisApiUrl=${materiaisApiUrl} periodo=${periodo}`,
);
