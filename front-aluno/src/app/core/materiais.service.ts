import { Injectable } from "@angular/core";
import { urlsApi } from "./api";
import { ListaApi } from "./lista-api";
import type { Material } from "./modelos";

@Injectable({ providedIn: "root" })
export class MateriaisService {
  readonly materiais = new ListaApi<Material>(urlsApi.materiais);
}
