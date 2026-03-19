import { Component, inject } from "@angular/core";
import { AppStateService } from "../app-state";

@Component ({
    selector: 'app-details',
    standalone: true,
    templateUrl: './details.html',
    styleUrls: ['./../app.css', './details.css'],
})

export class DetailsComponent {
    private readonly state = inject(AppStateService);

    readonly selected = this.state.selectedTour;
 
    clear(): void {
        this.state.clearSelection();
    }
}