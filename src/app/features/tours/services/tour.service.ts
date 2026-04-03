import { Injectable, PLATFORM_ID, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Tour } from '../models/tour.model';

@Injectable({ providedIn: 'root' })
export class TourService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly tours = signal<Tour[]>([
    {
      id: crypto.randomUUID(),
      username: 'abc',
      title: 'A walk in the park',
      category: 'hike',
      description: 'Just a little walk on a beautiful day.',
      startPoint: { name: 'Start', latitude: 123, longitude: 456 },
      endPoint: { name: 'End', latitude: 456, longitude: 123 },
      poi: [],
      image: 'tba',
      route: { distance: 12, durationMin: 230 },
      logs: [],
    },
    {
      id: crypto.randomUUID(),
      username: 'abc',
      title: 'Run, Forest, run',
      category: 'run',
      description: 'Endlessly running around in a circle.',
      startPoint: { name: 'Start', latitude: 789, longitude: 987 },
      endPoint: { name: 'End', latitude: 456, longitude: 654 },
      poi: [],
      image: 'tba',
      route: { distance: 76, durationMin: 1245 },
      logs: [],
    },
    {
      id: crypto.randomUUID(),
      username: 'abc',
      title: 'Just like riding a bike',
      category: 'bike',
      description: 'You never forget how to do this.',
      startPoint: { name: 'Start', latitude: 123, longitude: 321 },
      endPoint: { name: 'End', latitude: 753, longitude: 951 },
      poi: [],
      image: 'tba',
      route: { distance: 4, durationMin: 124 },
      logs: [],
    },
  ]);

  constructor() {
    if (this.isBrowser) {
      const saved = localStorage.getItem('tours');
      if (saved) this.tours.set(JSON.parse(saved));
    }

    effect(() => {
      if (this.isBrowser) {
        localStorage.setItem('tours', JSON.stringify(this.tours()));
      }
    });
  }

  add(tour: Tour): void {
    this.tours.update((arr) => [tour, ...arr]);
  }

  update(tour: Tour): void {
    this.tours.update((arr) => arr.map((t) => (t.id === tour.id ? tour : t)));
  }

  delete(id: string): void {
    this.tours.update((arr) => arr.filter((t) => t.id !== id));
  }
}
