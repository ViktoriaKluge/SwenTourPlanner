import { Component, computed, inject, input, signal } from '@angular/core';
import { TourViewModelService } from '../../view-model/tour-view-model.service';
import { TourLog } from '../../models/tour.model';
import { TourLogFormComponent } from '../tour-log-form/tour-log-form';

@Component({
  selector: 'app-tour-log-list',
  standalone: true,
  imports: [TourLogFormComponent],
  templateUrl: './tour-log-list.html',
  styleUrls: ['./tour-log-list.css'],
})
export class TourLogListComponent {
  readonly tourId = input.required<string>();
  readonly logs   = input<TourLog[]>([]);

  readonly matchingIds = computed(() => {
    const q = this.state.searchText().trim().toLowerCase();
    if (!q) return new Set<string>();
    return new Set(
      this.logs()
        .filter(l => `${l.comment} ${l.difficulty} ${l.rating} ${l.totalDistance} ${l.totalTime}`.toLowerCase().includes(q))
        .map(l => l.id)
    );
  });

  private readonly state = inject(TourViewModelService);

  readonly addingLog  = signal(false);
  readonly editingLog = signal<TourLog | null>(null);
  readonly logError   = signal<string | null>(null);

  openAdd(): void {
    this.addingLog.set(true);
    this.editingLog.set(null);
  }

  startEdit(log: TourLog): void {
    this.editingLog.set(log);
    this.addingLog.set(false);
  }

  closeForm(): void {
    this.addingLog.set(false);
    this.editingLog.set(null);
  }

  async saveLog(log: TourLog): Promise<void> {
    try {
      if (this.editingLog()) {
        await this.state.updateLog(this.tourId(), log);
      } else {
        await this.state.addLog(this.tourId(), log);
      }
      this.logError.set(null);
      this.closeForm();
    } catch {
      this.logError.set('Log konnte nicht gespeichert werden. Bitte Backend und Datenbank prüfen.');
    }
  }

  async deleteLog(logId: string): Promise<void> {
    try {
      await this.state.deleteLog(this.tourId(), logId);
      this.logError.set(null);
    } catch {
      this.logError.set('Log konnte nicht gelöscht werden. Bitte Backend und Datenbank prüfen.');
    }
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('de-AT', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  }

  stars(n: number): string {
    return '★'.repeat(n) + '☆'.repeat(5 - n);
  }

  difficultyLabel(n: number): string {
    return ['', 'Einfach', 'Leicht', 'Mittel', 'Schwer', 'Sehr schwer'][n] ?? `${n}`;
  }
}
