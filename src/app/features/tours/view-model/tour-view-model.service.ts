import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { TourService } from '../data-access/tour.service';
import { AuthService } from '../../auth/services/auth.service';
import { Tour, TourLog } from '../models/tour.model';

export type ActivityFilter = 'hike' | 'run' | 'bike';
export type TourListMode = 'all' | 'favorites';

const PAGE_SIZE = 5;
const SEARCH_KEY  = 'tour-search';
const FILTERS_KEY = 'tour-filters';

@Injectable({ providedIn: 'root' })
export class TourViewModelService {
  private readonly tourService  = inject(TourService);
  private readonly authService  = inject(AuthService);
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  // Search
  readonly searchInput = signal(localStorage.getItem(SEARCH_KEY) ?? '');
  readonly searchText  = signal(localStorage.getItem(SEARCH_KEY) ?? '');

  // Category filters
  readonly activeFilters = signal<Set<ActivityFilter>>(
    new Set(this.restoreFilters())
  );

  // Selection
  readonly selectedTourId = signal<string | null>(null);

  // Pagination
  private readonly pageSize = signal(PAGE_SIZE);

  // UI state
  readonly isAddingTour = signal(false);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly editModeActive = signal(false);
  readonly unsavedChanges = signal(false);
  readonly pendingSelectionId = signal<string | null>(null);
  readonly pendingAddForm = signal(false);
  readonly listMode = signal<TourListMode>('all');

  // Derived values
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
      const byMode = this.listMode() === 'all' || t.favorite;
      const bySearch = !q
        ? true
        : t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
      return byUser && byFilter && byMode && bySearch;
    });
  });

  /** Slice shown to user: full list when filtering, paged otherwise. */
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

  readonly favoriteCount = computed(() =>
    this.tourService.tours().filter((tour) => tour.username === this.authService.activeSession().username && tour.favorite).length
  );

  readonly overview = computed(() => {
    const tours = this.tourService.tours().filter((tour) => tour.username === this.authService.activeSession().username);
    const logs = tours.flatMap((tour) => tour.logs.map((log) => ({ tour, log })));
    const completedTourCount = tours.filter((tour) => tour.logs.length > 0).length;
    const completedDistance = logs.reduce((sum, item) => sum + (Number(item.log.totalDistance) || 0), 0);
    const completedDuration = logs.reduce((sum, item) => sum + (Number(item.log.totalTime) || 0), 0);
    const latestLog = logs.sort((a, b) => new Date(b.log.date).getTime() - new Date(a.log.date).getTime())[0];
    const plannedTour = tours.find((tour) => tour.logs.length === 0) ?? tours[0] ?? null;

    return {
      completedTourCount,
      completedDistance: Math.round(completedDistance * 10) / 10,
      completedDuration,
      latestTour: latestLog?.tour ?? tours[0] ?? null,
      plannedTour,
    };
  });

  constructor() {
    effect(() => {
      const user = this.authService.activeSession().username;
      if (user) void this.reload();
      else this.tourService.tours.set([]);
    });

    // Persist searchText whenever it changes
    effect(() => {
      const text = this.searchText();
      if (text) {
        localStorage.setItem(SEARCH_KEY, text);
      } else {
        localStorage.removeItem(SEARCH_KEY);
      }
    });

    // Persist activeFilters whenever they change
    effect(() => {
      const filters = [...this.activeFilters()];
      if (filters.length > 0) {
        localStorage.setItem(FILTERS_KEY, JSON.stringify(filters));
      } else {
        localStorage.removeItem(FILTERS_KEY);
      }
    });
  }

  // Search

  setSearchInput(text: string): void {
    this.searchInput.set(text);
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.searchText.set(text);
      this.pageSize.set(PAGE_SIZE);
      this.deselectIfGone();
      void this.reload();
    }, 700);
  }

  clearSearch(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.searchInput.set('');
    this.searchText.set('');
    this.pageSize.set(PAGE_SIZE);
    void this.reload();
  }

  // Filters

  toggleFilter(cat: ActivityFilter): void {
    this.activeFilters.update((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
    this.pageSize.set(PAGE_SIZE);
    this.deselectIfGone();
  }

  setListMode(mode: TourListMode): void {
    this.listMode.set(mode);
    this.pageSize.set(PAGE_SIZE);
    this.deselectIfGone();
  }

  // Pagination

  loadMore(): void {
    this.pageSize.update((n) => n + PAGE_SIZE);
  }

  // Selection

  selectTour(id: string): void {
    if (this.editModeActive() && this.unsavedChanges() && id !== this.selectedTourId()) {
      this.pendingSelectionId.set(id);
      return;
    }
    this.selectedTourId.set(id);
  }

  clearSelection(): void {
    this.selectedTourId.set(null);
  }

  goHome(): void {
    this.selectedTourId.set(null);
    this.isAddingTour.set(false);
    this.editModeActive.set(false);
    this.unsavedChanges.set(false);
    this.pendingSelectionId.set(null);
    this.pendingAddForm.set(false);
  }

  // Add form

  openAddForm(): void {
    if (this.editModeActive() && this.unsavedChanges()) {
      this.pendingAddForm.set(true);
      return;
    }
    this.isAddingTour.set(true);
  }

  closeAddForm(): void {
    this.isAddingTour.set(false);
  }

  beginEditing(): void {
    this.editModeActive.set(true);
    this.unsavedChanges.set(false);
    this.pendingSelectionId.set(null);
    this.pendingAddForm.set(false);
  }

  endEditing(): void {
    this.editModeActive.set(false);
    this.unsavedChanges.set(false);
    this.pendingSelectionId.set(null);
    this.pendingAddForm.set(false);
  }

  markUnsaved(): void {
    if (this.editModeActive()) this.unsavedChanges.set(true);
  }

  confirmPendingSelection(): void {
    const id = this.pendingSelectionId();
    this.endEditing();
    if (id) this.selectedTourId.set(id);
  }

  discardPendingSelection(): void {
    this.confirmPendingSelection();
  }

  cancelPendingSelection(): void {
    this.pendingSelectionId.set(null);
  }

  confirmPendingAddForm(): void {
    this.endEditing();
    this.isAddingTour.set(true);
  }

  discardPendingAddForm(): void {
    this.confirmPendingAddForm();
  }

  cancelPendingAddForm(): void {
    this.pendingAddForm.set(false);
  }

  // CRUD

  async reload(): Promise<void> {
    const user = this.authService.activeSession().username;
    if (!user) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.tourService.load(user, this.searchText());
    } catch {
      this.tourService.tours.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  async addTour(tour: Tour): Promise<void> {
    await this.tourService.add(tour);
    this.isAddingTour.set(false);
  }

  async updateTour(tour: Tour): Promise<void> {
    await this.tourService.update(tour);
  }

  async toggleFavorite(tour: Tour): Promise<void> {
    await this.updateTour({ ...tour, favorite: !tour.favorite });
  }

  async deleteTour(id: string): Promise<void> {
    await this.tourService.delete(id, this.authService.activeSession().username);
    this.selectedTourId.set(null);
  }

  async addLog(tourId: string, log: TourLog): Promise<void> {
    await this.tourService.addLog(tourId, log, this.authService.activeSession().username);
    await this.reload();
  }

  async updateLog(tourId: string, log: TourLog): Promise<void> {
    await this.tourService.updateLog(tourId, log, this.authService.activeSession().username);
    await this.reload();
  }

  async deleteLog(tourId: string, logId: string): Promise<void> {
    await this.tourService.deleteLog(tourId, logId, this.authService.activeSession().username);
    await this.reload();
  }

  exportUrl(): string {
    return this.tourService.exportUrl(this.authService.activeSession().username);
  }

  async importTours(file: File): Promise<void> {
    const text = await file.text();
    const tours = JSON.parse(text) as Tour[];
    await this.tourService.importTours(this.authService.activeSession().username, tours);
  }

  // localStorage helpers

  private restoreFilters(): ActivityFilter[] {
    try {
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
