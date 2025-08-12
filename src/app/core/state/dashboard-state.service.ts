import { Injectable, signal } from '@angular/core';
import { AppFilter } from '../../types/filter.model';

// === INTERFACE: KPI ===
export interface KpiSnapshot {
  totalUnitSales: number | null;
  topModel: { name: string; unit: number } | null;
  topBranch: { code: string; unit: number } | null;

}

// === INTERFACE: AFTER SALES KPI ===
// === INTERFACE: AFTER SALES KPI ===
export interface AfterSalesKpiSnapshot {
  totalRevenueRealisasi: number;  // ← Hapus | null
  totalBiayaUsaha: number;       // ← Hapus | null
  totalProfit: number;           // ← Hapus | null
  totalHariKerja: number;        // ← Hapus | null
  serviceCabang: number;         // ← Hapus | null
  afterSalesRealisasi: number;   // ← Hapus | null
  unitEntryRealisasi: number;    // ← Hapus | null
  sparepartTunaiRealisasi: number; // ← Hapus | null
}

// === INTERFACE: CHARTS ===
export interface LineMonthlyData {
  labels: string[];
  data: number[];
}

export interface ChartDataset {
  labels: string[];
  data: number[];
}

export interface PieChartData {
  labels: string[];
  data: number[];
  colors?: string[];
}

@Injectable({ providedIn: 'root' })
export class DashboardStateService {
  // === FILTER ===
  readonly filter = signal<AppFilter | null>(null);

  saveFilter(f: AppFilter) {
    this.filter.set(f);
  }

  getFilter(): AppFilter | null {
    return this.filter();
  }

  // === Sales KPI ===
  readonly totalUnitSales = signal<number | null>(null);
  readonly topModel = signal<{ name: string; unit: number } | null>(null);
  readonly topBranch = signal<{ code: string; unit: number } | null>(null);

  saveKpi(snapshot: KpiSnapshot) {
    this.totalUnitSales.set(snapshot.totalUnitSales);
    this.topModel.set(snapshot.topModel);
    this.topBranch.set(snapshot.topBranch);
  }

  hasKpi(): boolean {
    return (
      this.totalUnitSales() !== null ||
      this.topModel() !== null ||
      this.topBranch() !== null
    );
  }

  getKpi(): KpiSnapshot {
    return {
      totalUnitSales: this.totalUnitSales(),
      topModel: this.topModel(),
      topBranch: this.topBranch(),
    };
  }

  // === AFTER SALES KPI ===
  readonly totalRevenueRealisasi = signal<number | null>(null);
  readonly totalBiayaUsaha = signal<number | null>(null);
  readonly totalProfit = signal<number | null>(null);
  readonly totalHariKerja = signal<number | null>(null);
  readonly serviceCabang = signal<number | null>(null);
  readonly afterSalesRealisasi = signal<number | null>(null);
  readonly unitEntryRealisasi = signal<number | null>(null);
  readonly sparepartTunaiRealisasi = signal<number | null>(null);

  saveAfterSalesKpi(snapshot: AfterSalesKpiSnapshot) {
    this.totalRevenueRealisasi.set(snapshot.totalRevenueRealisasi);
    this.totalBiayaUsaha.set(snapshot.totalBiayaUsaha);
    this.totalProfit.set(snapshot.totalProfit);
    this.totalHariKerja.set(snapshot.totalHariKerja);
    this.serviceCabang.set(snapshot.serviceCabang);
    this.afterSalesRealisasi.set(snapshot.afterSalesRealisasi);
    this.unitEntryRealisasi.set(snapshot.unitEntryRealisasi);
    this.sparepartTunaiRealisasi.set(snapshot.sparepartTunaiRealisasi);
  }

  hasAfterSalesKpi(): boolean {
    return (
      this.totalRevenueRealisasi() !== null ||
      this.totalBiayaUsaha() !== null ||
      this.totalProfit() !== null ||
      this.afterSalesRealisasi() !== null
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
      unitEntryRealisasi: this.unitEntryRealisasi() ?? 0,
      sparepartTunaiRealisasi: this.sparepartTunaiRealisasi() ?? 0,
    };
  }

  // === CHART: LINE (Trend Penjualan Bulanan) ===
  readonly lineMonthly = signal<LineMonthlyData | null>(null);

  saveLineMonthly(data: LineMonthlyData) {
    this.lineMonthly.set(data);
  }

  getLineMonthly(): LineMonthlyData | null {
    return this.lineMonthly();
  }

  // === CHART: BAR (Performa Penjualan per Cabang) ===
  readonly branchPerformance = signal<ChartDataset | null>(null);

  saveBranchPerformance(data: ChartDataset) {
    this.branchPerformance.set(data);
  }

  getBranchPerformance(): ChartDataset | null {
    return this.branchPerformance();
  }


  // === CHART: PIE  CHART (Distribusi Model Paling Laku)

  readonly modelDistribution = signal<PieChartData | null>(null);

  saveModelDistribution(data: PieChartData) {
    this.modelDistribution.set(data);
  }

  getModelDistribution(): PieChartData | null {
    return this.modelDistribution();
  }

  // === AFTER SALES REALISASI VS TARGET ===
  readonly afterSalesRealisasiVsTarget = signal<ChartDataset | null>(null);
  saveAfterSalesRealisasiVsTarget(data: ChartDataset) {
    this.afterSalesRealisasiVsTarget.set(data);
  }
  getAfterSalesRealisasiVsTarget(): ChartDataset | null {
    return this.afterSalesRealisasiVsTarget();
  }

  // === AFTER SALES PROFIT BY BRANCH ===
  readonly afterSalesProfitByBranch = signal<ChartDataset | null>(null);
  
  saveAfterSalesProfitByBranch(data: ChartDataset) {
    this.afterSalesProfitByBranch.set(data);
  }
  getAfterSalesProfitByBranch(): ChartDataset | null {
    const data = this.afterSalesProfitByBranch();
  return data;
  }
  // === RESET STATE ===
  clear() {
    this.filter.set(null);
    this.totalUnitSales.set(null);
    this.topModel.set(null);
    this.topBranch.set(null);
    this.lineMonthly.set(null);
    this.branchPerformance.set(null);
    this.modelDistribution.set(null);

    this.totalRevenueRealisasi.set(null);
    this.totalBiayaUsaha.set(null);
    this.totalProfit.set(null);
    this.totalHariKerja.set(null);
    this.serviceCabang.set(null);
    this.afterSalesRealisasi.set(null);
    this.unitEntryRealisasi.set(null);
    this.sparepartTunaiRealisasi.set(null);
    this.afterSalesRealisasiVsTarget.set(null);
    this.afterSalesProfitByBranch.set(null);
  }
}