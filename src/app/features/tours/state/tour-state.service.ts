import { Injectable, computed, inject, signal } from '@angular/core';
import { TourService } from '../services/tour.service';
import { AuthService } from '../../auth/services/auth.service';
import { Tour } from '../models/tour.model';

export type ActivityFilter = 'hike' | 'run' | 'bike';

const PAGE_SIZE = 5;

@Injectable({ providedIn: 'root' })
export class TourStateService {
  private readonly tourService = inject(TourService);
  private readonly authService = inject(AuthService);
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  // ── Search ──
  readonly searchInput = signal('');   // raw binding value
  readonly searchText  = signal('');   // debounced, drives filtering

  // ── Category filters ──
  readonly activeFilters = signal<Set<ActivityFilter>>(new Set());

  // ── Selection ──
  readonly selectedTourId = signal<string | null>(null);

  // ── Pagination ──
  private readonly pageSize = signal(PAGE_SIZE);

  // ── UI state ──
  readonly isAddingTour = signal(false);

  // ── Derived ──
  readonly isFiltering = computed(() =>
    this.searchText().trim().length > 0 || this.activeFilters().size > 0
  );

  readonly filteredTours = computed(() => {
    const q       = this.searchText().trim().toLowerCase();
    const filters = this.activeFilters();
    const user    = this.authService.activeSession().username;

    return this.tourService.tours().filter((t) => {
      const byUser   = t.username === user;
      const byFilter = filters.size === 0 || filters.has(t.category as ActivityFilter);
      const bySearch = !q
        ? true
        : t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
      return byUser && byFilter && bySearch;
    });
  });

  /** Slice shown to user — full list when filtering, paged otherwise */
  readonly visibleTours = computed(() => {
    const all = this.filteredTours();
    return this.isFiltering() ? all : all.slice(0, this.pageSize());
  });

  readonly hasMore = computed(
    () => !this.isFiltering() && this.filteredTours().length > this.pageSize()
  );

  readonly selectedTour = computed(() => {
    const id = this.selectedTourId();
    return id ? (this.tourService.tours().find((t) => t.id === id) ?? null) : null;
  });

  // ── Search methods ──

  setSearchInput(text: string): void {
    this.searchInput.set(text);
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.searchText.set(text);
      this.pageSize.set(PAGE_SIZE);
      this.deselectIfGone();
    }, 700);
  }

  clearSearch(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.searchInput.set('');
    this.searchText.set('');
    this.pageSize.set(PAGE_SIZE);
  }

  // ── Filter methods ──

  toggleFilter(cat: ActivityFilter): void {
    this.activeFilters.update((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
    this.pageSize.set(PAGE_SIZE);
    this.deselectIfGone();
  }

  // ── Pagination ──

  loadMore(): void {
    this.pageSize.update((n) => n + PAGE_SIZE);
  }

  // ── Selection ──

  selectTour(id: string): void {
    this.selectedTourId.set(id);
  }

  clearSelection(): void {
    this.selectedTourId.set(null);
  }

  // ── Add-form ──

  openAddForm(): void {
    this.isAddingTour.set(true);
  }

  closeAddForm(): void {
    this.isAddingTour.set(false);
  }

  // ── CRUD ──

  addTour(tour: Tour): void {
    this.tourService.add(tour);
    this.isAddingTour.set(false);
  }

  updateTour(tour: Tour): void {
    this.tourService.update(tour);
  }

  deleteTour(id: string): void {
    this.tourService.delete(id);
    this.selectedTourId.set(null);
  }

  private deselectIfGone(): void {
    if (!this.filteredTours().some((t) => t.id === this.selectedTourId())) {
      this.selectedTourId.set(null);
    }
  }
}
