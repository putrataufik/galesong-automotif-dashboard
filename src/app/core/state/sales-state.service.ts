// src/app/core/state/sales-state.service.ts
import { Injectable, signal, effect, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/* ============================================================
   TYPES — UI-ready (selaras dengan SalesApiService.getSalesKpiView)
   ============================================================ */

export type UiKpiPoint = { value: number; period: string };
export type UiKpiBranchPoint = UiKpiPoint & {
  code: string;
  branchName: string;
};
export type UiKpiModelPoint = UiKpiPoint & { name: string };

export interface UiKpis {
  totalUnitSales?: {
    selected?: UiKpiPoint;
    prevMonth?: UiKpiPoint;
    prevYear?: UiKpiPoint;
    prevDate?: UiKpiPoint;
  };
  totalSPK?: {
    selected?: UiKpiPoint;
    prevMonth?: UiKpiPoint;
    prevYear?: UiKpiPoint;
    prevDate?: UiKpiPoint;
  };
  totalDO?: {
    selected?: UiKpiPoint;
    prevMonth?: UiKpiPoint;
    prevYear?: UiKpiPoint;
    prevDate?: UiKpiPoint;
  };
  totalProspek?: {
    selected?: UiKpiPoint;
    prevMonth?: UiKpiPoint;
    prevYear?: UiKpiPoint;
    prevDate?: UiKpiPoint;
  };
  totalHotProspek?: {
    selected?: UiKpiPoint;
    prevMonth?: UiKpiPoint;
    prevYear?: UiKpiPoint;
    prevDate?: UiKpiPoint;
  };
  topBranch?: {
    selected?: UiKpiBranchPoint;
    prevMonth?: UiKpiBranchPoint;
    prevYear?: UiKpiBranchPoint;
    prevDate?: UiKpiBranchPoint;
  };
  topModel?: {
    selected?: UiKpiModelPoint;
    prevMonth?: UiKpiModelPoint;
    prevYear?: UiKpiModelPoint;
    prevDate?: UiKpiModelPoint;
  };
}

export type ComparisonPeriod = 'prevMonth' | 'prevYear' | 'prevDate';

export interface KpiComparison {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  period: string; // current period label (formatted)
  previousPeriod: string; // previous period label (formatted)
}

export interface ModelComparison {
  current: { name: string; value: number };
  previous: { name: string; value: number };
  period: string;
  previousPeriod: string;
}

export interface BranchComparison {
  current: { code: string; name: string; value: number };
  previous: { code: string; name: string; value: number };
  period: string;
  previousPeriod: string;
}

/** Filter yang dikirim ke API */
export interface SalesFilter {
  companyId: string;
  branchId: string; // 'all-branch' atau kode cabang
  useCustomDate: boolean; // true => pakai selectedDate
  compare: boolean;
  year: string | null; // saat useCustomDate=false
  month: string | null; // '01'..'12' atau null (year-only)
  selectedDate: string | null; // YYYY-MM-DD saat useCustomDate=true
}

/** Snapshot KPI (UI-ready) yang disimpan di state */
export type SalesKpiSnapshot<TKpis = UiKpis> = {
  request: any;
  kpis: TKpis;
  timestamp: number;
};

/* ============================================================
   TYPES — RAW GRAFIK yang disimpan di state
   ============================================================ */

// Bentuk dataset yang datang dari endpoint trend/dovsspk
export type RawTrendDataset = { label: string; data: number[] };

/** Sales Trend Monthly */
export interface SalesTrendMonthlySnapshot {
  key: string; // cache key (company-year-compare)
  companyId: string;
  year: string;
  compare: boolean;
  datasets: RawTrendDataset[]; // RAW from API
  timestamp: number;
}

/** DO vs SPK Monthly */
export interface DoVsSpkMonthlySnapshot {
  key: string; // cache key (company-year)
  companyId: string;
  year: string;
  datasets: RawTrendDataset[]; // RAW from API
  timestamp: number;
}

/** Model Distribution Monthly (current/prevMonth/prevYear) */
export interface ModelDistributionItem {
  name: string;
  value: number;
}
export interface ModelDistributionBlock {
  period: string; // e.g. "2025-09"
  label: string; // e.g. "Sep 2025"
  items: ModelDistributionItem[];
}
export interface ModelDistributionMonthlySnapshot {
  key: string; // cache key (company-year-month-compare)
  companyId: string;
  year: string; // "2025"
  month: string; // "01".."12"
  compare: boolean;
  current?: ModelDistributionBlock;
  prevMonth?: ModelDistributionBlock;
  prevYear?: ModelDistributionBlock;
  timestamp: number;
}

/* ============================================================
   NEW TYPES — STOCK UNIT RAW (disimpan di state)
   ============================================================ */

export interface RawStockUnitDetail {
  tglsjln: string;
  kgudang: string;
  thnprod: string;
  warna: string;
  hargabeli: string;
  ngudang: string;
  tymotor: string;
  notes: string;
}
export interface RawStockUnitGroup {
  kgudang: string;
  ngudang: string;
  count: number;
  detail: RawStockUnitDetail[];
}
export interface StockUnitRawResponse {
  status: string;
  message: string;
  data: RawStockUnitGroup[];
}

/** Snapshot Stock Unit RAW */
export interface StockUnitRawSnapshot {
  key: string; // cache key (single / per company)
  data: RawStockUnitGroup[]; // simpan array group (hemat tapi tetap RAW)
  status: string;
  message: string;
  timestamp: number;
}

/* ============================================================
   STATE ROOT
   ============================================================ */

export interface SalesState {
  filter: SalesFilter | null;
  kpiData: SalesKpiSnapshot | null;

  // NEW: grafik
  trendMonthly: SalesTrendMonthlySnapshot | null;
  doVsSpkMonthly: DoVsSpkMonthlySnapshot | null;
  modelDistributionMonthly: ModelDistributionMonthlySnapshot | null;

  doByBranch: DoByBranchSnapshot | null;
  // NEW: stock unit RAW
  stockUnitRaw: StockUnitRawSnapshot | null;

  lastUpdated: number | null;
}

/* =============== NEW — DO BY BRANCH (UI-ready) =============== */

export interface UiDoByBranchItem {
  branchName: string;
  code: string;
  value: number;
}
export interface UiDoByBranchBlock {
  period: string;
  label: string;
  items: UiDoByBranchItem[];
}

export interface DoByBranchSnapshot {
  key: string; // cache key unik
  companyId: string;
  branchId: string; // ikutkan untuk keamanan, walau biasanya 'all-branch'
  useCustomDate: boolean;
  compare: boolean;
  year: string | null;
  month: string | null; // selalu 2 digit atau null
  selectedDate: string | null;

  current?: UiDoByBranchBlock;
  prevMonth?: UiDoByBranchBlock;
  prevYear?: UiDoByBranchBlock;

  timestamp: number;
}

/* ============================================================
   DEFAULTS
   ============================================================ */

export const defaultSalesFilter: SalesFilter = {
  companyId: 'sinar-galesong-mobilindo',
  branchId: 'all-branch',
  useCustomDate: true,
  compare: true,
  year: null,
  month: null, // null = year-only
  selectedDate: new Date().toISOString().slice(0, 10),
};

export const initialSalesState: SalesState = {
  filter: defaultSalesFilter,
  kpiData: null,

  trendMonthly: null,
  doVsSpkMonthly: null,
  modelDistributionMonthly: null,

  doByBranch: null,

  stockUnitRaw: null, // NEW

  lastUpdated: null,
};

/* ============================================================
   BRANCH MAP (standalone, tanpa dependency service lain)
   ============================================================ */
const CABANG_NAME_MAP: Readonly<Record<string, string>> = {
  '0050': 'PETTARANI',
  '0051': 'PALU',
  '0052': 'KENDARI',
  '0053': 'GORONTALO',
  '0054': 'PALOPO',
  '0055': 'SUNGGUMINASA',
} as const;

function getCabangName(code: string): string {
  return CABANG_NAME_MAP[code] ?? code;
}

/* ============================================================
   STORAGE CONFIG
   ============================================================ */
const STORAGE_KEY = 'salesState:v1'; // tetap pakai v1 agar kompatibel; struktur baru di-handle di hydrate

/* ============================================================
   SERVICE
   ============================================================ */

@Injectable({ providedIn: 'root' })
export class SalesStateService {
  // Single source of truth
  private readonly _state = signal<SalesState>(initialSalesState);

  // SSR/browser flag
  private readonly isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);

    // Hydrate hanya di browser
    if (this.isBrowser) {
      const saved = this.hydrate();
      if (saved) this._state.set(saved);

      // Persist otomatis setiap perubahan state
      effect(() => {
        const value = this._state();
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
        } catch {
          // ignore: quota penuh / private mode / blocked storage
        }
      });
    }
  }

  /* =============== PATCH HELPERS =============== */
  private patch(partial: Partial<SalesState>) {
    this._state.update((s) => ({
      ...s,
      ...partial,
      lastUpdated: Date.now(),
    }));
  }

  /* =============== FILTER MANAGEMENT =============== */

  saveFilter(filter: SalesFilter) {
    this.patch({ filter });
  }

  getFilter(): SalesFilter | null {
    return this._state().filter;
  }

  getCurrentFilter(): SalesFilter {
    // Pastikan konsisten: month dua digit jika ada
    const f = this._state().filter ?? defaultSalesFilter;
    const month = f.month == null ? null : String(f.month).padStart(2, '0');
    return { ...f, month };
  }

  clearFilter() {
    this.patch({ filter: null });
  }

  updateFilterField<K extends keyof SalesFilter>(
    field: K,
    value: SalesFilter[K]
  ) {
    const currentFilter = this.getCurrentFilter();
    this.saveFilter({
      ...currentFilter,
      [field]: value,
    });
  }

  /* =============== KPI DATA MANAGEMENT =============== */

  saveKpiData(kpiSnapshot: SalesKpiSnapshot) {
    this.patch({ kpiData: kpiSnapshot });
  }

  getKpiData(): SalesKpiSnapshot | null {
    return this._state().kpiData;
  }

  getKpis(): UiKpis | null {
    const kd = this._state().kpiData;
    return kd ? (kd.kpis as UiKpis) : null;
  }

  hasKpiData(): boolean {
    return !!this._state().kpiData;
  }

  clearKpiData() {
    this.patch({ kpiData: null });
  }

  /* =============== KPI COMPARISON HELPERS =============== */

  getKpiComparison(
    metricType:
      | 'totalUnitSales'
      | 'totalSPK'
      | 'totalDO'
      | 'totalProspek'
      | 'totalHotProspek',
    comparisonPeriod: ComparisonPeriod
  ): KpiComparison | null {
    const kpis = this.getKpis();
    if (!kpis) return null;

    const metric: any = (kpis as any)[metricType];
    if (!metric?.selected || !metric[comparisonPeriod]) return null;

    const current = Number(metric.selected.value ?? 0);
    const previous = Number(metric[comparisonPeriod]!.value ?? 0);
    const change = current - previous;
    const changePercent =
      previous === 0 ? (current === 0 ? 0 : 100) : (change / previous) * 100;

    return {
      current,
      previous,
      change,
      changePercent,
      period: String(metric.selected.period ?? ''),
      previousPeriod: String(metric[comparisonPeriod]!.period ?? ''),
    };
  }

  getTopModelComparison(
    comparisonPeriod: ComparisonPeriod
  ): ModelComparison | null {
    const kpis = this.getKpis();
    if (!kpis?.topModel?.selected || !kpis.topModel[comparisonPeriod])
      return null;

    const sel = kpis.topModel.selected!;
    const prev = kpis.topModel[comparisonPeriod]!;

    return {
      current: { name: String(sel.name ?? ''), value: Number(sel.value ?? 0) },
      previous: {
        name: String(prev.name ?? ''),
        value: Number(prev.value ?? 0),
      },
      period: String(sel.period ?? ''),
      previousPeriod: String(prev.period ?? ''),
    };
  }

  getTopBranchComparison(
    comparisonPeriod: ComparisonPeriod
  ): BranchComparison | null {
    const kpis = this.getKpis();
    if (!kpis?.topBranch?.selected || !kpis.topBranch[comparisonPeriod])
      return null;

    const sel = kpis.topBranch.selected!;
    const prev = kpis.topBranch[comparisonPeriod]!;

    return {
      current: {
        code: String(sel.code ?? ''),
        name: getCabangName(String(sel.code ?? '')),
        value: Number(sel.value ?? 0),
      },
      previous: {
        code: String(prev.code ?? ''),
        name: getCabangName(String(prev.code ?? '')),
        value: Number(prev.value ?? 0),
      },
      period: String(sel.period ?? ''),
      previousPeriod: String(prev.period ?? ''),
    };
  }

  /* =============== QUICK KPIs (MoM growth) =============== */

  getTotalUnitSalesGrowth(): number | null {
    const c = this.getKpiComparison('totalUnitSales', 'prevMonth');
    return c ? c.changePercent : null;
  }
  getTotalSPKGrowth(): number | null {
    const c = this.getKpiComparison('totalSPK', 'prevMonth');
    return c ? c.changePercent : null;
  }
  getTotalDOGrowth(): number | null {
    const c = this.getKpiComparison('totalDO', 'prevMonth');
    return c ? c.changePercent : null;
  }
  getTotalProspekGrowth(): number | null {
    const c = this.getKpiComparison('totalProspek', 'prevMonth');
    return c ? c.changePercent : null;
  }
  getTotalHotProspekGrowth(): number | null {
    const c = this.getKpiComparison('totalHotProspek', 'prevMonth');
    return c ? c.changePercent : null;
  }

  /* =============== NEW — GRAFIK: SALES TREND MONTHLY =============== */

  private buildTrendMonthlyKey(
    companyId: string,
    year: string,
    compare: boolean
  ) {
    return `trend_${companyId}_${year}_${compare}`;
  }

  saveTrendMonthly(
    snap: Omit<SalesTrendMonthlySnapshot, 'key' | 'timestamp'> & {
      timestamp?: number;
    }
  ) {
    const key = this.buildTrendMonthlyKey(
      snap.companyId,
      snap.year,
      snap.compare
    );
    const full: SalesTrendMonthlySnapshot = {
      ...snap,
      key,
      timestamp: snap.timestamp ?? Date.now(),
    };
    this.patch({ trendMonthly: full });
  }

  getTrendMonthly(): SalesTrendMonthlySnapshot | null {
    return this._state().trendMonthly ?? null;
  }

  clearTrendMonthly() {
    this.patch({ trendMonthly: null });
  }

  isTrendCacheValid(
    companyId: string,
    year: string,
    compare: boolean
  ): boolean {
    const t = this._state().trendMonthly;
    if (!t) return false;
    return t.key === this.buildTrendMonthlyKey(companyId, year, compare);
  }

  /* =============== NEW — GRAFIK: DO vs SPK MONTHLY =============== */

  private buildDoVsSpkKey(companyId: string, year: string) {
    return `dovsspk_${companyId}_${year}`;
  }

  saveDoVsSpkMonthly(
    snap: Omit<DoVsSpkMonthlySnapshot, 'key' | 'timestamp'> & {
      timestamp?: number;
    }
  ) {
    const key = this.buildDoVsSpkKey(snap.companyId, snap.year);
    const full: DoVsSpkMonthlySnapshot = {
      ...snap,
      key,
      timestamp: snap.timestamp ?? Date.now(),
    };
    this.patch({ doVsSpkMonthly: full });
  }

  getDoVsSpkMonthly(): DoVsSpkMonthlySnapshot | null {
    return this._state().doVsSpkMonthly ?? null;
  }

  clearDoVsSpkMonthly() {
    this.patch({ doVsSpkMonthly: null });
  }

  isDoVsSpkCacheValid(companyId: string, year: string): boolean {
    const d = this._state().doVsSpkMonthly;
    if (!d) return false;
    return d.key === this.buildDoVsSpkKey(companyId, year);
  }

  /* =============== NEW — GRAFIK: MODEL DISTRIBUTION MONTHLY =============== */

  private buildModelDistKey(
    companyId: string,
    year: string,
    month: string,
    compare: boolean
  ) {
    const mm = String(month).padStart(2, '0');
    return `modeldist_${companyId}_${year}_${mm}_${compare}`;
  }

  saveModelDistributionMonthly(
    snap: Omit<ModelDistributionMonthlySnapshot, 'key' | 'timestamp'> & {
      timestamp?: number;
    }
  ) {
    const key = this.buildModelDistKey(
      snap.companyId,
      snap.year,
      snap.month,
      snap.compare
    );
    const full: ModelDistributionMonthlySnapshot = {
      ...snap,
      key,
      timestamp: snap.timestamp ?? Date.now(),
    };
    this.patch({ modelDistributionMonthly: full });
  }

  getModelDistributionMonthly(): ModelDistributionMonthlySnapshot | null {
    return this._state().modelDistributionMonthly ?? null;
  }

  clearModelDistributionMonthly() {
    this.patch({ modelDistributionMonthly: null });
  }

  isModelDistributionCacheValid(
    companyId: string,
    year: string,
    month: string,
    compare: boolean
  ): boolean {
    const m = this._state().modelDistributionMonthly;
    if (!m) return false;
    return m.key === this.buildModelDistKey(companyId, year, month, compare);
  }

  /* =============== NEW — STOCK UNIT RAW (no params) =============== */

  // NOTE: jika nanti stok perlu per-company, ganti implementasi key ini.
  private buildStockKey(companyId?: string) {
    // return `stock_${companyId ?? 'all'}`; // versi per-company
    return 'stock_all'; // versi single/global
  }

  saveStockUnitRaw(resp: StockUnitRawResponse, companyId?: string) {
    const snap: StockUnitRawSnapshot = {
      key: this.buildStockKey(companyId),
      data: Array.isArray(resp?.data) ? resp.data : [],
      status: String(resp?.status ?? ''),
      message: String(resp?.message ?? ''),
      timestamp: Date.now(),
    };
    this.patch({ stockUnitRaw: snap });
  }

  getStockUnitRaw(): StockUnitRawSnapshot | null {
    return this._state().stockUnitRaw ?? null;
  }

  clearStockUnitRaw() {
    this.patch({ stockUnitRaw: null });
  }

  isStockUnitCacheValid(companyId?: string): boolean {
    const s = this._state().stockUnitRaw;
    if (!s) return false;
    return s.key === this.buildStockKey(companyId);
  }

  /* =============== NEW — DO BY BRANCH CACHE =============== */

  private buildDoByBranchKey(f: SalesFilter) {
    const mm = f.month == null ? 'null' : String(f.month).padStart(2, '0');
    // Sertakan semua komponen filter yang memengaruhi hasil
    return [
      'dobranch',
      f.companyId,
      f.branchId ?? 'all-branch',
      f.useCustomDate,
      f.compare,
      f.year ?? 'null',
      mm,
      f.selectedDate ?? 'null',
    ].join('_');
  }

  saveDoByBranch(
    snap: Omit<DoByBranchSnapshot, 'key' | 'timestamp'> & { timestamp?: number }
  ) {
    const key = this.buildDoByBranchKey({
      companyId: snap.companyId,
      branchId: snap.branchId,
      useCustomDate: snap.useCustomDate,
      compare: snap.compare,
      year: snap.year,
      month: snap.month,
      selectedDate: snap.selectedDate,
    });
    const full: DoByBranchSnapshot = {
      ...snap,
      key,
      timestamp: snap.timestamp ?? Date.now(),
    };
    this.patch({ doByBranch: full });
  }

  getDoByBranch(): DoByBranchSnapshot | null {
    return this._state().doByBranch ?? null;
  }

  clearDoByBranch() {
    this.patch({ doByBranch: null });
  }

  isDoByBranchCacheValid(filter: SalesFilter): boolean {
    const d = this._state().doByBranch;
    if (!d) return false;
    return d.key === this.buildDoByBranchKey(filter);
  }

  /* =============== EXECUTIVE SUMMARY-LIKE SNAPSHOT =============== */

  getCurrentPeriodSummary(): {
    totalUnitSales: number;
    totalSPK: number;
    totalDO: number;
    totalProspek: number;
    totalHotProspek: number;
    topModel: string;
    topBranch: string;
    period: string;
  } | null {
    const kpis = this.getKpis();
    if (!kpis?.totalUnitSales?.selected) return null;

    const topModelName = kpis.topModel?.selected?.name ?? 'N/A';
    const topBranchCode = kpis.topBranch?.selected?.code ?? 'N/A';

    return {
      totalUnitSales: Number(kpis.totalUnitSales.selected.value ?? 0),
      totalSPK: Number(kpis.totalSPK?.selected?.value ?? 0),
      totalDO: Number(kpis.totalDO?.selected?.value ?? 0),
      totalProspek: Number(kpis.totalProspek?.selected?.value ?? 0),
      totalHotProspek: Number(kpis.totalHotProspek?.selected?.value ?? 0),
      topModel: topModelName,
      topBranch: getCabangName(String(topBranchCode)),
      period: String(kpis.totalUnitSales.selected.period ?? ''),
    };
  }

  /* =============== CACHE / AGE MANAGEMENT =============== */

  getLastUpdated(): Date | null {
    const ts = this._state().lastUpdated;
    return ts ? new Date(ts) : null;
  }

  isCacheValid(filter: SalesFilter): boolean {
    const currentFilter = this.getFilter();
    if (!currentFilter) return false;
    return this.filtersMatch(filter, currentFilter);
  }

  private filtersMatch(a: SalesFilter, b: SalesFilter): boolean {
    return (
      a.companyId === b.companyId &&
      a.branchId === b.branchId &&
      a.useCustomDate === b.useCustomDate &&
      a.compare === b.compare &&
      (a.year ?? null) === (b.year ?? null) &&
      (a.month ?? null) === (b.month ?? null) &&
      (a.selectedDate ?? null) === (b.selectedDate ?? null)
    );
  }

  /* =============== STATE INTROSPECTION =============== */

  getFullState(): SalesState {
    return this._state();
  }

  /* =============== CLEAR / RESET =============== */

  clearAll() {
    this._state.set(initialSalesState);
    if (this.isBrowser) {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
  }

  reset() {
    this.clearAll();
  }

  /* =============== STORAGE (hydrate) =============== */

  private hydrate(): SalesState | null {
    if (!this.isBrowser) return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw) as Partial<SalesState>;

      // Minimal validation + defaults agar aman bila versi berubah
      return {
        filter: parsed.filter ?? defaultSalesFilter,
        kpiData: parsed.kpiData ?? null,

        trendMonthly: parsed.trendMonthly ?? null,
        doVsSpkMonthly: parsed.doVsSpkMonthly ?? null,
        modelDistributionMonthly: parsed.modelDistributionMonthly ?? null,
        doByBranch: parsed.doByBranch ?? null,

        stockUnitRaw: parsed.stockUnitRaw ?? null, // NEW

        lastUpdated: parsed.lastUpdated ?? null,
      };
    } catch (error) {
      console.warn('Failed to hydrate sales state from localStorage:', error);
      return null;
    }
  }
}
