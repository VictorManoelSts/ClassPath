import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ThemeToggle } from "../theme-toggle/theme-toggle";

@Component({
  selector: "app-topbar",
  imports: [ThemeToggle],
  templateUrl: "./topbar.html",
  styles: [":host { display: contents; }"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Topbar {}
