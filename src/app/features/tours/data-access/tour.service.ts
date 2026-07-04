import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Tour, TourLog, Weather } from '../models/tour.model';

@Injectable({ providedIn: 'root' })
export class TourService {
  private readonly http = inject(HttpClient);
  readonly tours = signal<Tour[]>([]);

  async load(query = ''): Promise<void> {
    const url = query.trim()
      ? `/api/tours/search?q=${encodeURIComponent(query.trim())}`
      : '/api/tours';
    const tours = await firstValueFrom(this.http.get<Tour[]>(url));
    this.tours.set((tours ?? []).map(this.normalizeTour));
  }

  async add(tour: Tour): Promise<Tour | null> {
    const saved = await firstValueFrom(this.http.post<Tour>('/api/tours', tour));
    if (saved) this.tours.update((arr) => [this.normalizeTour(saved), ...arr]);
    return saved ? this.normalizeTour(saved) : null;
  }

  async update(tour: Tour): Promise<void> {
    const saved = await firstValueFrom(this.http.put<Tour>(`/api/tours/${tour.id}`, tour));
    if (saved) this.tours.update((arr) => arr.map((t) => (t.id === tour.id ? this.normalizeTour(saved) : t)));
  }

  async delete(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`/api/tours/${id}`));
    this.tours.update((arr) => arr.filter((t) => t.id !== id));
  }

  async addLog(tourId: string, log: TourLog): Promise<void> {
    const saved = await firstValueFrom(this.http.post<TourLog>(`/api/tours/${tourId}/logs`, log));
    this.patchLog(tourId, saved ?? log);
  }

  async updateLog(tourId: string, log: TourLog): Promise<void> {
    const saved = await firstValueFrom(this.http.put<TourLog>(`/api/tours/${tourId}/logs/${log.id}`, log));
    this.patchLog(tourId, saved ?? log);
  }

  async deleteLog(tourId: string, logId: string): Promise<void> {
    await firstValueFrom(this.http.delete(`/api/tours/${tourId}/logs/${logId}`));
    this.tours.update((arr) => arr.map((t) => t.id === tourId ? { ...t, logs: t.logs.filter((l) => l.id !== logId) } : t));
  }

  async exportAll(): Promise<object[]> {
    return await firstValueFrom(this.http.get<object[]>('/api/tours/export')) ?? [];
  }

  async exportTour(tourId: string): Promise<object[]> {
    return await firstValueFrom(this.http.get<object[]>(`/api/tours/${tourId}/export`)) ?? [];
  }

  async importTours(tours: Tour[]): Promise<void> {
    const imported = await firstValueFrom(this.http.post<Tour[]>('/api/tours/import', tours));
    this.tours.set((imported ?? []).map(this.normalizeTour));
  }

  async loadWeather(tour: Tour): Promise<Weather | null> {
    try {
      return await firstValueFrom(this.http.post<Weather>('/api/weather/tour-summary', tour)) ?? null;
    } catch {
      const fallback = this.weatherFallbackPoint(tour);
      return await firstValueFrom(
        this.http.get<Weather>(`/api/weather/current?lat=${fallback.latitude}&lon=${fallback.longitude}`)
      ) ?? null;
    }
  }

  private patchLog(tourId: string, log: TourLog): void {
    this.tours.update((arr) => arr.map((tour) => {
      if (tour.id !== tourId) return tour;
      const exists = tour.logs.some((l) => l.id === log.id);
      const logs = exists ? tour.logs.map((l) => l.id === log.id ? log : l) : [log, ...tour.logs];
      return { ...tour, logs };
    }));
  }

  private normalizeTour(tour: Tour): Tour {
    return {
      ...tour,
      favorite: !!tour.favorite,
      logs: (tour.logs ?? []).map((log) => ({ ...log, date: new Date(log.date) })),
      poi: tour.poi ?? [],
    };
  }

  private weatherFallbackPoint(tour: Tour): { latitude: number; longitude: number } {
    const geometry = tour.route.geometry ?? [];
    if (geometry.length > 0) {
      const middle = geometry[Math.floor(geometry.length / 2)];
      if (middle) return { latitude: middle[0], longitude: middle[1] };
    }
    return {
      latitude: tour.startPoint.latitude,
      longitude: tour.startPoint.longitude,
    };
  }
}
