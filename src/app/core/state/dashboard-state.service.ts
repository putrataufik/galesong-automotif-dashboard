import { Injectable, signal } from '@angular/core';
import type { AppFilter } from '../../pages/dashboard/dashboard.component';

// === INTERFACE: KPI ===
export interface KpiSnapshot {
  totalUnitSales: number | null;
  topModel: { name: string; unit: number } | null;
  topBranch: { code: string; unit: number } | null;
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

  // === KPI ===
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

  // === CHART: LINE (Trend Penjualan Bulanan) ===
  readonly lineMonthly = signal<LineMonthlyData | null>(null);

  saveLineMonthly(data: LineMonthlyData) {
    this.lineMonthly.set(data);
  }

  getLineMonthly(): LineMonthlyData | null {
    return this.lineMonthly();
  }

  // === CHART: DONUT (Proporsi Unit Terjual per Model) ===
  readonly unitProportion = signal<ChartDataset | null>(null);

  saveUnitProportion(data: ChartDataset) {
    this.unitProportion.set(data);
  }

  getUnitProportion(): ChartDataset | null {
    return this.unitProportion();
  }

  // === CHART: BAR (Performa Penjualan per Cabang) ===
  readonly branchPerformance = signal<ChartDataset | null>(null);

  saveBranchPerformance(data: ChartDataset) {
    this.branchPerformance.set(data);
  }

  getBranchPerformance(): ChartDataset | null {
    return this.branchPerformance();
  }

  // === RESET STATE ===
  clear() {
    this.filter.set(null);
    this.totalUnitSales.set(null);
    this.topModel.set(null);
    this.topBranch.set(null);
    this.lineMonthly.set(null);
    this.unitProportion.set(null);
    this.branchPerformance.set(null);
  }
}
