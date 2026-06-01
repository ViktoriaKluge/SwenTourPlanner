import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Tour, TourLog, Weather } from '../models/tour.model';

@Injectable({ providedIn: 'root' })
export class TourService {
  private readonly http = inject(HttpClient);
  readonly tours = signal<Tour[]>([]);

  async load(username: string, query = ''): Promise<void> {
    const url = query.trim()
      ? `/api/tours/search?q=${encodeURIComponent(query.trim())}`
      : '/api/tours';
    const tours = await firstValueFrom(this.http.get<Tour[]>(url, this.options(username)));
    this.tours.set((tours ?? []).map(this.normalizeTour));
  }

  async add(tour: Tour): Promise<void> {
    const saved = await firstValueFrom(this.http.post<Tour>('/api/tours', tour, this.options(tour.username)));
    if (saved) this.tours.update((arr) => [this.normalizeTour(saved), ...arr]);
  }

  async update(tour: Tour): Promise<void> {
    const saved = await firstValueFrom(this.http.put<Tour>(`/api/tours/${tour.id}`, tour, this.options(tour.username)));
    if (saved) this.tours.update((arr) => arr.map((t) => (t.id === tour.id ? this.normalizeTour(saved) : t)));
  }

  async delete(id: string, username: string): Promise<void> {
    await firstValueFrom(this.http.delete(`/api/tours/${id}`, this.options(username)));
    this.tours.update((arr) => arr.filter((t) => t.id !== id));
  }

  async addLog(tourId: string, log: TourLog, username: string): Promise<void> {
    const saved = await firstValueFrom(this.http.post<TourLog>(`/api/tours/${tourId}/logs`, log, this.options(username)));
    this.patchLog(tourId, saved ?? log);
  }

  async updateLog(tourId: string, log: TourLog, username: string): Promise<void> {
    const saved = await firstValueFrom(this.http.put<TourLog>(`/api/tours/${tourId}/logs/${log.id}`, log, this.options(username)));
    this.patchLog(tourId, saved ?? log);
  }

  async deleteLog(tourId: string, logId: string, username: string): Promise<void> {
    await firstValueFrom(this.http.delete(`/api/tours/${tourId}/logs/${logId}`, this.options(username)));
    this.tours.update((arr) => arr.map((t) => t.id === tourId ? { ...t, logs: t.logs.filter((l) => l.id !== logId) } : t));
  }

  exportUrl(username: string): string {
    return `/api/tours/export?username=${encodeURIComponent(username)}`;
  }

  async importTours(username: string, tours: Tour[]): Promise<void> {
    const imported = await firstValueFrom(this.http.post<Tour[]>('/api/tours/import', tours, this.options(username)));
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

  private options(username: string): { headers: HttpHeaders } {
    return { headers: new HttpHeaders({ 'X-User': username }) };
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
