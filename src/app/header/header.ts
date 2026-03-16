import { Component, inject } from "@angular/core";
import { AppStateService, Section } from "../app-state";

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [],
    templateUrl: './header.html',
    styleUrls: ['./header.css']
})

export class HeaderComponent {
    state = inject(AppStateService);

    constructor() {
    console.log('✅ HeaderComponent geladen!');
}

    logout(): void {
        console.log('Logged out:');
        this.state.activeSession.set({
            loggedIn: false,
            username: '',
            sections:['home']
        });
    }

    goHome(): void {
         console.log('Go home');
        const currentSession = this.state.activeSession();
        this.state.activeSession.set({
            loggedIn: currentSession.loggedIn,
            username: currentSession.username,
            sections: ['home'],
        });
       
    }

    goTo(section: Section): void {
        console.log('Go to '+section);
  
        const currentSession = this.state.activeSession();
         this.state.activeSession.set({
            loggedIn: currentSession.loggedIn,
            username: currentSession.username,
            sections: [section],
        });
    }

    goToAbout(): void {
        console.log('Go to about');
        this.state.activeSession.update(session => ({
            ...session,
            sections: ['about']
        }));
    }
}