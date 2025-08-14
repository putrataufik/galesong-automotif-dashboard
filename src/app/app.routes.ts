import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/main-dashboard.component').then(m => m.MainDashboardComponent),
    title: 'Dashboard - Galesong Automotif'
  },
  {
    path: 'financial-tracking',
    loadComponent: () => import('./pages/financial-tracking/financial-tracking.component').then(m => m.FinancialTrackingComponent),
    title: 'Financial Tracking - Galesong Automotif'
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];