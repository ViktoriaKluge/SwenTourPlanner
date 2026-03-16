import { Component, inject } from "@angular/core";
import { AppStateService, Tour } from "../app-state";
import { TourCardComponent } from "../tour-card/tour-card";

@Component ({
    selector: 'app-tour-list',
    standalone: true,
    imports: [TourCardComponent],
    templateUrl: './tour-list.html',
})

export class TourListComponent {
    private readonly state= inject(AppStateService);

    readonly tours= this.state.filteredTours;
    readonly selectedId= this.state.selectedTourId;

    onSelect(tour:Tour): void {
        this.state.selectTour(tour.id);
    }
}