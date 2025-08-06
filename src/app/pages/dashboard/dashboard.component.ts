// src/app/pages/dashboard/dashboard.component.ts
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';

// < KPI Components
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
// KPI Components />

// < Filter Component
import { FilterComponent } from '../../shared/components/filter/filter.component';
// Filter Component />

// < Chart Components
import { RevenueExpenseBarChartComponent } from '../../shared/components/charts/revenue-expense-barchart/revenue-expense-barchart.component';
import { TargetRealizationBarChartComponent } from '../../shared/components/charts/target-realization-barchart/target-realization-barchart.component';
import { SalesAftersalesLinechartComponent } from '../../shared/components/charts/sales-aftersales-linechart/sales-aftersales-linechart.component';
import { BranchPerformanceBarChartComponent } from '../../shared/components/charts/branch-performance-barchart/branch-performance-barchart.component';
import { SalesOmzetLinechartComponent } from '../../shared/components/charts/sales-omzet-linechart/sales-omzet-linechart.component';
import { AfterSalesOmzetLinechartComponent } from '../../shared/components/charts/after-sales-omzet-linechart/after-sales-omzet-linechart.component';
// Chart Component />

// < Services
import { DashboardService } from '../../shared/services/dashboard.service';
// Services />

type ChartKey =
  | 'revenueExpenseData'
  | 'targetRealizationData'
  | 'salesAfterSalesData'
  | 'branchPerformanceData'
  | 'salesOmzetData'
  | 'afterSalesOmzetData';

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
           | 'app-branch-performance-barchart'
           | 'app-sales-omzet-linechart'
           | 'app-after-sales-omzet-linechart';
  shouldLoad: (f: Filters) => boolean;
  loader: (f: Filters) => Observable<any[]>;
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
    SalesOmzetLinechartComponent,
    AfterSalesOmzetLinechartComponent,
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
  salesOmzetData: any[] = [];
  afterSalesOmzetData: any[] = [];

  loading = false;
  currentFilters: Partial<Filters> = {};

  // ---- Chart Configs (tambah chart baru tinggal tambah item di sini)
  chartConfigs: ChartConfig[] = [
    {
      key: 'revenueExpenseData',
      title: 'Pendapatan vs Pengeluaran',
      component: 'app-revenue-expense-barchart',
      shouldLoad: () => true,
      loader: (f) => this.dashboardService.getRevenueExpenseChartData(f),
    },
    {
      key: 'targetRealizationData',
      title: 'Target vs Realisasi After Sales',
      component: 'app-target-realization-barchart',
      shouldLoad: (f) => f.category === 'after-sales',
      loader: (f) => this.dashboardService.getTargetRealizationChartData(f),
    },
    {
      key: 'salesAfterSalesData',
      title: 'Omzet Sales vs Omzet After Sales',
      component: 'app-sales-aftersales-linechart',
      shouldLoad: (f) => f.category === 'all-category',
      loader: (f) => this.dashboardService.getSalesAfterSalesChartData(f),
    },
    {
      key: 'branchPerformanceData',
      title: 'Performa Cabang Berdasarkan Omzet',
      component: 'app-branch-performance-barchart',
      shouldLoad: (f) => f.branch === 'all-branch',
      loader: (f) => this.dashboardService.getBranchPerformanceChartData(f),
    },
    {
      key: 'salesOmzetData',
      title: 'Trend Omzet Sales',
      component: 'app-sales-omzet-linechart',
      shouldLoad: (f) => f.category === 'sales',
      loader: (f) => this.dashboardService.getSalesOnlyChartData(f),
    },
    {
      key: 'afterSalesOmzetData',
      title: 'Trend Omzet After Sales',
      component: 'app-after-sales-omzet-linechart',
      shouldLoad: (f) => f.category === 'after-sales',
      loader: (f) => this.dashboardService.getAfterSalesOnlyChartData(f),
    }
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
          this.loadDashboardData(filter);
        } catch {
          // ignore parse errors
        }
      }
    }
  }

  // ---- Public API (dipanggil dari <app-filter>)
  onSearch(filters: Filters) {
    this.loadDashboardData(filters);
  }

  // ---- Loader utama (DRY + forkJoin agar loading selesai serentak)
  private loadDashboardData(filters: Filters) {
    this.loading = true;
    this.currentFilters = filters;

    const tasks: Observable<any>[] = [];

    // KPI selalu dimuat
    tasks.push(
      this.dashboardService.getKpiData(filters, true).pipe(
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
          cfg.loader(filters).pipe(
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
      this.branchPerformanceData.length > 0 ||
      this.salesOmzetData.length > 0 ||
      this.afterSalesOmzetData.length > 0
    );
  }
}