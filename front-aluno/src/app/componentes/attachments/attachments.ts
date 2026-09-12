import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core";

import { urlAbsoluta } from "../../core/api";
import { extensao, formatarTamanho, normalizarAnexos } from "../../utils/anexos";
import type { Aviso } from "../../core/modelos";

interface AnexoNaTela {
  id: string | number;
  href: string | null;
  nome: string;
  meta: string;
  rotulo: string;
}

/**
 * Botão de download dos arquivos de um aviso.
 *
 * É um <a download>, não um <button> com (click): assim o navegador
 * cuida do download nativamente, o clique do meio abre em nova aba e o
 * menu de contexto oferece "Salvar link como".
 *
 * Nada é renderizado quando o aviso não tem arquivo, então dá para
 * colocar o componente em todo aviso sem verificação por fora.
 */
@Component({
  selector: "app-attachments",
  templateUrl: "./attachments.html",
  styles: [":host { display: contents; }"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Attachments {
  readonly aviso = input.required<Aviso>();

  protected readonly anexos = computed<AnexoNaTela[]>(() =>
    normalizarAnexos(this.aviso()).map((anexo) => {
      const tamanho = formatarTamanho(anexo.tamanho);

      return {
        id: anexo.id,
        href: urlAbsoluta(anexo.url),
        nome: anexo.nome,
        meta: `${extensao(anexo)}${tamanho ? ` · ${tamanho}` : ""}`,
        rotulo: `Baixar ${anexo.nome}${tamanho ? `, ${tamanho}` : ""}`,
      };
    }),
  );
}
