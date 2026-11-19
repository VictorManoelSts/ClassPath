import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { ThemeToggle } from "../theme-toggle/theme-toggle";

@Component({
  selector: "app-topbar",
  imports: [RouterLink, RouterLinkActive, ThemeToggle],
  templateUrl: "./topbar.html",
  styles: [":host { display: contents; }"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Topbar {}
