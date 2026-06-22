import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then(m => m.LoginComponent),
  },
  {
    path: 'rsvp/:token',
    loadComponent: () => import('./features/rsvp/rsvp').then(m => m.RsvpComponent),
  },
  {
    path: '',
    loadComponent: () => import('./layout/app-shell/app-shell').then(m => m.AppShellComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then(m => m.DashboardComponent),
      },
      {
        path: 'guests',
        loadComponent: () => import('./features/guests/guests').then(m => m.GuestsComponent),
      },
      {
        path: 'seating',
        loadComponent: () => import('./features/seating/seating').then(m => m.SeatingComponent),
      },
      {
        path: 'budget',
        loadComponent: () => import('./features/budget/budget').then(m => m.BudgetComponent),
      },
      {
        path: 'suppliers',
        loadComponent: () => import('./features/suppliers/suppliers').then(m => m.SuppliersComponent),
      },
      {
        path: 'tasks',
        loadComponent: () => import('./features/tasks/tasks').then(m => m.TasksComponent),
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings').then(m => m.SettingsComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
