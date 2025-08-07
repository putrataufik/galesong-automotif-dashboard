import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';

// Components
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { FilterComponent } from '../../shared/components/filter/filter.component';
import { LineChartCardComponent } from '../../shared/components/line-chart-card/line-chart-card.component';

// Services
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardStateService } from '../../core/state/dashboard-state.service';

// Types
import { AppFilter } from '../../types/filter.model';

// Interfaces
interface ChartData {
  labels: string[];
  data: number[];
}

interface KpiData {
  totalUnitSales: number;
  topModel: { name: string; unit: number } | null;
  topBranch: { code: string; unit: number } | null;
}

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
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  private readonly MONTH_LABELS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ] as const;

  private readonly CHART_COLORS = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6b7280',
  ] as const;

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

  // Filter
  prefilledFilter: AppFilter | null = null;

  // Computed properties
  get hasData(): boolean {
    return !!(
      this.lineMonthly() ||
      this.branchPerformance()
    );
  }

  get isDataEmpty(): boolean {
    return !this.hasData && !this.loading();
  }

  get chartColors(): readonly string[] {
    return this.CHART_COLORS;
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
    // Line chart data
    const savedLine = this.state.getLineMonthly();
    if (savedLine) {
      this.lineMonthly.set(savedLine);
    }

    // Branch performance data
    const savedBranchPerformance = this.state.getBranchPerformance();
    if (savedBranchPerformance) {
      this.branchPerformance.set(savedBranchPerformance);
    }
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
      this.processLineChartData(response.monthly);
      this.processKpiData(response.units, response.branch);
      this.processBarChartData(response.branch);
    } catch (error) {
      console.error('Error processing API response:', error);
      this.error.set('Gagal memproses data. Silakan coba lagi.');
    }
  }

  private processLineChartData(monthlyData: any): void {
    const sales = monthlyData?.sales ?? [];
    if (!sales.length) return;

    const sortedMonths = [...sales]
      .sort((a, b) => Number(a.month) - Number(b.month));

    const labels = sortedMonths.map(month => 
      this.getMonthLabel(month.month)
    );
    const data = sortedMonths.map(month => Number(month.unit_sold));

    const lineChart = { labels, data };
    this.lineMonthly.set(lineChart);
    this.state.saveLineMonthly(lineChart);
  }

  private getMonthLabel(monthNumber: string): string {
    const monthIndex = Math.max(1, Math.min(12, Number(monthNumber))) - 1;
    return this.MONTH_LABELS[monthIndex];
  }

  private processKpiData(unitsData: any, branchData: any): void {
    const sales = unitsData?.sales ?? [];
    const branches = branchData?.sales ?? [];

    // Calculate total unit sales
    const totalUnitSales = this.calculateTotalUnitSales(sales);
    this.kpiTotalUnitSales.set(totalUnitSales);

    // Find top model
    const topModel = this.findTopModel(sales);
    this.kpiTopModel.set(topModel);

    // Find top branch
    const topBranch = this.findTopBranch(branches);
    this.kpiTopBranch.set(topBranch);

    // Persist KPI data
    this.state.saveKpi({
      totalUnitSales,
      topModel,
      topBranch,
    });
  }

  private calculateTotalUnitSales(sales: any[]): number {
    return sales
      .map(unit => Number(unit.unit_sold))
      .reduce((total, current) => total + current, 0);
  }

  private findTopModel(sales: any[]): { name: string; unit: number } | null {
    if (!sales.length) return null;

    const topModel = sales.reduce(
      (best, current) => 
        Number(current.unit_sold) > best.unit
          ? { name: current.unit_name, unit: Number(current.unit_sold) }
          : best,
      { name: '', unit: -1 }
    );

    return topModel.unit >= 0 ? topModel : null;
  }

  private findTopBranch(branches: any[]): { code: string; unit: number } | null {
    if (!branches.length) return null;

    const topBranch = branches.reduce(
      (best, current) => 
        Number(current.unit_sold) > best.unit
          ? { code: current.branch, unit: Number(current.unit_sold) }
          : best,
      { code: '', unit: -1 }
    );

    if (topBranch.unit < 0) return null;

    return {
      code: this.api.getCabangName(topBranch.code),
      unit: topBranch.unit,
    };
  }

  private processBarChartData(branchData: any): void {
    const sales = branchData?.sales ?? [];
    const cabangMap = this.api.getCabangNameMap();

    const branchChart: ChartData = {
      labels: sales.map((branch: any) => 
        cabangMap[branch.branch] || branch.branch
      ),
      data: sales.map((branch: any) => Number(branch.unit_sold)),
    };

    this.branchPerformance.set(branchChart);
    this.state.saveBranchPerformance(branchChart);
  }

  private handleApiError(error: any): void {
    console.error('Dashboard API Error:', error);
    this.error.set('Gagal memuat data. Silakan coba lagi.');
    this.loading.set(false);
  }
}