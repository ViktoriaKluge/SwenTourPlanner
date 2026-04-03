import { Component, inject, signal } from "@angular/core";
import { SidebarComponent } from "../sidebar/sidebar";
import { DetailsComponent } from "../tour-details/tour-details";
import { AuthService } from "../../auth/services/auth.service";
import { TourListComponent } from "../tour-list/tour-list";
import { ToolbarComponent } from "../toolbar/toolbar";

@Component({
    selector: 'app-home',
    standalone: true,
    templateUrl: './home.html',
    imports: [SidebarComponent, DetailsComponent, TourListComponent, ToolbarComponent],
    styleUrls: ['../../../app.css', './home.css'],
})

export class HomeComponent {
    protected readonly title = signal('TourPlanner')
    private readonly auth = inject(AuthService);
    readonly session = this.auth.activeSession;
}
