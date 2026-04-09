import { Injectable, effect, inject, signal } from '@angular/core';
import { Tour } from '../models/tour.model';

@Injectable({ providedIn: 'root' })
export class TourService {
  readonly tours = signal<Tour[]>([
    {
      id:"c83cecb9-59ae-4381-9975-da280b6ab0ad",
      username:"abc",
      title:"Downhill Fun",
      category:"bike",
      description:"Huiii.",
      startPoint:{"name":"Koralpe","latitude":46.8034844,"longitude":15.0207237},
      endPoint:{"name":"Gressenberg","latitude":46.8,"longitude":15.1166667},
      poi:[],
      route:{"distance":14.2,"durationMin":57},
      logs:[]
    },
    {
      id:"abe09ba7-c0e9-46f8-a89a-bf915e731208",
      username:"abc",
      title:"Morning Run",
      category:"run",
      description:"Link, rechts, geradeaus.",
      startPoint:{"name":"Dreyhausenstraße","latitude":48.1974676,"longitude":16.3038823},
      endPoint:{"name":"Dreyhausenstraße","latitude":48.1974676,"longitude":16.3038823},
      poi:[{"name":"KG Breitensee","latitude":48.2022735,"longitude":16.3064385}],
      route:{"distance":1.98,"durationMin":9},
      logs:[]
    },
    {
      id:"ab4cea48-5a0f-45a9-894c-42e57e9193df",
      username:"abc",
      title:"Wien Spaziergang",
      category:"hike",
      description:"Rumspazieren in Wien",
      startPoint:{"name":"Karlsplatz","latitude":48.2003906,"longitude":16.3695975},
      endPoint:{"name":"Schwedenplatz","latitude":48.2117924,"longitude":16.377606},
      poi:[],"route":{"distance":3.57,"durationMin":54},
      logs:[]
    }
  ]);

  constructor() {
    const saved = localStorage.getItem('tours');
    if (saved) this.tours.set(JSON.parse(saved));

    effect(() => {
      localStorage.setItem('tours', JSON.stringify(this.tours()));
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
