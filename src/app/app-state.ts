import { Injectable, computed, signal } from '@angular/core';

export type Category = 'all' |'hike' | 'run' | 'bike';
export type Section = 'home' | 'about' | 'login';

export type Tour = {
  id: string;
  title: string;
  category: Category;
  speed: number;
  description: string;
};

export type Session = {
  loggedIn: boolean;
  username:string;
  sections: Section[];
}

@Injectable({ providedIn: 'root' })
export class AppStateService {

  readonly selectedCategory = signal<Category>('all');
  readonly searchText = signal<string>('');
  readonly selectedTourId = signal<string | null>(null);
  readonly activeSession = signal<Session>({loggedIn:false, username:'', sections: ['home']});

  private readonly tours = signal<Tour[]>([
    {
      id: crypto.randomUUID(),
      title: 'A walk in the park',
      category: 'hike',
      speed: 2,
      description: 'Just a little walk on a beautiful day.',
    },
    {
      id: crypto.randomUUID(),
      title: 'Run, Forest, run',
      category: 'run',
      speed: 4,
      description: 'Endlessly running around in a circle.',
    },
    {
      id: crypto.randomUUID(),
      title: 'Just like riding a bike',
      category: 'bike',
      speed: 10,
      description: 'You can never unlearn this.',
    },
  ]);


  readonly filteredTours = computed(() => {
    const q = this.searchText().trim().toLowerCase();
    const cat = this.selectedCategory();

    return this.tours().filter((it) => {
      const catOk = cat === 'all' ? true : it.category === cat;
      const qOk =
        q.length === 0
          ? true
          : it.title.toLowerCase().includes(q) ||
            it.description.toLowerCase().includes(q);
      return catOk && qOk;
    });
  });

  readonly selectedTour = computed(() => {
    const id = this.selectedTourId();
    if (!id) return null;
    return this.tours().find((x) => x.id === id) ?? null;
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

  addRandomItem(): void {
    const cats: Tour['category'][] = ['hike', 'run', 'bike'];
    const category = cats[Math.floor(Math.random() * cats.length)];
    const newItem: Tour = {
      id: crypto.randomUUID(),
      title: `New tour ${this.tours().length + 1}`,
      category,
      speed: Math.floor(1 + Math.random()*10),
      description: 'Random new tour.',
    };
    this.tours.update((arr) => [newItem, ...arr]);
  }

  setSection(section: Section): void {
    this.activeSession().sections=[section];
  }

  addSection(section: Section): void {
    this.activeSession().sections.push(section);
  }

  subtractSection(section: Section): void {
    this.activeSession().sections = this.activeSession().sections.filter(s => s !== section);
    if (this.activeSession().sections.length==0) {
      this.activeSession().sections = ['home'];
    }
  }

  login(username: string): void {
    this.activeSession.set({loggedIn: true, username: username, sections:['home']})
    console.log('Logged in:', this.activeSession());
  }

  logout(): void {
    console.log('Logged out');
    this.activeSession.set({loggedIn: false, username: '', sections:['home']});
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
