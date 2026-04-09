import { Component, inject } from "@angular/core";
import { AuthService } from "../../features/auth/services/auth.service";
import { Section } from "../../core/models/session.model";

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [],
    templateUrl: './header.html',
    styleUrls: ['./header.css']
})

export class HeaderComponent {
    private readonly auth = inject(AuthService);
    readonly session = this.auth.activeSession;

    constructor() {
        console.log('✅ HeaderComponent geladen!');
    }

    logout(): void {
        this.auth.logout();
    }

    goTo(section: Section): void {
        this.auth.setActiveSection(section);
    }
}
