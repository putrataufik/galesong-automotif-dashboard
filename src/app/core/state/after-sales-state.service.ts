// src/app/core/state/after-sales-state.service.ts
import { Injectable, signal, effect, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/* ============================================================
   TYPES — UI-ready (selaras dengan AfterSalesApiService.getAfterSalesKpiView)
   ============================================================ */

export type UiPoint = { value: number; period: string };

export interface UiMetricPair {
  realisasi: number;
  target: number;
}

export interface UiAfterSalesTotals {
  mekanik: number;
  hariKerja: number;
  biayaUsaha: number;
  profit: number;

  afterSales: UiMetricPair;
  unitEntry: UiMetricPair;
  jasaService: UiMetricPair;
  partBengkel: UiMetricPair;
  partTunai: UiMetricPair;
  totalRevenue: UiMetricPair;
}

export interface UiBreakdownEntry { name: string; value: number; }
export interface UiBreakdowns {
  unitEntryByType: UiBreakdownEntry[];
  jasaServiceByType: UiBreakdownEntry[];
  partBengkelByType: UiBreakdownEntry[];
}

export interface UiComparison {
  period: string;        // label periode terformat
  totals: UiAfterSalesTotals;
  breakdowns: UiBreakdowns;
}

export interface UiProporsiSlice {
  name: string;
  selected: UiPoint;
  prevDate?: UiPoint;
  prevMonth?: UiPoint;
  prevYear?: UiPoint;
}

export interface UiAfterSalesKpis {
  selected: UiComparison;
  prevDate?: UiComparison;
  prevMonth?: UiComparison;
  prevYear?: UiComparison; // optional future-proof
}

export interface UiAfterSalesViewResponse {
  status: string;
  message: string;
  data: {
    kpis: UiAfterSalesKpis;
    proporsi: UiProporsiSlice[];
    request: any;
  };
}

export type ComparisonPeriod = 'prevMonth' | 'prevYear' | 'prevDate';

/** Filter API (pakai yang sama dengan Sales) */
export interface AfterSalesFilter {
  companyId: string;
  branchId: string;            // 'all-branch' atau kode cabang after-sales
  useCustomDate: boolean;      // true => pakai selectedDate
  compare: boolean;
  year: string | null;         // saat useCustomDate=false
  month: string | null;        // '01'..'12' atau null (year-only)
  selectedDate: string | null; // YYYY-MM-DD saat useCustomDate=true
}

/** Snapshot KPI yang disimpan di state */
export type AfterSalesKpiSnapshot = {
  request: any;
  kpis: UiAfterSalesKpis;
  proporsi: UiProporsiSlice[];
  timestamp: number;
};

export interface AfterSalesState {
  filter: AfterSalesFilter | null;
  kpiData: AfterSalesKpiSnapshot | null;
  lastUpdated: number | null;
}

/* ============================================================
   DEFAULTS
   ============================================================ */

export const defaultAfterSalesFilter: AfterSalesFilter = {
  companyId: 'sinar-galesong-mobilindo',
  branchId: 'all-branch',
  useCustomDate: true,
  compare: true,
  year: null,
  month: null, // null = year-only
  selectedDate: new Date().toISOString().slice(0, 10),
};

export const initialAfterSalesState: AfterSalesState = {
  filter: defaultAfterSalesFilter,
  kpiData: null,
  lastUpdated: null,
};

/* ============================================================
   BRANCH MAP (kode AFTER SALES sesuai mapping terbaru)
   ============================================================ */
const CABANG_NAME_MAP_AFTER: Readonly<Record<string, string>> = {
  '0001': 'PETTARANI',
  '0003': 'PALU',
  '0004': 'KENDARI',
  '0002': 'GORONTALO',
  '0005': 'PALOPO',
  '0006': 'SUNGGUMINASA',
} as const;

function pad4(code?: string | null): string {
  return code ? String(code).padStart(4, '0') : '';
}
function getCabangNameAfter(code: string): string {
  const c = pad4(code);
  return CABANG_NAME_MAP_AFTER[c] ?? c;
}

/* ============================================================
   STORAGE CONFIG
   ============================================================ */
const STORAGE_KEY = 'afterSalesState:v1';

/* ============================================================
   SERVICE
   ============================================================ */

@Injectable({ providedIn: 'root' })
export class AfterSalesStateService {
  // Single source of truth
  private readonly _state = signal<AfterSalesState>(initialAfterSalesState);

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
          // ignore storage errors (quota/private mode/blocked)
        }
      });
    }
  }

  /* =============== PATCH HELPERS =============== */
  private patch(partial: Partial<AfterSalesState>) {
    this._state.update((s) => ({
      ...s,
      ...partial,
      lastUpdated: Date.now(),
    }));
  }

  /* =============== FILTER MANAGEMENT =============== */

  saveFilter(filter: AfterSalesFilter) {
    // normalisasi month ke 2 digit jika ada
    const month = filter.month == null ? null : String(filter.month).padStart(2, '0');
    this.patch({ filter: { ...filter, month } });
  }

  getFilter(): AfterSalesFilter | null {
    return this._state().filter;
  }

  getCurrentFilter(): AfterSalesFilter {
    const f = this._state().filter ?? defaultAfterSalesFilter;
    const month = f.month == null ? null : String(f.month).padStart(2, '0');
    return { ...f, month };
  }

  clearFilter() {
    this.patch({ filter: null });
  }

  updateFilterField<K extends keyof AfterSalesFilter>(field: K, value: AfterSalesFilter[K]) {
    const currentFilter = this.getCurrentFilter();
    this.saveFilter({
      ...currentFilter,
      [field]: value,
    });
  }

  /* =============== KPI DATA MANAGEMENT =============== */

  saveKpiData(view: UiAfterSalesViewResponse) {
    const snapshot: AfterSalesKpiSnapshot = {
      request: view.data.request,
      kpis: view.data.kpis,
      proporsi: view.data.proporsi,
      timestamp: Date.now(),
    };
    this.patch({ kpiData: snapshot });
  }

  getKpiSnapshot(): AfterSalesKpiSnapshot | null {
    return this._state().kpiData;
  }

  getKpis(): UiAfterSalesKpis | null {
    const kd = this._state().kpiData;
    return kd ? kd.kpis : null;
  }

  getProporsi(): UiProporsiSlice[] {
    const kd = this._state().kpiData;
    return kd ? kd.proporsi : [];
  }

  hasKpiData(): boolean {
    return !!this._state().kpiData;
  }

  clearKpiData() {
    this.patch({ kpiData: null });
  }

  /* =============== KPI COMPARISON HELPERS =============== */

  // Generalized comparison for totals key
  private getTotalsComparison(
    totalsKey: keyof UiAfterSalesTotals,
    comparisonPeriod: ComparisonPeriod
  ):
    | {
        current: number;
        previous: number;
        change: number;
        changePercent: number;
        period: string;
        previousPeriod: string;
      }
    | null {
    const kpis = this.getKpis();
    if (!kpis?.selected) return null;

    const sel = kpis.selected;
    const prev = (kpis as any)[comparisonPeriod] as UiComparison | undefined;
    if (!prev) return null;

    const currentPair = (sel.totals as any)[totalsKey] as UiMetricPair | number;
    const prevPair = (prev.totals as any)[totalsKey] as UiMetricPair | number;

    // dukung nilai number (mekanik/hariKerja/profit/biayaUsaha) dan pair (realisasi/target)
    const current =
      typeof currentPair === 'number' ? currentPair : Number(currentPair?.realisasi ?? 0);
    const previous =
      typeof prevPair === 'number' ? prevPair : Number(prevPair?.realisasi ?? 0);

    const change = current - previous;
    const changePercent = previous === 0 ? (current === 0 ? 0 : 100) : (change / previous) * 100;

    return {
      current,
      previous,
      change,
      changePercent,
      period: String(sel.period ?? ''),
      previousPeriod: String(prev.period ?? ''),
    };
  }

  // Helper publik per KPI utama
  getAfterSalesGrowth(period: ComparisonPeriod = 'prevMonth') {
    return this.getTotalsComparison('afterSales', period);
  }
  getUnitEntryGrowth(period: ComparisonPeriod = 'prevMonth') {
    return this.getTotalsComparison('unitEntry', period);
  }
  getJasaServiceGrowth(period: ComparisonPeriod = 'prevMonth') {
    return this.getTotalsComparison('jasaService', period);
  }
  getPartBengkelGrowth(period: ComparisonPeriod = 'prevMonth') {
    return this.getTotalsComparison('partBengkel', period);
  }
  getPartTunaiGrowth(period: ComparisonPeriod = 'prevMonth') {
    return this.getTotalsComparison('partTunai', period);
  }
  getTotalRevenueGrowth(period: ComparisonPeriod = 'prevMonth') {
    return this.getTotalsComparison('totalRevenue', period);
  }

  // Quick access angka realisasi/target terkini
  getCurrentTotals():
    | {
        period: string;
        afterSales: UiMetricPair;
        unitEntry: UiMetricPair;
        jasaService: UiMetricPair;
        partBengkel: UiMetricPair;
        partTunai: UiMetricPair;
        totalRevenue: UiMetricPair;
        mekanik: number;
        hariKerja: number;
        biayaUsaha: number;
        profit: number;
      }
    | null {
    const kpis = this.getKpis();
    if (!kpis?.selected) return null;
    const t = kpis.selected.totals;
    return {
      period: kpis.selected.period,
      afterSales: t.afterSales,
      unitEntry: t.unitEntry,
      jasaService: t.jasaService,
      partBengkel: t.partBengkel,
      partTunai: t.partTunai,
      totalRevenue: t.totalRevenue,
      mekanik: t.mekanik,
      hariKerja: t.hariKerja,
      biayaUsaha: t.biayaUsaha,
      profit: t.profit,
    };
  }

  // Breakdown/Proporsi helpers
  getCurrentBreakdowns(): UiBreakdowns | null {
    const kpis = this.getKpis();
    return kpis?.selected?.breakdowns ?? null;
  }

  getProporsiFor(name: string): {
    name: string;
    selected?: UiPoint;
    prevDate?: UiPoint;
    prevMonth?: UiPoint;
    prevYear?: UiPoint;
  } | null {
    const items = this.getProporsi();
    const found = items.find((x) => x.name.toUpperCase() === name.toUpperCase());
    return found ? found : null;
  }

  /* =============== EXECUTIVE SUMMARY-LIKE SNAPSHOT =============== */

  getCurrentPeriodSummary():
    | {
        period: string;
        afterSalesRealisasi: number;
        unitEntryRealisasi: number;
        jasaServiceRealisasi: number;
        partBengkelRealisasi: number;
        partTunaiRealisasi: number;
        totalRevenueRealisasi: number;
        topUnitEntryType?: string;   // tipe dengan value terbesar
        topServiceType?: string;
        topPartBengkelType?: string;
        branchName?: string;         // opsional jika kamu simpan di request
      }
    | null {
    const kpis = this.getKpis();
    if (!kpis?.selected) return null;

    const { totals, breakdowns, period } = kpis.selected;
    const top = (arr: UiBreakdownEntry[]) =>
      arr && arr.length ? arr.reduce((a, b) => (b.value > a.value ? b : a)).name : undefined;

    // coba tarik nama cabang dari request (kalau ada)
    const req = this._state().kpiData?.request ?? {};
    const branchId = (req.branchId ?? req.branch ?? '') as string;
    const branchName = branchId && branchId !== 'all-branch'
      ? getCabangNameAfter(String(branchId))
      : undefined;

    return {
      period,
      afterSalesRealisasi: totals.afterSales.realisasi,
      unitEntryRealisasi: totals.unitEntry.realisasi,
      jasaServiceRealisasi: totals.jasaService.realisasi,
      partBengkelRealisasi: totals.partBengkel.realisasi,
      partTunaiRealisasi: totals.partTunai.realisasi,
      totalRevenueRealisasi: totals.totalRevenue.realisasi,
      topUnitEntryType: top(breakdowns.unitEntryByType),
      topServiceType: top(breakdowns.jasaServiceByType),
      topPartBengkelType: top(breakdowns.partBengkelByType),
      branchName,
    };
  }

  /* =============== CACHE / AGE MANAGEMENT =============== */

  isDataStale(maxAgeMinutes: number = 30): boolean {
    const lastUpdated = this._state().lastUpdated;
    if (!lastUpdated) return true;
    const now = Date.now();
    const diffMinutes = (now - lastUpdated) / (1000 * 60);
    return diffMinutes > maxAgeMinutes;
  }

  getLastUpdated(): Date | null {
    const ts = this._state().lastUpdated;
    return ts ? new Date(ts) : null;
  }

  isCacheValid(filter: AfterSalesFilter, maxAgeMinutes: number = 30): boolean {
    if (this.isDataStale(maxAgeMinutes)) return false;
    const currentFilter = this.getFilter();
    if (!currentFilter) return false;
    return this.filtersMatch(filter, currentFilter);
  }

  private filtersMatch(a: AfterSalesFilter, b: AfterSalesFilter): boolean {
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

  getFullState(): AfterSalesState {
    return this._state();
  }

  /* =============== CLEAR / RESET =============== */

  clearAll() {
    this._state.set(initialAfterSalesState);
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

  private hydrate(): AfterSalesState | null {
    if (!this.isBrowser) return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw) as Partial<AfterSalesState>;

      return {
        filter: parsed.filter ?? defaultAfterSalesFilter,
        kpiData: parsed.kpiData ?? null,
        lastUpdated: parsed.lastUpdated ?? null,
      };
    } catch (error) {
      console.warn('Failed to hydrate after-sales state from localStorage:', error);
      return null;
    }
  }
}
