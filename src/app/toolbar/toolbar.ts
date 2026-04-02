import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AppStateService } from "../app-state";
import { TourFormComponent } from "../tour-form/tour-form";

@Component({
    selector: 'app-toolbar',
    standalone: true,
    imports: [FormsModule, TourFormComponent],
    templateUrl: './toolbar.html',
    styleUrls: ['./../app.css', './toolbar.css']
})

export class ToolbarComponent {
    private readonly state = inject(AppStateService);

    readonly search = this.state.searchText;
   

    setSearch(v: string): void {
        this.state.setSearch(v);
    }

    add(): void {
       this.state.addSection('addTour');
    }

    clear(): void {
        this.state.setSearch('');
    }
}