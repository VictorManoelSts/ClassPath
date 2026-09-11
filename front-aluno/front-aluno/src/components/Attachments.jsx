import { Download, FileText } from "lucide-react";
import { urlAbsoluta } from "../api";
import { extensao, formatarTamanho, normalizarAnexos } from "../utils/anexos";

/**
 * Botão de download dos arquivos de um aviso.
 *
 * É um <a download>, não um <button> com onClick: assim o navegador
 * cuida do download nativamente, o clique do meio abre em nova aba e o
 * menu de contexto oferece "Salvar link como".
 *
 * Nada é renderizado quando o aviso não tem arquivo, então dá para
 * colocar o componente em todo aviso sem verificação por fora.
 */
export default function Attachments({ aviso }) {
  const anexos = normalizarAnexos(aviso);
  if (!anexos.length) return null;

  return (
    <ul className="attachment-list">
      {anexos.map((anexo) => {
        const tamanho = formatarTamanho(anexo.tamanho);

        return (
          <li key={anexo.id}>
            <a
              className="attachment"
              href={urlAbsoluta(anexo.url)}
              download={anexo.nome}
              rel="noopener noreferrer"
              aria-label={`Baixar ${anexo.nome}${tamanho ? `, ${tamanho}` : ""}`}
            >
              <span className="attachment-icon" aria-hidden="true">
                <FileText size={15} />
              </span>

              <span className="attachment-info">
                <span className="attachment-name">{anexo.nome}</span>
                <span className="attachment-meta">
                  {extensao(anexo)}
                  {tamanho && ` · ${tamanho}`}
                </span>
              </span>

              <span className="attachment-action" aria-hidden="true">
                <Download size={15} />
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
