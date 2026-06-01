import { Component, inject } from '@angular/core';
import { HeaderComponent } from '../header/header';
import { AuthService } from '../../features/auth/services/auth.service';
import { AboutComponent } from '../../features/about/about';
import { LoginComponent } from '../../features/auth/login/login';
import { ToursPageComponent } from '../../features/tours/tours-page/tours-page';
import { TourFormComponent } from '../../features/tours/tour-form/tour-form';
import { TourViewModelService } from '../../features/tours/view-model/tour-view-model.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [HeaderComponent, AboutComponent, LoginComponent, ToursPageComponent, TourFormComponent],
  templateUrl: './shell.html',
  styleUrls: ['./shell.css'],
})
export class ShellComponent {
  private readonly auth  = inject(AuthService);
  protected readonly tourState = inject(TourViewModelService);

  readonly session      = this.auth.activeSession;
  readonly isAddingTour = this.tourState.isAddingTour;

  goToLogin(): void {
    this.auth.setActiveSection('login');
  }
}
