import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Section, Session } from '../../../core/models/session.model';

const TOKEN_KEY    = 'auth-token';
const USERNAME_KEY = 'auth-username';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  readonly activeSession = signal<Session>(this.restoreSession());

  async login(username: string, password: string): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<{ token: string; username: string }>('/api/auth/login', { username, password })
    );
    this.persistSession(res.token, res.username);
  }

  async register(username: string, password: string): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<{ token: string; username: string }>('/api/auth/register', { username, password })
    );
    this.persistSession(res.token, res.username);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
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

  private persistSession(token: string, username: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USERNAME_KEY, username);
    this.activeSession.set({ loggedIn: true, username, sections: ['home'] });
  }

  private restoreSession(): Session {
    const token    = localStorage.getItem(TOKEN_KEY);
    const username = localStorage.getItem(USERNAME_KEY);
    if (token && username) {
      return { loggedIn: true, username, sections: ['home'] };
    }
    return { loggedIn: false, username: '', sections: ['home'] };
  }
}
