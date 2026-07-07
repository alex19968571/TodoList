import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    loadComponent: () => import('./features/layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'today', pathMatch: 'full' },
      { path: 'today',   loadComponent: () => import('./features/today/today.component').then(m => m.TodayComponent) },
      { path: 'week',    loadComponent: () => import('./features/week/week.component').then(m => m.WeekComponent) },
      { path: 'calendar',loadComponent: () => import('./features/calendar/calendar.component').then(m => m.CalendarComponent) },
      { path: 'groups',  loadComponent: () => import('./features/group-tasks/group-tasks.component').then(m => m.GroupTasksComponent) },
      { path: 'settings',loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent) },
    ]
  },
  { path: '**', redirectTo: '' }
];
