import { Injectable, signal } from '@angular/core';
import { Section, Session } from '../../../core/models/session.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly activeSession = signal<Session>({
    loggedIn: false,
    username: '',
    sections: ['home'],
  });

  login(username: string): void {
    this.activeSession.set({ loggedIn: true, username, sections: ['home'] });
  }

  logout(): void {
    this.activeSession.set({ loggedIn: false, username: '', sections: ['home'] });
  }

  setActiveSection(section: Section): void {
    const current = this.activeSession();
    this.activeSession.set({ ...current, sections: [section] });
  }

  addSection(section: Section): void {
    const current = this.activeSession();
    this.activeSession.set({ ...current, sections: [...current.sections, section] });
  }

  subtractSection(section: Section): void {
    const current = this.activeSession();
    const sections = current.sections.filter((s) => s !== section);
    this.activeSession.set({ ...current, sections: sections.length > 0 ? sections : ['home'] });
  }
}
