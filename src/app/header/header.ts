import { Component, inject } from "@angular/core";
import { AppStateService } from "../app-state";
import { Section } from "../app-types";

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [],
    templateUrl: './header.html',
    styleUrls: ['./header.css']
})

export class HeaderComponent {
    private readonly state = inject(AppStateService);
    readonly session = this.state.activeSession;

    constructor() {
    console.log('✅ HeaderComponent geladen!');
    }

    logout(): void {
        this.state.logout();
    }


    goTo(section: Section): void {
       this.state.setActiveSection(section);
    }
}