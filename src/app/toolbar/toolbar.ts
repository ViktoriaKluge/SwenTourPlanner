import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AppStateService } from "../app-state";

@Component({
    selector: 'app-toolbar',
    standalone: true,
    imports: [FormsModule],
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
        this.state.addRandomItem();
    }

    clear(): void {
        this.state.setSearch('');
    }
}