import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TourStateService } from "../state/tour-state.service";
import { AuthService } from "../../auth/services/auth.service";
import { TourFormComponent } from "../tour-form/tour-form";

@Component({
    selector: 'app-toolbar',
    standalone: true,
    imports: [FormsModule, TourFormComponent],
    templateUrl: './toolbar.html',
    styleUrls: ['../../../app.css', './toolbar.css']
})

export class ToolbarComponent {
    private readonly state = inject(TourStateService);
    private readonly auth = inject(AuthService);

    readonly search = this.state.searchText;

    setSearch(v: string): void {
        this.state.setSearch(v);
    }

    add(): void {
        this.auth.addSection('addTour');
    }

    clear(): void {
        this.state.setSearch('');
    }
}
