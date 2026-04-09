import { Component, inject, signal } from '@angular/core';
import { TourStateService } from '../state/tour-state.service';
import { TourFormComponent } from '../tour-form/tour-form';
import { TourMapComponent } from '../tour-map/tour-map';
import { TourLogListComponent } from '../logs/tour-log-list/tour-log-list';

@Component({
  selector: 'app-tour-detail-page',
  standalone: true,
  imports: [TourFormComponent, TourMapComponent, TourLogListComponent],
  templateUrl: './tour-detail-page.html',
  styleUrls: ['./tour-detail-page.css'],
})
export class TourDetailPageComponent {
  protected readonly state = inject(TourStateService);

  readonly selected = this.state.selectedTour;
  readonly editing  = signal(false);

  startEdit(): void { this.editing.set(true); }
  cancelEdit(): void { this.editing.set(false); }

  delete(): void {
    const id = this.selected()?.id;
    if (id) this.state.deleteTour(id);
  }

  close(): void {
    this.editing.set(false);
    this.state.clearSelection();
  }
}
