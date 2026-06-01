import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

const THEME_KEY = 'tour-planner-dark-mode';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  readonly darkMode = signal(localStorage.getItem(THEME_KEY) === 'true');

  constructor() {
    this.apply(this.darkMode());
  }

  toggle(): void {
    const next = !this.darkMode();
    this.darkMode.set(next);
    localStorage.setItem(THEME_KEY, String(next));
    this.apply(next);
  }

  private apply(enabled: boolean): void {
    this.document.body.classList.toggle('dark-mode', enabled);
  }
}
