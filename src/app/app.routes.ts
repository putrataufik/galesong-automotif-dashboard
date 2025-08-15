import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/main-dashboard/main-dashboard.component').then(m => m.MainDashboardComponent),
    title: 'Dashboard - Galesong Automotif'
  },
  {
    path: 'after-sales-dashboard',
    loadComponent:() => import('./pages/after-sales-dashboard/after-sales-dashboard.component').then(m => m.AfterSalesDashboardComponent),
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