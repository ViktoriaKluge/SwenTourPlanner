import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Tour } from '../models/tour.model';

const CATEGORY_META: Record<string, { icon: string; label: string }> = {
  hike: { icon: 'W', label: 'Wandern' },
  run: { icon: 'L', label: 'Laufen' },
  bike: { icon: 'R', label: 'Radfahren' },
};

@Component({
  selector: 'app-tour-card',
  standalone: true,
  templateUrl: './tour-card.html',
  styleUrls: ['./tour-card.css'],
})
export class TourCardComponent {
  @Input({ required: true }) tour!: Tour;
  @Input({ required: true, transform: (v: unknown) => Boolean(v) }) active!: boolean;
  @Output() select = new EventEmitter<Tour>();

  get meta() {
    return CATEGORY_META[this.tour.category] ?? { icon: 'T', label: this.tour.category };
  }

  choose(): void {
    this.select.emit(this.tour);
  }
}
