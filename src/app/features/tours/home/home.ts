import { Component, inject, signal } from "@angular/core";
import { SidebarComponent } from "../../../layout/sidebar/sidebar";
import { DetailsComponent } from "../tour-details/tour-details";
import { AppStateService } from "../../../state/app-state";
import { TourListComponent } from "../tour-list/tour-list";
import { ToolbarComponent } from "../../../layout/toolbar/toolbar";

@Component({
    selector: 'app-home',
    standalone: true,
    templateUrl: './home.html',
    imports: [SidebarComponent, DetailsComponent, TourListComponent, ToolbarComponent],
    styleUrls: ['../../../app.css', './home.css'],
})

export class HomeComponent {
    protected readonly title = signal('TourPlanner')
    private readonly state = inject(AppStateService);
    readonly session = this.state.activeSession;
}
