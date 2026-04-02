import { Component, inject, signal } from "@angular/core";
import { AppStateService } from "../app-state";
import { TourFormComponent } from "../tour-form/tour-form";

@Component ({
    selector: 'app-details',
    standalone: true,
    imports: [TourFormComponent],
    templateUrl: './details.html',
    styleUrls: ['./../app.css', './details.css'],
})

export class DetailsComponent {
    private readonly state = inject(AppStateService);

    readonly selected = this.state.selectedTour;
    readonly editing = signal(false);

    edit(): void {
        this.editing.set(true);
    }

    delete(): void {
        const id = this.selected()?.id;
        if (id) this.state.deleteTour(id);
    }

    clear(): void {
        this.editing.set(false);
        this.state.clearSelection();
    }
}