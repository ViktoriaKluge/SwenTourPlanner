import { Component, inject } from '@angular/core';
import { TourStateService, ActivityFilter } from '../state/tour-state.service';
import { TourListComponent } from '../tour-list/tour-list';
import { TourDetailPageComponent } from '../tour-detail-page/tour-detail-page';

@Component({
  selector: 'app-tours-page',
  standalone: true,
  imports: [TourListComponent, TourDetailPageComponent],
  templateUrl: './tours-page.html',
  styleUrls: ['./tours-page.css'],
})
export class ToursPageComponent {
  protected readonly state = inject(TourStateService);

  readonly searchInput  = this.state.searchInput;
  readonly activeFilters = this.state.activeFilters;
  readonly selectedTour  = this.state.selectedTour;
  readonly hasMore       = this.state.hasMore;

  readonly filterDefs: { id: ActivityFilter; icon: string; label: string }[] = [
    { id: 'hike', icon: '🥾', label: 'Hiking'   },
    { id: 'run',  icon: '🏃', label: 'Running'  },
    { id: 'bike', icon: '🚴', label: 'Cycling'  },
  ];

  isActive(id: ActivityFilter): boolean {
    return this.activeFilters().has(id);
  }

  onInput(event: Event): void {
    this.state.setSearchInput((event.target as HTMLInputElement).value);
  }

  clearSearch(): void {
    this.state.clearSearch();
  }

  toggleFilter(id: ActivityFilter): void {
    this.state.toggleFilter(id);
  }

  openAddForm(): void {
    this.state.openAddForm();
  }

  backToList(): void {
    this.state.clearSelection();
  }
}
