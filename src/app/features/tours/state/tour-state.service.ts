import { Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TourService } from '../data-access/tour.service';
import { AuthService } from '../../auth/services/auth.service';
import { Tour } from '../models/tour.model';

export type ActivityFilter = 'hike' | 'run' | 'bike';

const PAGE_SIZE = 5;
const SEARCH_KEY  = 'tour-search';
const FILTERS_KEY = 'tour-filters';

@Injectable({ providedIn: 'root' })
export class TourStateService {
  private readonly tourService  = inject(TourService);
  private readonly authService  = inject(AuthService);
  private readonly isBrowser    = isPlatformBrowser(inject(PLATFORM_ID));
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  // ── Search ──
  readonly searchInput = signal(this.restoreString(SEARCH_KEY, ''));
  readonly searchText  = signal(this.restoreString(SEARCH_KEY, ''));

  // ── Category filters ──
  readonly activeFilters = signal<Set<ActivityFilter>>(
    new Set(this.restoreFilters())
  );

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

  constructor() {
    // Persist searchText whenever it changes
    effect(() => {
      const text = this.searchText();
      if (this.isBrowser) {
        if (text) {
          localStorage.setItem(SEARCH_KEY, text);
        } else {
          localStorage.removeItem(SEARCH_KEY);
        }
      }
    });

    // Persist activeFilters whenever they change
    effect(() => {
      const filters = [...this.activeFilters()];
      if (this.isBrowser) {
        if (filters.length > 0) {
          localStorage.setItem(FILTERS_KEY, JSON.stringify(filters));
        } else {
          localStorage.removeItem(FILTERS_KEY);
        }
      }
    });
  }

  // ── Search ──

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

  // ── Filters ──

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

  // ── localStorage helpers ──

  private restoreString(key: string, fallback: string): string {
    if (typeof localStorage === 'undefined') return fallback;
    return localStorage.getItem(key) ?? fallback;
  }

  private restoreFilters(): ActivityFilter[] {
    try {
      if (typeof localStorage === 'undefined') return [];
      const raw = localStorage.getItem(FILTERS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as ActivityFilter[];
    } catch { /* ignore */ }
    return [];
  }

  private deselectIfGone(): void {
    if (!this.filteredTours().some((t) => t.id === this.selectedTourId())) {
      this.selectedTourId.set(null);
    }
  }
}
