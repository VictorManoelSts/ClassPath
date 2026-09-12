import { ChangeDetectionStrategy, Component, computed, input, output } from "@angular/core";

import { ErrorState } from "../error-state/error-state";
import { EmptyState } from "../empty-state/empty-state";
import { LoadingCards } from "../skeletons/loading-cards";
import { rotas, urlDaApi, urlsApi } from "../../core/api";
import type { Disciplina, Material } from "../../core/modelos";
import { formatarTamanho } from "../../utils/anexos";
import { formatarData } from "../../utils/formato";

interface MaterialNaTela {
  id: string;
  nome: string;
  disciplina: string;
  data: string;
  tamanho: string | null;
  tipo: string;
  href: string;
}

function tipoDoMaterial(material: Material): string {
  const extensao = material.nome.includes(".") ? material.nome.split(".").pop() : null;
  if (extensao && extensao.length <= 5) return extensao.toUpperCase();

  const subtipo = material.content_type?.split("/").pop();
  return subtipo && subtipo.length <= 8 ? subtipo.toUpperCase() : "ARQUIVO";
}

@Component({
  selector: "app-material-list",
  imports: [EmptyState, ErrorState, LoadingCards],
  templateUrl: "./material-list.html",
  styles: [":host { display: contents; }"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaterialList {
  readonly materiais = input<Material[]>([]);
  readonly disciplinas = input<Disciplina[]>([]);
  readonly carregando = input(false);
  readonly erro = input("");
  readonly tentarNovamente = output<void>();

  protected readonly itens = computed<MaterialNaTela[]>(() => {
    const nomes = new Map(
      this.disciplinas().map((disciplina) => [String(disciplina.id), disciplina.nome]),
    );

    return this.materiais().map((material) => {
      const disciplinaBruta = String(material.disciplina || "");
      const disciplina =
        nomes.get(disciplinaBruta) ||
        (disciplinaBruta
          ? /^\d+$/.test(disciplinaBruta)
            ? `Disciplina ${disciplinaBruta}`
            : disciplinaBruta
          : "Sem disciplina");

      return {
        id: material.id,
        nome: material.nome,
        disciplina,
        data: formatarData(String(material.data_upload || "").slice(0, 10)),
        tamanho: formatarTamanho(material.tamanho),
        tipo: tipoDoMaterial(material),
        href: urlDaApi(rotas.baixarMaterial(material.id), urlsApi.materiais),
      };
    });
  });
}
