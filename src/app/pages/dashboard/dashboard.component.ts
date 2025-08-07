import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';

// Components
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { FilterComponent } from '../../shared/components/filter/filter.component';
import { LineChartCardComponent } from '../../shared/components/line-chart-card/line-chart-card.component';
import { PieChartCardComponent } from '../../shared/components/pie-chart-card/pie-chart-card.component';
import { BarChartCardComponent } from '../../shared/components/bar-chart-card/bar-chart-card.component';

// Services
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardStateService } from '../../core/state/dashboard-state.service';

// Types
import { AppFilter } from '../../types/filter.model';
import { ChartData } from '../../types/sales.model';

// Utils
import {
  processLineChartData,
  processBarChartData,
  processPieChartData,
} from '../../shared/utils/dashboard-chart.utils';

import {
  calculateTotalUnitSales,
  findTopModel,
  findTopBranch,
} from '../../shared/utils/dashboard-kpi.utils';

// Interfaces
interface ApiResponse {
  monthly: any;
  units: any;
  branch: any;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    KpiCardComponent,
    FilterComponent,
    LineChartCardComponent,
    PieChartCardComponent,
    BarChartCardComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  private api = inject(DashboardService);
  private state = inject(DashboardStateService);

  // State signals
  loading = signal(false);
  error = signal<string | null>(null);

  // KPI signals
  kpiTotalUnitSales = signal<number>(0);
  kpiTopModel = signal<{ name: string; unit: number } | null>(null);
  kpiTopBranch = signal<{ code: string; unit: number } | null>(null);

  // Chart signals
  lineMonthly = signal<ChartData | null>(null);
  branchPerformance = signal<ChartData | null>(null);
  modelDistribution = signal<ChartData | null>(null);

  // Filter
  prefilledFilter: AppFilter | null = null;

  // Computed
  get hasData(): boolean {
    return !!(
      this.lineMonthly() ||
      this.branchPerformance() ||
      this.modelDistribution()
    );
  }

  get isDataEmpty(): boolean {
    return !this.hasData && !this.loading();
  }

  ngOnInit(): void {
    this.loadPersistedData();
  }

  onSearch(filter: AppFilter): void {
    this.error.set(null);

    if (!this.isValidCategory(filter.category)) {
      this.error.set('Kategori after-sales belum tersedia');
      return;
    }

    this.prepareForNewSearch(filter);
    this.executeSearch(filter);
  }

  private loadPersistedData(): void {
    this.loadPersistedFilter();
    this.loadPersistedChartData();
    this.loadPersistedKpiData();
  }

  private loadPersistedFilter(): void {
    const savedFilter = this.state.getFilter();
    if (savedFilter) {
      this.prefilledFilter = savedFilter;
    }
  }

  private loadPersistedChartData(): void {
    const savedLine = this.state.getLineMonthly();
    if (savedLine) this.lineMonthly.set(savedLine);

    const savedBranch = this.state.getBranchPerformance();
    if (savedBranch) this.branchPerformance.set(savedBranch);

    const savedPie = this.state.getModelDistribution();
    if (savedPie) this.modelDistribution.set(savedPie);
  }

  private loadPersistedKpiData(): void {
    if (!this.state.hasKpi()) return;

    const savedKpi = this.state.getKpi();
    this.kpiTotalUnitSales.set(savedKpi.totalUnitSales ?? 0);
    this.kpiTopModel.set(savedKpi.topModel);
    this.kpiTopBranch.set(savedKpi.topBranch);
  }

  private isValidCategory(category: string): boolean {
    return category === 'sales' || category === 'all-category';
  }

  private prepareForNewSearch(filter: AppFilter): void {
    this.state.saveFilter(filter);
    this.prefilledFilter = filter;
    this.clearDashboardData();
  }

  private clearDashboardData(): void {
    this.kpiTotalUnitSales.set(0);
    this.kpiTopModel.set(null);
    this.kpiTopBranch.set(null);
    this.lineMonthly.set(null);
    this.branchPerformance.set(null);
    this.modelDistribution.set(null);
  }

  private executeSearch(filter: AppFilter): void {
    this.loading.set(true);

    const apiCalls = this.buildApiCalls(filter);

    forkJoin(apiCalls).subscribe({
      next: (response) => this.processApiResponse(response),
      error: (error) => this.handleApiError(error),
      complete: () => this.loading.set(false),
    });
  }

  private buildApiCalls(filter: AppFilter) {
    return {
      monthly: this.api.getSalesMonthly(filter.company, filter.period),
      units: this.api.getSalesUnits(filter.company, filter.period),
      branch: this.api.getSalesBranch(filter.company, filter.period),
    };
  }

  private processApiResponse(response: ApiResponse): void {
    try {
      const sales = response.units?.sales ?? [];
      const branches = response.branch?.sales ?? [];

      // Line Chart
      const line = processLineChartData(response.monthly);
      if (line) {
        this.lineMonthly.set(line);
        this.state.saveLineMonthly(line);
      }

      // Pie Chart
      const pie = processPieChartData(response.units);
      if (pie) {
        this.modelDistribution.set(pie);
        this.state.saveModelDistribution(pie);
      }

      // Bar Chart
      const cabangMap = this.api.getCabangNameMap();
      const branchChart = processBarChartData(response.branch, cabangMap);
      if (branchChart) {
        this.branchPerformance.set(branchChart);
        this.state.saveBranchPerformance(branchChart);
      }

      // KPI
      const totalUnitSales = calculateTotalUnitSales(sales);
      const topModel = findTopModel(sales);
      const topBranch = findTopBranch(branches, this.api.getCabangName.bind(this.api));

      this.kpiTotalUnitSales.set(totalUnitSales);
      this.kpiTopModel.set(topModel);
      this.kpiTopBranch.set(topBranch);
      this.state.saveKpi({ totalUnitSales, topModel, topBranch });

    } catch (error) {
      console.error('Error processing API response:', error);
      this.error.set('Gagal memproses data. Silakan coba lagi.');
    }
  }

  private handleApiError(error: any): void {
    console.error('Dashboard API Error:', error);
    this.error.set('Gagal memuat data. Silakan coba lagi.');
    this.loading.set(false);
  }
}
