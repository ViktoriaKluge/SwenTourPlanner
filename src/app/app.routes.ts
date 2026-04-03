import { Routes } from '@angular/router';
import { HomeComponent } from './features/tours/home/home';
import { AboutComponent } from './features/about/about';
import { LoginComponent } from './features/auth/login/login';

export const routes: Routes = [
    {
        path: '',
        component: HomeComponent,
    },
    {
        path: '**',
        redirectTo: '',
    },
];
