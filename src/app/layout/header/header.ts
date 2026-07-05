import { Component, HostListener, inject, signal } from "@angular/core";
import { AuthService } from "../../features/auth/services/auth.service";
import { Section } from "../../core/models/session.model";
import { ThemeService } from "../../core/services/theme.service";
import { TourViewModelService } from "../../features/tours/view-model/tour-view-model.service";

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [],
    templateUrl: './header.html',
    styleUrls: ['./header.css']
})

export class HeaderComponent {
    private readonly auth = inject(AuthService);
    private readonly theme = inject(ThemeService);
    private readonly tours = inject(TourViewModelService);
    readonly session = this.auth.activeSession;
    readonly darkMode = this.theme.darkMode;
    readonly moreOpen = signal(false);

    logout(): void {
        this.moreOpen.set(false);
        this.tours.goHome();
        this.auth.logout();
    }

    goTo(section: Section): void {
        this.moreOpen.set(false);
        if (section === 'home') {
            this.tours.resetAll();
        }
        this.auth.setActiveSection(section);
    }

    goToTours(): void {
        this.moreOpen.set(false);
        this.tours.goHome();
        this.tours.setListMode('all');
        this.auth.setActiveSection('home');
    }

    goToFavorites(): void {
        this.moreOpen.set(false);
        this.tours.goHome();
        this.tours.setListMode('favorites');
        this.auth.setActiveSection('home');
    }

    toggleDarkMode(): void {
        this.theme.toggle();
    }

    toggleMoreMenu(event: MouseEvent): void {
        event.stopPropagation();
        this.moreOpen.update((open) => !open);
    }

    closeMoreMenu(): void {
        this.moreOpen.set(false);
    }

    async exportAll(): Promise<void> {
        this.moreOpen.set(false);
        try {
            await this.tours.exportAll();
        } catch { /* silently ignore */ }
    }

    async importFile(event: Event): Promise<void> {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (file) {
            try {
                await this.tours.importTours(file);
            } catch (e: unknown) {
                alert(e instanceof Error ? e.message : 'Import fehlgeschlagen.');
            }
        }
        input.value = '';
        this.moreOpen.set(false);
    }

    @HostListener('document:click')
    onDocumentClick(): void {
        this.moreOpen.set(false);
    }
}
