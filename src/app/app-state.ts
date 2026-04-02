import { Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Category, Section, Session, Tour } from './app-types';

@Injectable({ providedIn: 'root' })
export class AppStateService {

  readonly selectedCategory = signal<Category>('all');
  readonly searchText = signal<string>('');
  readonly selectedTourId = signal<string | null>(null);
  readonly activeSession = signal<Session>({loggedIn:false, username:'', sections: ['home']});

  private readonly tours = signal<Tour[]>([
    {
      id: crypto.randomUUID(),
      username: 'abc',
      title: 'A walk in the park',
      category: 'hike',
      description: 'Just a little walk on a beautiful day.',
      startPoint: {name: 'Start', latitude:123, longitude:456},
      endPoint: {name: 'End', latitude: 456, longitude: 123},
      poi: [],
      image: 'tba',
      route: {distance: 12, durationMin: 230},
      logs:[],
    },
    {
      id: crypto.randomUUID(),
      username: 'abc',
      title: 'Run, Forest, run',
      category: 'run',
      description: 'Endlessly running around in a circle.',
      startPoint: {name: 'Start', latitude:789, longitude:987},
      endPoint: {name: 'End', latitude: 456, longitude: 654},
      poi: [],
      image: 'tba',
      route: {distance: 76, durationMin: 1245},
      logs:[],
    },
    {
      id: crypto.randomUUID(),
      username: 'abc',
      title: 'Just like riding a bike',
      category: 'bike',
      description: 'You never forget how to do this.',
      startPoint: {name: 'Start', latitude:123, longitude:321},
      endPoint: {name: 'End', latitude: 753, longitude: 951},
      poi: [],
      image: 'tba',
      route: {distance: 4, durationMin: 124},
      logs:[],
    },
  ]);


  readonly filteredTours = computed(() => {
    const q = this.searchText().trim().toLowerCase();
    const cat = this.selectedCategory();
    const user = this.activeSession().username;

    return this.tours().filter((to) => {
      const userOk = to.username === user;
      const catOk = cat === 'all' ? true : to.category === cat;
      const qOk =
        q.length === 0
          ? true
          : to.title.toLowerCase().includes(q) ||
            to.description.toLowerCase().includes(q);
      return userOk && catOk && qOk;
    });
  });

  readonly selectedTour = computed(() => {
    const id = this.selectedTourId();
    if (!id) return null;
    return this.tours().find((x) => x.id === id) ?? null;
  });

  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

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

  updateTour(tour: Tour): void {
    this.tours.update(arr => arr.map(t => t.id === tour.id ? tour : t));
  }

  deleteTour(id: string): void {
    this.tours.update(arr => arr.filter(t => t.id !== id));
    this.selectedTourId.set(null);
  }

  addTour(tour: Tour): void {
    this.tours.update((arr) => [tour, ...arr]);
  }

  setSection(section: Section[]): void {
    this.activeSession().sections=section;
  }

  addSection(section: Section): void {
    const current = this.activeSession();
    this.activeSession.set({ ...current, sections: [...current.sections, section] });
  }

  subtractSection(section: Section): void {
    const current = this.activeSession();
    const sections = current.sections.filter(s => s !== section);
    this.activeSession.set({ ...current, sections: sections.length > 0 ? sections : ['home'] });
  }

  login(username: string): void {
    this.activeSession.set({loggedIn: true, username: username, sections:['home']})
    console.log('Logged in:', this.activeSession());
  }

  logout(): void {
    this.activeSession.set({loggedIn: false, username: '', sections:['home']});
    console.log('Logged out');
  }

  setActiveSection(section: Section) {
    console.log('Set active section to '+section);
  
    const currentSession = this.activeSession();
      this.activeSession.set({
        loggedIn: currentSession.loggedIn,
        username: currentSession.username,
        sections: [section],
    });
  }
}
