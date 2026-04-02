import { Component, inject } from '@angular/core';
import { AppStateService} from '../app-state';
import { Category } from '../app-types';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  templateUrl: './sidebar.html',
  styleUrls: ['./../app.css', './sidebar.css']
})
export class SidebarComponent {
  private readonly state = inject(AppStateService);

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
