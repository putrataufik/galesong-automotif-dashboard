// =============================
// src/app/core/state/dashboard-state.service.ts
// =============================
import { Injectable, signal, effect, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AppFilter } from '../../types/filter.model';

// === TYPES: KPI ===
export interface KpiSnapshot {
  totalUnitSales: number; // gunakan default 0 agar UI tak perlu null-check
  topModel: { name: string; unit: number } | null;
  topBranch: { code: string; unit: number } | null;
}

// === TYPES: AFTER SALES KPI ===
export interface AfterSalesKpiSnapshot {
  totalRevenueRealisasi: number;
  totalBiayaUsaha: number;
  totalProfit: number;
  totalHariKerja: number;
  serviceCabang: number;
  afterSalesRealisasi: number;
  unitEntryRealisasi: number;
  sparepartTunaiRealisasi: number;
}

// === TYPES: CHARTS ===
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

// === STATE ROOT ===
interface ChartsState {
  lineMonthly: LineMonthlyData | null;
  branchPerformance: ChartDataset | null;
  modelDistribution: PieChartData | null;
  afterSalesRealisasiVsTarget: ChartDataset | null;
  afterSalesProfitByBranch: ChartDataset | null;
}

interface DashboardState {
  filter: AppFilter | null;
  kpi: KpiSnapshot;
  afterSalesKpi: AfterSalesKpiSnapshot;
  charts: ChartsState;
}

// ====== INITIALS ======
const initialKpi: KpiSnapshot = {
  totalUnitSales: 0,
  topModel: null,
  topBranch: null,
};
const initialAfterSalesKpi: AfterSalesKpiSnapshot = {
  totalRevenueRealisasi: 0,
  totalBiayaUsaha: 0,
  totalProfit: 0,
  totalHariKerja: 0,
  serviceCabang: 0,
  afterSalesRealisasi: 0,
  unitEntryRealisasi: 0,
  sparepartTunaiRealisasi: 0,
};
const initialCharts: ChartsState = {
  lineMonthly: null,
  branchPerformance: null,
  modelDistribution: null,
  afterSalesRealisasiVsTarget: null,
  afterSalesProfitByBranch: null,
};
const initialState: DashboardState = {
  filter: null,
  kpi: initialKpi,
  afterSalesKpi: initialAfterSalesKpi,
  charts: initialCharts,
};

// ====== STORAGE CONFIG ======
const STORAGE_KEY = 'dashboardState:v1';

@Injectable({ providedIn: 'root' })
export class DashboardStateService {
  // Single source of truth (mulai dengan initialState; akan di-hydrate di ctor bila di browser)
  private readonly _state = signal<DashboardState>(initialState);

  // Flag SSR/browser
  private readonly isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);

    // Hydrate hanya di browser
    if (this.isBrowser) {
      const saved = this.hydrate();
      if (saved) this._state.set(saved);

      // Persist otomatis setiap perubahan state (per TAB)
      effect(() => {
        const value = this._state();
        try {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
        } catch {
          // ignore: quota penuh / private mode / blocked storage
        }
      });
    }
  }

  // ====== PATCH HELPERS ======
  private patch(partial: Partial<DashboardState>) {
    this._state.update((s) => ({ ...s, ...partial }));
  }
  private patchCharts(partial: Partial<ChartsState>) {
    this._state.update((s) => ({ ...s, charts: { ...s.charts, ...partial } }));
  }
  private patchKpi(partial: Partial<KpiSnapshot>) {
    this._state.update((s) => ({ ...s, kpi: { ...s.kpi, ...partial } }));
  }
  private patchAfterSalesKpi(partial: Partial<AfterSalesKpiSnapshot>) {
    this._state.update((s) => ({ ...s, afterSalesKpi: { ...s.afterSalesKpi, ...partial } }));
  }

  // ====== FILTER ======
  saveFilter(f: AppFilter) { this.patch({ filter: f }); }
  getFilter(): AppFilter | null { return this._state().filter; }

  // ====== SALES KPI ======
  saveKpi(snapshot: Partial<KpiSnapshot>) {
    this.patchKpi({
      totalUnitSales: snapshot.totalUnitSales ?? this._state().kpi.totalUnitSales,
      topModel: snapshot.topModel ?? this._state().kpi.topModel,
      topBranch: snapshot.topBranch ?? this._state().kpi.topBranch,
    });
  }
  hasKpi(): boolean {
    const k = this._state().kpi;
    return k.totalUnitSales > 0 || !!k.topModel || !!k.topBranch;
  }
  getKpi(): KpiSnapshot { return this._state().kpi; }

  // ====== AFTER SALES KPI ======
  saveAfterSalesKpi(snapshot: Partial<AfterSalesKpiSnapshot>) {
    this.patchAfterSalesKpi({
      totalRevenueRealisasi: snapshot.totalRevenueRealisasi ?? this._state().afterSalesKpi.totalRevenueRealisasi,
      totalBiayaUsaha:      snapshot.totalBiayaUsaha      ?? this._state().afterSalesKpi.totalBiayaUsaha,
      totalProfit:          snapshot.totalProfit          ?? this._state().afterSalesKpi.totalProfit,
      totalHariKerja:       snapshot.totalHariKerja       ?? this._state().afterSalesKpi.totalHariKerja,
      serviceCabang:        snapshot.serviceCabang        ?? this._state().afterSalesKpi.serviceCabang,
      afterSalesRealisasi:  snapshot.afterSalesRealisasi  ?? this._state().afterSalesKpi.afterSalesRealisasi,
      unitEntryRealisasi:   snapshot.unitEntryRealisasi   ?? this._state().afterSalesKpi.unitEntryRealisasi,
      sparepartTunaiRealisasi: snapshot.sparepartTunaiRealisasi ?? this._state().afterSalesKpi.sparepartTunaiRealisasi,
    });
  }
  hasAfterSalesKpi(): boolean {
    const a = this._state().afterSalesKpi;
    return a.totalRevenueRealisasi > 0 || a.totalBiayaUsaha > 0 || a.totalProfit > 0 || a.afterSalesRealisasi > 0;
  }
  getAfterSalesKpi(): AfterSalesKpiSnapshot { return this._state().afterSalesKpi; }

  // ====== CHARTS ======
  saveLineMonthly(data: LineMonthlyData | null) { this.patchCharts({ lineMonthly: data }); }
  getLineMonthly(): LineMonthlyData | null { return this._state().charts.lineMonthly; }

  saveBranchPerformance(data: ChartDataset | null) { this.patchCharts({ branchPerformance: data }); }
  getBranchPerformance(): ChartDataset | null { return this._state().charts.branchPerformance; }

  saveModelDistribution(data: PieChartData | null) { this.patchCharts({ modelDistribution: data }); }
  getModelDistribution(): PieChartData | null { return this._state().charts.modelDistribution; }

  saveAfterSalesRealisasiVsTarget(data: ChartDataset | null) { this.patchCharts({ afterSalesRealisasiVsTarget: data }); }
  getAfterSalesRealisasiVsTarget(): ChartDataset | null { return this._state().charts.afterSalesRealisasiVsTarget; }

  saveAfterSalesProfitByBranch(data: ChartDataset | null) { this.patchCharts({ afterSalesProfitByBranch: data }); }
  getAfterSalesProfitByBranch(): ChartDataset | null { return this._state().charts.afterSalesProfitByBranch; }

  // ====== RESET HELPERS ======
  clearSales() {
    this.patchKpi(initialKpi);
    this.patchCharts({ lineMonthly: null, branchPerformance: null, modelDistribution: null });
  }
  clearAfterSales() {
    this.patchAfterSalesKpi(initialAfterSalesKpi);
    this.patchCharts({ afterSalesRealisasiVsTarget: null, afterSalesProfitByBranch: null });
  }
  clearAll() {
    this._state.set(initialState);
    if (this.isBrowser) {
      try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
    }
  }
  // Backward compatibility
  clear() { this.clearAll(); }

  // ====== STORAGE (hydrate) ======
  private hydrate(): DashboardState | null {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<DashboardState>;

      // Minimal validation + defaults agar aman bila versi berubah
      return {
        filter: parsed.filter ?? null,
        kpi: {
          totalUnitSales: parsed.kpi?.totalUnitSales ?? 0,
          topModel: parsed.kpi?.topModel ?? null,
          topBranch: parsed.kpi?.topBranch ?? null,
        },
        afterSalesKpi: {
          totalRevenueRealisasi: parsed.afterSalesKpi?.totalRevenueRealisasi ?? 0,
          totalBiayaUsaha: parsed.afterSalesKpi?.totalBiayaUsaha ?? 0,
          totalProfit: parsed.afterSalesKpi?.totalProfit ?? 0,
          totalHariKerja: parsed.afterSalesKpi?.totalHariKerja ?? 0,
          serviceCabang: parsed.afterSalesKpi?.serviceCabang ?? 0,
          afterSalesRealisasi: parsed.afterSalesKpi?.afterSalesRealisasi ?? 0,
          unitEntryRealisasi: parsed.afterSalesKpi?.unitEntryRealisasi ?? 0,
          sparepartTunaiRealisasi: parsed.afterSalesKpi?.sparepartTunaiRealisasi ?? 0,
        },
        charts: {
          lineMonthly: parsed.charts?.lineMonthly ?? null,
          branchPerformance: parsed.charts?.branchPerformance ?? null,
          modelDistribution: parsed.charts?.modelDistribution ?? null,
          afterSalesRealisasiVsTarget: parsed.charts?.afterSalesRealisasiVsTarget ?? null,
          afterSalesProfitByBranch: parsed.charts?.afterSalesProfitByBranch ?? null,
        },
      };
    } catch {
      return null; // korup/blocked → abaikan agar app tetap jalan
    }
  }
}
