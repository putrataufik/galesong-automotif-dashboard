// src/app/pages/dashboard/charts/chart-config.ts
import { Observable } from 'rxjs';
import { DashboardService } from '../../../shared/services/dashboard.service';

export type ChartKey =
  | 'revenueExpenseData'
  | 'targetRealizationData'
  | 'salesAfterSalesData'
  | 'branchPerformanceData';

export interface Filters {
  company: string;
  branch: string;    // 'all-branch' | specific code
  category: string;  // 'all-category' | 'sales' | 'after-sales'
}

export interface ChartConfig {
  key: ChartKey;
  shouldLoad: (f: Filters) => boolean;
  loader: (svc: DashboardService, f: Filters, force: boolean) => Observable<any[]>;
  clearWhenHidden?: boolean; // default true
}

export const chartConfigs: ChartConfig[] = [
  {
    key: 'revenueExpenseData',
    shouldLoad: () => true,
    loader: (svc, f, force) => svc.getRevenueExpenseChartData(f, force),
  },
  {
    key: 'salesAfterSalesData',
    shouldLoad: (f) => f.category === 'all-category',
    loader: (svc, f, force) => svc.getSalesAfterSalesChartData(f, force),
  },
  {
    key: 'branchPerformanceData',
    shouldLoad: (f) => f.branch === 'all-branch',
    loader: (svc, f, force) => svc.getBranchPerformanceChartData(f, force),
  },
  {
    key: 'targetRealizationData',
    shouldLoad: (f) => f.category === 'after-sales',
    loader: (svc, f, force) => svc.getTargetRealizationChartData(f, force),
  },
];
