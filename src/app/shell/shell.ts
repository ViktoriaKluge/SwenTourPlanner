import { Component, inject } from "@angular/core";
import { HeaderComponent } from "../header/header";
import { AppStateService } from "../app-state";
import { AboutComponent } from "../about/about";
import { LoginComponent } from "../login/login";
import { HomeComponent } from "../home/home";

@Component ({
    selector: 'app-shell',
    standalone: true,
    imports: [HeaderComponent, AboutComponent, LoginComponent, HomeComponent],
    templateUrl: './shell.html',
    styleUrls: ['./../app.css', './shell.css']
})

export class ShellComponent {
    readonly state = inject(AppStateService);

}