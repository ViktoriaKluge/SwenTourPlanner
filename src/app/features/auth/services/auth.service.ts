import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Section, Session } from '../../../core/models/session.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  readonly activeSession = signal<Session>({
    loggedIn: false,
    username: '',
    sections: ['home'],
  });

  async login(username: string, password: string): Promise<void> {
    await firstValueFrom(this.http.post('/api/auth/login', { username, password }));
    this.activeSession.set({ loggedIn: true, username, sections: ['home'] });
  }

  async register(username: string, password: string): Promise<void> {
    await firstValueFrom(this.http.post('/api/auth/register', { username, password }));
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
