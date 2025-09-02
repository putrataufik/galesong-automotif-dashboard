import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/main-dashboard/main-dashboard.component').then(
        (m) => m.MainDashboardComponent
      ),
    title: 'Dashboard - Galesong Automotif',
  },
  {
    path: 'after-sales-dashboard',
    loadComponent: () =>
      import(
        './pages/after-sales-dashboard/after-sales-dashboard.component'
      ).then((m) => m.AfterSalesDashboardComponent),
  },
  {
    path: 'sales-dashboard',
    loadComponent: () =>
      import('./pages/sales-dashboard/sales-dashboard.component').then(
        (m) => m.SalesDashboardComponent
      ),
  },
  {
    path: 'finance-dashboard',
    loadComponent: () =>
      import('./pages/finance-dashboard/finance-dashboard.component').then(
        (m) => m.FinanceDashboardComponent
      ),
  },
  { path: '**', redirectTo: 'dashboard' },
];
