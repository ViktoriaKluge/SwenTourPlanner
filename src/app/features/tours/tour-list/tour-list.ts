import { Component, inject } from "@angular/core";
import { AppStateService} from "../../../state/app-state";
import { TourCardComponent } from "../tour-card/tour-card";
import { Tour } from "../../../core/models/tour.model";

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
