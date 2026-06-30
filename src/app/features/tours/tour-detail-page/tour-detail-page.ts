import { Component, ViewChild, effect, inject, signal } from '@angular/core';
import { TourViewModelService } from '../view-model/tour-view-model.service';
import { TourFormComponent } from '../tour-form/tour-form';
import { TourMapComponent } from '../tour-map/tour-map';
import { TourLogListComponent } from '../logs/tour-log-list/tour-log-list';
import { TourService } from '../data-access/tour.service';
import { Tour, Weather } from '../models/tour.model';

@Component({
  selector: 'app-tour-detail-page',
  standalone: true,
  imports: [TourFormComponent, TourMapComponent, TourLogListComponent],
  templateUrl: './tour-detail-page.html',
  styleUrls: ['./tour-detail-page.css'],
})
export class TourDetailPageComponent {
  protected readonly state = inject(TourViewModelService);
  private readonly tourService = inject(TourService);

  exportUrl(): string {
    const tour = this.selected();
    if (!tour) return '';
    return this.tourService.exportTourUrl(tour.id, tour.username);
  }

  readonly selected = this.state.selectedTour;
  readonly editing  = signal(false);
  readonly confirmDeleteOpen = signal(false);
  readonly deleting = signal(false);
  readonly deleteError = signal<string | null>(null);
  readonly weather = signal<Weather | null>(null);
  readonly weatherLoading = signal(false);
  readonly weatherError = signal<string | null>(null);
  readonly savingPendingSelection = signal(false);
  private weatherTourId: string | null = null;

  @ViewChild(TourFormComponent) private formComponent?: TourFormComponent;

  constructor() {
    effect(() => {
      const tour = this.selected();
      if (!tour) {
        this.weatherTourId = null;
        this.weather.set(null);
        this.weatherError.set(null);
        return;
      }
      if (tour.id !== this.weatherTourId) {
        this.weatherTourId = tour.id;
        this.weather.set(null);
        this.weatherError.set(null);
        void this.loadWeather(tour);
      }
    });
  }

  startEdit(): void {
    this.editing.set(true);
    this.state.beginEditing();
  }

  cancelEdit(): void {
    this.editing.set(false);
    this.state.endEditing();
  }

  requestDelete(): void {
    this.deleteError.set(null);
    this.confirmDeleteOpen.set(true);
  }

  cancelDelete(): void {
    if (this.deleting()) return;
    this.confirmDeleteOpen.set(false);
  }

  async confirmDelete(): Promise<void> {
    const id = this.selected()?.id;
    if (!id || this.deleting()) return;
    this.deleting.set(true);
    this.deleteError.set(null);
    try {
      await this.state.deleteTour(id);
      this.confirmDeleteOpen.set(false);
    } catch {
      this.deleteError.set('Tour konnte nicht gelöscht werden. Bitte Backend und Datenbank prüfen.');
    } finally {
      this.deleting.set(false);
    }
  }

  async toggleFavorite(): Promise<void> {
    const tour = this.selected();
    if (!tour) return;
    await this.state.toggleFavorite(tour);
  }

  close(): void {
    if (this.deleting()) return;
    this.editing.set(false);
    this.confirmDeleteOpen.set(false);
    this.state.clearSelection();
  }

  cancelTourSwitch(): void {
    this.state.cancelPendingSelection();
  }

  cancelAddSwitch(): void {
    this.state.cancelPendingAddForm();
  }

  discardAndSwitch(): void {
    this.editing.set(false);
    this.state.discardPendingSelection();
  }

  discardAndAdd(): void {
    this.editing.set(false);
    this.state.discardPendingAddForm();
  }

  async saveAndSwitch(): Promise<void> {
    if (!this.formComponent || this.savingPendingSelection()) return;
    const target = this.state.pendingSelectionId();
    this.savingPendingSelection.set(true);
    const saved = await this.formComponent.submit();
    this.savingPendingSelection.set(false);
    if (saved) {
      this.editing.set(false);
      this.state.endEditing();
      if (target) this.state.selectedTourId.set(target);
    }
  }

  async saveAndAdd(): Promise<void> {
    if (!this.formComponent || this.savingPendingSelection()) return;
    this.savingPendingSelection.set(true);
    const saved = await this.formComponent.submit();
    this.savingPendingSelection.set(false);
    if (saved) {
      this.editing.set(false);
      this.state.endEditing();
      this.state.openAddForm();
    }
  }

  private async loadWeather(tour: Tour): Promise<void> {
    this.weatherLoading.set(true);
    try {
      this.weather.set(await this.tourService.loadWeather(tour));
    } catch {
      this.weatherError.set('Wetterdaten konnten nicht geladen werden.');
    } finally {
      this.weatherLoading.set(false);
    }
  }
}
