import { Component, inject } from '@angular/core';
import { TourStateService } from '../state/tour-state.service';
import { Category } from '../models/tour.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  templateUrl: './sidebar.html',
  styleUrls: ['../../../app.css', './sidebar.css']
})
export class SidebarComponent {
  private readonly state = inject(TourStateService);

  readonly categories: { id: Category; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'hike', label: 'Hike' },
    { id: 'run', label: 'Run' },
    { id: 'bike', label: 'Bike' },
  ];

  readonly selected = this.state.selectedCategory;

  setCategory(cat: Category): void {
    this.state.setCategory(cat);
  }
}
