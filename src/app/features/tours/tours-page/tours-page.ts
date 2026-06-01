import { Component, inject } from '@angular/core';
import { ActivityFilter, TourListMode, TourViewModelService } from '../view-model/tour-view-model.service';
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
  protected readonly state = inject(TourViewModelService);

  readonly searchInput = this.state.searchInput;
  readonly activeFilters = this.state.activeFilters;
  readonly selectedTour = this.state.selectedTour;
  readonly hasMore = this.state.hasMore;
  readonly loading = this.state.loading;
  readonly error = this.state.error;
  readonly listMode = this.state.listMode;
  readonly favoriteCount = this.state.favoriteCount;
  readonly overview = this.state.overview;

  readonly filterDefs: { id: ActivityFilter; icon: string; label: string }[] = [
    { id: 'hike', icon: 'W', label: 'Wandern' },
    { id: 'run', icon: 'L', label: 'Laufen' },
    { id: 'bike', icon: 'R', label: 'Radfahren' },
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

  setListMode(mode: TourListMode): void {
    this.state.setListMode(mode);
  }

  openAddForm(): void {
    this.state.openAddForm();
  }

  backToList(): void {
    this.state.clearSelection();
  }
}
