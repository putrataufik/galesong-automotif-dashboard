import { Injectable, signal } from '@angular/core';
import { AfterSalesFilter, AppFilter } from '../../types/filter.model';

export interface KpiSnapshot {
  totalUnitSales: number | null;
  topModel: { name: string; unit: number } | null;
  topBranch: { code: string; unit: number } | null;
}

export interface AfterSalesKpiSnapshot {
  totalRevenueRealisasi: number;
  totalBiayaUsaha: number;
  totalProfit: number;
  totalHariKerja: number;
  serviceCabang: number;
  afterSalesRealisasi: number;
  afterSalesTarget: number;
  unitEntryRealisasi: number;
  sparepartTunaiRealisasi: number;
}

export interface LineMonthlyData { labels: string[]; data: number[]; }
export interface ChartDataset { labels: string[]; data: number[]; }
export interface PieChartData { labels: string[]; data: number[]; colors?: string[]; }

@Injectable({ providedIn: 'root' })
export class DashboardStateService {
  /* ====== FILTERS ====== */
  readonly filter = signal<AppFilter | null>(null);
  saveFilter(f: AppFilter) { this.filter.set(f); }
  getFilter(): AppFilter | null { return this.filter(); }

  private afterSalesFilter = signal<AfterSalesFilter | null>(null);
  saveFilterAfterSales(f: AfterSalesFilter) { this.afterSalesFilter.set(f); }
  getFilterAfterSales(): AfterSalesFilter | null { return this.afterSalesFilter(); }

  /* ====== SALES KPI ====== */
  readonly totalUnitSales = signal<number | null>(null);
  readonly topModel = signal<{ name: string; unit: number } | null>(null);
  readonly topBranch = signal<{ code: string; unit: number } | null>(null);

  saveKpi(s: KpiSnapshot) {
    this.totalUnitSales.set(s.totalUnitSales);
    this.topModel.set(s.topModel);
    this.topBranch.set(s.topBranch);
  }
  hasKpi(): boolean {
    return this.totalUnitSales() !== null || this.topModel() !== null || this.topBranch() !== null;
  }
  getKpi(): KpiSnapshot {
    return {
      totalUnitSales: this.totalUnitSales(),
      topModel: this.topModel(),
      topBranch: this.topBranch(),
    };
  }

  /* ====== AFTER SALES KPI ====== */
  readonly totalRevenueRealisasi = signal<number | null>(null);
  readonly totalBiayaUsaha = signal<number | null>(null);
  readonly totalProfit = signal<number | null>(null);
  readonly totalHariKerja = signal<number | null>(null);
  readonly serviceCabang = signal<number | null>(null);
  readonly afterSalesRealisasi = signal<number | null>(null);
  readonly afterSalesTarget = signal<number | null>(null);
  readonly unitEntryRealisasi = signal<number | null>(null);
  readonly sparepartTunaiRealisasi = signal<number | null>(null);

  saveAfterSalesKpi(s: AfterSalesKpiSnapshot) {
    this.totalRevenueRealisasi.set(s.totalRevenueRealisasi);
    this.totalBiayaUsaha.set(s.totalBiayaUsaha);
    this.totalProfit.set(s.totalProfit);
    this.totalHariKerja.set(s.totalHariKerja);
    this.serviceCabang.set(s.serviceCabang);
    this.afterSalesRealisasi.set(s.afterSalesRealisasi);
    this.afterSalesTarget.set(s.afterSalesTarget);
    this.unitEntryRealisasi.set(s.unitEntryRealisasi);
    this.sparepartTunaiRealisasi.set(s.sparepartTunaiRealisasi);
  }

  hasAfterSalesKpi(): boolean {
    return (
      this.totalRevenueRealisasi() !== null ||
      this.totalBiayaUsaha() !== null ||
      this.totalProfit() !== null ||
      this.afterSalesRealisasi() !== null ||
      this.afterSalesTarget() !== null
    );
  }

  getAfterSalesKpi(): AfterSalesKpiSnapshot {
    return {
      totalRevenueRealisasi: this.totalRevenueRealisasi() ?? 0,
      totalBiayaUsaha: this.totalBiayaUsaha() ?? 0,
      totalProfit: this.totalProfit() ?? 0,
      totalHariKerja: this.totalHariKerja() ?? 0,
      serviceCabang: this.serviceCabang() ?? 0,
      afterSalesRealisasi: this.afterSalesRealisasi() ?? 0,
      afterSalesTarget: this.afterSalesTarget() ?? 0,
      unitEntryRealisasi: this.unitEntryRealisasi() ?? 0,
      sparepartTunaiRealisasi: this.sparepartTunaiRealisasi() ?? 0,
    };
  }

  /* ====== CHARTS ====== */
  readonly lineMonthly = signal<LineMonthlyData | null>(null);
  readonly branchPerformance = signal<ChartDataset | null>(null);
  readonly modelDistribution = signal<PieChartData | null>(null);
  readonly afterSalesRealisasiVsTarget = signal<ChartDataset | null>(null);
  readonly afterSalesProfitByBranch = signal<ChartDataset | null>(null);

  saveLineMonthly(d: LineMonthlyData) { this.lineMonthly.set({ labels: [...d.labels], data: [...d.data] }); }
  getLineMonthly(): LineMonthlyData | null { return this.lineMonthly(); }

  saveBranchPerformance(d: ChartDataset) { this.branchPerformance.set({ labels: [...d.labels], data: [...d.data] }); }
  getBranchPerformance(): ChartDataset | null { return this.branchPerformance(); }

  saveModelDistribution(d: PieChartData) { this.modelDistribution.set({ labels: [...d.labels], data: [...d.data], colors: d.colors ? [...d.colors] : undefined }); }
  getModelDistribution(): PieChartData | null { return this.modelDistribution(); }

  saveAfterSalesRealisasiVsTarget(d: ChartDataset) { this.afterSalesRealisasiVsTarget.set({ labels: [...d.labels], data: [...d.data] }); }
  getAfterSalesRealisasiVsTarget(): ChartDataset | null { return this.afterSalesRealisasiVsTarget(); }

  saveAfterSalesProfitByBranch(d: ChartDataset) { this.afterSalesProfitByBranch.set({ labels: [...d.labels], data: [...d.data] }); }
  getAfterSalesProfitByBranch(): ChartDataset | null { return this.afterSalesProfitByBranch(); }

  /* ====== CLEAR HELPERS ====== */
  clearAfterSales() {
    // filter after-sales
    this.afterSalesFilter.set(null);

    // KPI
    this.totalRevenueRealisasi.set(null);
    this.totalBiayaUsaha.set(null);
    this.totalProfit.set(null);
    this.totalHariKerja.set(null);
    this.serviceCabang.set(null);
    this.afterSalesRealisasi.set(null);
    this.afterSalesTarget.set(null);          // ← DULU TERLEWAT
    this.unitEntryRealisasi.set(null);
    this.sparepartTunaiRealisasi.set(null);

    // Charts
    this.afterSalesRealisasiVsTarget.set(null);
    this.afterSalesProfitByBranch.set(null);
  }

  clear() {
    // global filter
    this.filter.set(null);
    // sales kpi & charts
    this.totalUnitSales.set(null);
    this.topModel.set(null);
    this.topBranch.set(null);
    this.lineMonthly.set(null);
    this.branchPerformance.set(null);
    this.modelDistribution.set(null);

    // after-sales semuanya
    this.clearAfterSales();
  }
}
