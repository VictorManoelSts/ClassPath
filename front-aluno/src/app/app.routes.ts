import { inject } from "@angular/core";
import { Router, Routes } from "@angular/router";

import { Avisos } from "./paginas/avisos";
import { Horarios } from "./paginas/horarios";
import { Materiais } from "./paginas/materiais";

export const routes: Routes = [
  {
    path: "",
    pathMatch: "full",
    redirectTo: ({ queryParams }) => inject(Router).createUrlTree(["/avisos"], { queryParams }),
  },
  { path: "avisos", component: Avisos },
  { path: "horarios", component: Horarios },
  { path: "materiais", component: Materiais },
  { path: "**", redirectTo: "/avisos" },
];
