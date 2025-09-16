// src/app/core/state/sales-state.service.ts
import { Injectable, signal, effect, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/* ============================================================
   TYPES — UI-ready (selaras dengan SalesApiService.getSalesKpiView)
   ============================================================ */

export type UiKpiPoint = { value: number; period: string };
export type UiKpiBranchPoint = UiKpiPoint & { code: string; branchName: string };
export type UiKpiModelPoint  = UiKpiPoint & { name: string };

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
  }
  totalHotProspek?: {
    selected?: UiKpiPoint;
    prevMonth?: UiKpiPoint;
    prevYear?: UiKpiPoint;
    prevDate?: UiKpiPoint;
  }
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
  period: string;         // current period label (formatted)
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
  branchId: string;           // 'all-branch' atau kode cabang
  useCustomDate: boolean;     // true => pakai selectedDate
  compare: boolean;
  year: string | null;        // saat useCustomDate=false
  month: string | null;       // '01'..'12' atau null (year-only)
  selectedDate: string | null; // YYYY-MM-DD saat useCustomDate=true
}

/** Snapshot KPI yang disimpan di state */
export type SalesKpiSnapshot<TKpis = UiKpis> = {
  request: any;
  kpis: TKpis;
  timestamp: number;
};

export interface SalesState {
  filter: SalesFilter | null;
  kpiData: SalesKpiSnapshot | null;
  lastUpdated: number | null;
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
  month: null,      // null = year-only; bisa kamu ubah ke 'all-month' upstream UI
  selectedDate: new Date().toISOString().slice(0, 10),
};

export const initialSalesState: SalesState = {
  filter: defaultSalesFilter,
  kpiData: null,
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
const STORAGE_KEY = 'salesState:v1';

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

  updateFilterField<K extends keyof SalesFilter>(field: K, value: SalesFilter[K]) {
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
    metricType: 'totalUnitSales' | 'totalSPK' | 'totalDO' | 'totalProspek' | 'totalHotProspek',
    comparisonPeriod: ComparisonPeriod
  ): KpiComparison | null {
    const kpis = this.getKpis();
    if (!kpis) return null;

    const metric: any = (kpis as any)[metricType];
    if (!metric?.selected || !metric[comparisonPeriod]) return null;

    const current = Number(metric.selected.value ?? 0);
    const previous = Number(metric[comparisonPeriod]!.value ?? 0);
    const change = current - previous;
    const changePercent = previous === 0 ? (current === 0 ? 0 : 100) : (change / previous) * 100;

    return {
      current,
      previous,
      change,
      changePercent,
      period: String(metric.selected.period ?? ''),
      previousPeriod: String(metric[comparisonPeriod]!.period ?? ''),
    };
  }

  getTopModelComparison(comparisonPeriod: ComparisonPeriod): ModelComparison | null {
    const kpis = this.getKpis();
    if (!kpis?.topModel?.selected || !kpis.topModel[comparisonPeriod]) return null;

    const sel = kpis.topModel.selected!;
    const prev = kpis.topModel[comparisonPeriod]!;

    return {
      current: { name: String(sel.name ?? ''), value: Number(sel.value ?? 0) },
      previous: { name: String(prev.name ?? ''), value: Number(prev.value ?? 0) },
      period: String(sel.period ?? ''),
      previousPeriod: String(prev.period ?? ''),
    };
  }

  getTopBranchComparison(comparisonPeriod: ComparisonPeriod): BranchComparison | null {
    const kpis = this.getKpis();
    if (!kpis?.topBranch?.selected || !kpis.topBranch[comparisonPeriod]) return null;

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

  /* =============== EXECUTIVE SUMMARY-LIKE SNAPSHOT =============== */

  getCurrentPeriodSummary():
    | {
        totalUnitSales: number;
        totalSPK: number;
        totalDO: number;
        totalProspek: number;
        totalHotProspek: number;
        topModel: string;
        topBranch: string;
        period: string;
      }
    | null {
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

  isCacheValid(filter: SalesFilter, maxAgeMinutes: number = 30): boolean {
    if (this.isDataStale(maxAgeMinutes)) return false;
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
        lastUpdated: parsed.lastUpdated ?? null,
      };
    } catch (error) {
      console.warn('Failed to hydrate sales state from localStorage:', error);
      return null;
    }
  }
}
