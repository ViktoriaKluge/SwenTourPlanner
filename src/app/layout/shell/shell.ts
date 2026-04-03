import { Component, inject } from "@angular/core";
import { HeaderComponent } from "../header/header";
import { AuthService } from "../../features/auth/services/auth.service";
import { AboutComponent } from "../../features/about/about";
import { LoginComponent } from "../../features/auth/login/login";
import { HomeComponent } from "../../features/tours/home/home";

@Component ({
    selector: 'app-shell',
    standalone: true,
    imports: [HeaderComponent, AboutComponent, LoginComponent, HomeComponent],
    templateUrl: './shell.html',
    styleUrls: ['../../app.css', './shell.css']
})

export class ShellComponent {
    private readonly auth = inject(AuthService);
    readonly session = this.auth.activeSession;
}
