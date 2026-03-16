import { Component, computed, inject, signal, WritableSignal } from "@angular/core";
import { SidebarComponent } from "../sidebar/sidebar";
import { DetailsComponent } from "../details/details";
import { AppStateService } from "../app-state";
import { TourListComponent } from "../tour-list/tour-list";
import { ToolbarComponent } from "../toolbar/toolbar";

@Component({
    selector: 'app-home',
    standalone: true,
    templateUrl: './home.html',
    imports: [SidebarComponent, DetailsComponent, TourListComponent, ToolbarComponent],
    styleUrls: ['./../app.css','./home.css'],
})

export class HomeComponent {
    protected readonly title = signal('TourPlanner')
    readonly state = inject(AppStateService);
}