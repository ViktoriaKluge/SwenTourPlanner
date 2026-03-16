import { Routes } from '@angular/router';
import { HomeComponent } from './home/home';
import { AboutComponent } from './about/about';
import { LoginComponent } from './login/login';

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
