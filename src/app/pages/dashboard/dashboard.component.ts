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
import { AfterSalesResponse } from '../../types/aftersales.model';

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

import {
  calculateAfterSalesKpi,
  AfterSalesKpiData,
  formatCompactNumber,
} from '../../shared/utils/dashboard-aftersales-kpi.utils';

// Interfaces
interface ApiResponse {
  monthly: any;
  units: any;
  branch: any;
  aftersales?: any;
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

  // expose util ke template
  formatCompactNumber = formatCompactNumber;

  // State signals
  loading = signal(false);
  error = signal<string | null>(null);

  // KPI signals
  kpiTotalUnitSales = signal<number>(0);
  kpiTopModel = signal<{ name: string; unit: number } | null>(null);
  kpiTopBranch = signal<{ code: string; unit: number } | null>(null);
  afterSalesKpi = signal<AfterSalesKpiData | null>(null);

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
      this.modelDistribution() ||
      this.afterSalesKpi()
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
    this.loadPersistedAfterSalesKpiData();
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

  private loadPersistedAfterSalesKpiData(): void {
    if (!this.state.hasAfterSalesKpi()) return;

    const savedAfterSalesKpi = this.state.getAfterSalesKpi();
    this.afterSalesKpi.set(savedAfterSalesKpi); // ← Simplified karena sudah tidak ada null
  }

  private isValidCategory(category: string): boolean {
    return category === 'sales' ||
      category === 'all-category' ||
      category === 'after-sales'; // ← TAMBAH INI
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
    this.afterSalesKpi.set(null); // ← TAMBAH INI
  }

  private executeSearch(filter: AppFilter): void {
    this.loading.set(true);

    const apiCalls = this.buildApiCalls(filter);

    forkJoin(apiCalls).subscribe({
      next: (response: any) => this.processApiResponse(response),
      error: (error) => this.handleApiError(error),
      complete: () => this.loading.set(false),
    });
  }

  private buildApiCalls(filter: AppFilter) {
    const apiCalls: any = {};

    if (filter.category === 'sales' || filter.category === 'all-category') {
      apiCalls.monthly = this.api.getSalesMonthly(filter.company, filter.period);
      apiCalls.units = this.api.getSalesUnits(filter.company, filter.period);
      apiCalls.branch = this.api.getSalesBranch(filter.company, filter.period);
    }

    // ← TAMBAH INI
    if (filter.category === 'after-sales' || filter.category === 'all-category') {
      apiCalls.aftersales = this.api.getAfterSalesMonthly(filter.company, filter.period);
    }

    return apiCalls;
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

      // Sales KPI
      const totalUnitSales = calculateTotalUnitSales(sales);
      const topModel = findTopModel(sales);
      const topBranch = findTopBranch(branches, this.api.getCabangName.bind(this.api));

      this.kpiTotalUnitSales.set(totalUnitSales || 0); // ← Ensure never null
      this.kpiTopModel.set(topModel);
      this.kpiTopBranch.set(topBranch);
      this.state.saveKpi({
        totalUnitSales: totalUnitSales || 0, // ← Ensure never null
        topModel,
        topBranch
      });

      // ← TAMBAH INI - After Sales data processing
      if (response.aftersales) {
        const aftersalesData = response.aftersales?.aftersales ?? [];
        const afterSalesKpiData = calculateAfterSalesKpi(aftersalesData);
        console.log('totalRevenueRealisasi response:', afterSalesKpiData.totalRevenueRealisasi);
        console.log('Total Profit response:', afterSalesKpiData.totalProfit);
        console.log('coba format compact revenue: ', formatCompactNumber(afterSalesKpiData.totalRevenueRealisasi));
        console.log('coba format compact profit : ', formatCompactNumber(afterSalesKpiData.totalProfit));
        this.afterSalesKpi.set(afterSalesKpiData);
        this.state.saveAfterSalesKpi({
          totalRevenueRealisasi: afterSalesKpiData.totalRevenueRealisasi,
          totalBiayaUsaha: afterSalesKpiData.totalBiayaUsaha,
          totalProfit: afterSalesKpiData.totalProfit,
          totalHariKerja: afterSalesKpiData.totalHariKerja,
          serviceCabang: afterSalesKpiData.serviceCabang,
          afterSalesRealisasi: afterSalesKpiData.afterSalesRealisasi,
          unitEntryRealisasi: afterSalesKpiData.unitEntryRealisasi,
          sparepartTunaiRealisasi: afterSalesKpiData.sparepartTunaiRealisasi,
        });
      }

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
