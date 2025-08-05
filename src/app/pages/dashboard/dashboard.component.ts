// src/app/pages/dashboard/dashboard.component.ts
import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { FilterComponent } from '../../shared/components/filter/filter.component';
import { RevenueExpenseBarChartComponent } from '../../shared/components/charts/revenue-expense-barchart/revenue-expense-barchart.component';
import { TargetRealizationBarChartComponent } from '../../shared/components/charts/target-realization-barchart/target-realization-barchart.component';
import { SalesAftersalesLinechartComponent } from '../../shared/components/charts/sales-aftersales-linechart/sales-aftersales-linechart.component';
import { BranchPerformanceBarChartComponent } from '../../shared/components/charts/branch-performance-barchart/branch-performance-barchart.component';
import { DashboardService } from '../../shared/services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    KpiCardComponent,
    FilterComponent,
    RevenueExpenseBarChartComponent,
    TargetRealizationBarChartComponent,
    SalesAftersalesLinechartComponent,
    BranchPerformanceBarChartComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  kpiData: any[] = [];
  revenueExpenseData: any[] = [];
  targetRealizationData: any[] = [];
  salesAfterSalesData: any[] = [];
  branchPerformanceData: any[] = [];
  loading = false;
  currentFilters: any = {};

  constructor(
    private dashboardService: DashboardService,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const savedFilter = localStorage.getItem('dashboardFilter');

      if (savedFilter) {
        const filter = JSON.parse(savedFilter);
        this.currentFilters = filter;

        // Load KPI data
        this.dashboardService.getKpiData(filter, false).subscribe((data) => {
          if (data && data.length > 0) {
            this.kpiData = data;
          }
        });

        // Load Revenue vs Expense chart data
        this.dashboardService
          .getRevenueExpenseChartData(filter)
          .subscribe((data) => {
            console.log('Initial Revenue Expense Data:', data);
            this.revenueExpenseData = data;
          });

        // Load Target vs Realization chart data (HANYA untuk after-sales)
        if (filter.category === 'after-sales') {
          this.dashboardService
            .getTargetRealizationChartData(filter)
            .subscribe((data) => {
              console.log('Initial Target Realization Data:', data);
              this.targetRealizationData = data;
            });
        }
      }
    }
  }

  onSearch(filters: any) {
    this.loading = true;
    this.currentFilters = filters;

    // Load KPI data
    this.dashboardService.getKpiData(filters, true).subscribe({
      next: (data) => {
        console.log('KPI Data:', data);
        this.kpiData = data;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });

    // Load Revenue vs Expense chart data (always show)
    this.dashboardService.getRevenueExpenseChartData(filters).subscribe({
      next: (data) => {
        console.log('Revenue Expense Data received:', data);
        this.revenueExpenseData = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading revenue expense data:', err);
        this.loading = false;
      },
    });
    // Load Sales vs After Sales chart data (hanya untuk all-category)
    if (filters.category === 'all-category') {
      this.dashboardService.getSalesAfterSalesChartData(filters).subscribe({
        next: (data) => {
          console.log('Sales After Sales Data received:', data);
          this.salesAfterSalesData = data;
        },
        error: (err) => {
          console.error('Error loading sales after sales data:', err);
          this.salesAfterSalesData = [];
        },
      });
    } else {
      this.salesAfterSalesData = [];
    }

    // Load Branch Performance chart data (hanya untuk all-branch)
    if (filters.branch === 'all-branch') {
      this.dashboardService.getBranchPerformanceChartData(filters).subscribe({
        next: (data) => {
          console.log('Branch Performance Data received:', data);
          this.branchPerformanceData = data;
        },
        error: (err) => {
          console.error('Error loading branch performance data:', err);
          this.branchPerformanceData = [];
        },
      });
    } else {
      this.branchPerformanceData = [];
    }

    // Load Target vs Realization chart data (HANYA untuk after-sales)
    if (filters.category === 'after-sales') {
      this.dashboardService.getTargetRealizationChartData(filters).subscribe({
        next: (data) => {
          console.log('Target Realization Data received:', data);
          this.targetRealizationData = data;
        },
        error: (err) => {
          console.error('Error loading target realization data:', err);
          this.targetRealizationData = [];
        },
      });
    } else {
      // Clear target realization data jika bukan after-sales
      this.targetRealizationData = [];
    }
  }

  // Ganti semua helper methods di dashboard.component.ts dengan yang ini:

  // Simple helper to check if any chart data exists
  hasAnyChartData(): boolean {
    return (
      this.revenueExpenseData.length > 0 ||
      this.targetRealizationData.length > 0 ||
      this.salesAfterSalesData.length > 0 ||
      this.branchPerformanceData.length > 0
    );
  }

  // Keep existing conditional logic simple (optional - can remove if not needed)
  shouldShowTargetRealizationChart(): boolean {
    return this.currentFilters.category === 'after-sales';
  }

  shouldShowSalesAfterSalesChart(): boolean {
    return this.currentFilters.category === 'all-category';
  }

  shouldShowBranchPerformanceChart(): boolean {
    return this.currentFilters.branch === 'all-branch';
  }
}
