// src/app/pages/dashboard/dashboard.component.ts
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';

import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { FilterComponent } from '../../shared/components/filter/filter.component';
import { RevenueExpenseBarChartComponent } from '../../shared/components/charts/revenue-expense-barchart/revenue-expense-barchart.component';
import { TargetRealizationBarChartComponent } from '../../shared/components/charts/target-realization-barchart/target-realization-barchart.component';
import { SalesAftersalesLinechartComponent } from '../../shared/components/charts/sales-aftersales-linechart/sales-aftersales-linechart.component';
import { BranchPerformanceBarChartComponent } from '../../shared/components/charts/branch-performance-barchart/branch-performance-barchart.component';
import { DashboardService } from '../../shared/services/dashboard.service';

type ChartKey =
  | 'revenueExpenseData'
  | 'targetRealizationData'
  | 'salesAfterSalesData'
  | 'branchPerformanceData';

interface Filters {
  company: string;
  branch: string;   // 'all-branch' | kode cabang
  category: string; // 'all-category' | 'sales' | 'after-sales'
}

interface ChartConfig {
  key: ChartKey;
  title: string;
  component: 'app-revenue-expense-barchart'
           | 'app-target-realization-barchart'
           | 'app-sales-aftersales-linechart'
           | 'app-branch-performance-barchart';
  shouldLoad: (f: Filters) => boolean;
  loader: (f: Filters, force: boolean) => Observable<any[]>;
  clearWhenHidden?: boolean; // default true
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FilterComponent,
    KpiCardComponent,
    RevenueExpenseBarChartComponent,
    TargetRealizationBarChartComponent,
    SalesAftersalesLinechartComponent,
    BranchPerformanceBarChartComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  // ---- State Data
  kpiData: any[] = [];
  revenueExpenseData: any[] = [];
  targetRealizationData: any[] = [];
  salesAfterSalesData: any[] = [];
  branchPerformanceData: any[] = [];

  loading = false;
  currentFilters: Partial<Filters> = {};

  // ---- Chart Configs (tambah chart baru tinggal tambah item di sini)
  chartConfigs: ChartConfig[] = [
    {
      key: 'revenueExpenseData',
      title: 'Pendapatan vs Pengeluaran',
      component: 'app-revenue-expense-barchart',
      shouldLoad: () => true,
      loader: (f, force) => this.dashboardService.getRevenueExpenseChartData(f, force),
    },
    {
      key: 'targetRealizationData',
      title: 'Target vs Realisasi After Sales',
      component: 'app-target-realization-barchart',
      shouldLoad: (f) => f.category === 'after-sales',
      loader: (f, force) => this.dashboardService.getTargetRealizationChartData(f, force),
    },
    {
      key: 'salesAfterSalesData',
      title: 'Omzet Sales vs Omzet After Sales',
      component: 'app-sales-aftersales-linechart',
      shouldLoad: (f) => f.category === 'all-category',
      loader: (f, force) => this.dashboardService.getSalesAfterSalesChartData(f, force),
    },
    {
      key: 'branchPerformanceData',
      title: 'Performa Cabang Berdasarkan Omzet',
      component: 'app-branch-performance-barchart',
      shouldLoad: (f) => f.branch === 'all-branch',
      loader: (f, force) => this.dashboardService.getBranchPerformanceChartData(f, force),
    },
  ];

  constructor(
    private dashboardService: DashboardService,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  // ---- Lifecycle
  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('dashboardFilter');
      if (saved) {
        try {
          const filter: Filters = JSON.parse(saved);
          this.currentFilters = filter;
          this.loadDashboardData(filter, false);
        } catch {
          // ignore parse errors
        }
      }
    }
  }

  // ---- Public API (dipanggil dari <app-filter>)
  onSearch(filters: Filters) {
    this.loadDashboardData(filters, true); // force refresh saat user klik Cari
  }

  // ---- Loader utama (DRY + forkJoin agar loading selesai serentak)
  private loadDashboardData(filters: Filters, forceRefresh = false) {
    this.loading = true;
    this.currentFilters = filters;

    const tasks: Observable<any>[] = [];

    // KPI selalu dimuat
    tasks.push(
      this.dashboardService.getKpiData(filters, forceRefresh).pipe(
        tap((d) => (this.kpiData = d)),
        catchError(() => {
          this.kpiData = [];
          return of([]);
        })
      )
    );

    // Chart by config
    for (const cfg of this.chartConfigs) {
      if (cfg.shouldLoad(filters)) {
        tasks.push(
          cfg.loader(filters, forceRefresh).pipe(
            tap((d) => ((this as any)[cfg.key] = d)),
            catchError(() => {
              (this as any)[cfg.key] = [];
              return of([]);
            })
          )
        );
      } else if (cfg.clearWhenHidden !== false) {
        (this as any)[cfg.key] = [];
      }
    }

    forkJoin(tasks)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe();
  }

  // ---- Helpers untuk template (menghindari penggunaan `this[...]` langsung di HTML)
  hasData(key: ChartKey): boolean {
    const v = (this as any)[key];
    return Array.isArray(v) && v.length > 0;
  }
  getData<T = any>(key: ChartKey): T[] {
    return (this as any)[key] ?? [];
  }

  // ---- Helpers untuk show/hide chart tertentu (kalau template lama masih pakai ini)
  hasAnyChartData(): boolean {
    return (
      this.revenueExpenseData.length > 0 ||
      this.targetRealizationData.length > 0 ||
      this.salesAfterSalesData.length > 0 ||
      this.branchPerformanceData.length > 0
    );
  }
  shouldShowTargetRealizationChart(): boolean {
    return (this.currentFilters.category as string) === 'after-sales';
  }
  shouldShowSalesAfterSalesChart(): boolean {
    return (this.currentFilters.category as string) === 'all-category';
  }
  shouldShowBranchPerformanceChart(): boolean {
    return (this.currentFilters.branch as string) === 'all-branch';
  }

  // Opsional util debug
  debugCache() {
    this.dashboardService.getCacheStatus();
  }
  clearCache() {
    this.dashboardService.clearAllCache();
  }
}
