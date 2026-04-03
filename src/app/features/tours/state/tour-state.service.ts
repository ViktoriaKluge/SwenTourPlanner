import { Injectable, computed, inject, signal } from '@angular/core';
import { TourService } from '../services/tour.service';
import { AuthService } from '../../auth/services/auth.service';
import { Category, Tour } from '../models/tour.model';

@Injectable({ providedIn: 'root' })
export class TourStateService {
  private readonly tourService = inject(TourService);
  private readonly authService = inject(AuthService);

  readonly selectedCategory = signal<Category>('all');
  readonly searchText = signal<string>('');
  readonly selectedTourId = signal<string | null>(null);

  readonly filteredTours = computed(() => {
    const q = this.searchText().trim().toLowerCase();
    const cat = this.selectedCategory();
    const user = this.authService.activeSession().username;

    return this.tourService.tours().filter((to) => {
      const userOk = to.username === user;
      const catOk = cat === 'all' ? true : to.category === cat;
      const qOk =
        q.length === 0
          ? true
          : to.title.toLowerCase().includes(q) || to.description.toLowerCase().includes(q);
      return userOk && catOk && qOk;
    });
  });

  readonly selectedTour = computed(() => {
    const id = this.selectedTourId();
    if (!id) return null;
    return this.tourService.tours().find((x) => x.id === id) ?? null;
  });

  setCategory(cat: Category): void {
    this.selectedCategory.set(cat);
    const stillVisible = this.filteredTours().some((x) => x.id === this.selectedTourId());
    if (!stillVisible) this.selectedTourId.set(null);
  }

  setSearch(text: string): void {
    this.searchText.set(text);
    const stillVisible = this.filteredTours().some((x) => x.id === this.selectedTourId());
    if (!stillVisible) this.selectedTourId.set(null);
  }

  selectTour(id: string): void {
    this.selectedTourId.set(id);
  }

  clearSelection(): void {
    this.selectedTourId.set(null);
  }

  addTour(tour: Tour): void {
    this.tourService.add(tour);
  }

  updateTour(tour: Tour): void {
    this.tourService.update(tour);
  }

  deleteTour(id: string): void {
    this.tourService.delete(id);
    this.selectedTourId.set(null);
  }
}
