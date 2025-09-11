// src/app/pages/main-dashboard/main-state.service.ts
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
  changePercent: number; // gunakan NaN untuk 'n/a' jika previous=0 & current>0
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

/** Snapshot KPI yang disimpan di state */
export type SalesKpiSnapshot<TKpis = UiKpis> = {
  request: any;
  kpis: TKpis;
  timestamp: number;
};

export interface MainState {
  filter: SalesFilter | null;
  kpiData: SalesKpiSnapshot | null;
  lastUpdated: number | null;
}

/* ============================================================
   DEFAULTS (silakan sesuaikan default untuk Main Dashboard)
   ============================================================ */

const now = new Date();

export const defaultMainFilter: SalesFilter = {
  companyId: 'sinar-galesong-mobilindo',
  branchId: 'all-branch',
  useCustomDate: false,
  compare: true, // ubah ke true kalau mau default compare ON
  year: String(now.getFullYear()),
  month: String(now.getMonth() + 1).padStart(2, '0'),
  selectedDate: null,
};

export const initialMainState: MainState = {
  filter: defaultMainFilter,
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
const STORAGE_KEY = 'mainState:v1';

/* ============================================================
   SERVICE
   ============================================================ */

@Injectable({ providedIn: 'root' })
export class MainStateService {
  // Single source of truth
  private readonly _state = signal<MainState>(initialMainState);

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
  private patch(partial: Partial<MainState>) {
    this._state.update((s) => ({
      ...s,
      ...partial,
      lastUpdated: Date.now(),
    }));
  }

  /* =============== FILTER MANAGEMENT =============== */

  saveFilter(filter: SalesFilter) {
    // samakan dengan sales-state: normalisasi month saat simpan
    const month =
      filter.month == null ? null : String(filter.month).padStart(2, '0');
    this.patch({ filter: { ...filter, month } });
  }

  getFilter(): SalesFilter | null {
    return this._state().filter;
  }

  getCurrentFilter(): SalesFilter {
    // Pastikan konsisten: month dua digit jika ada
    const f = this._state().filter ?? defaultMainFilter;
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
    metricType: 'totalUnitSales' | 'totalSPK' | 'totalDO',
    comparisonPeriod: ComparisonPeriod
  ): KpiComparison | null {
    const kpis = this.getKpis();
    if (!kpis) return null;

    const metric: any = (kpis as any)[metricType];
    if (!metric?.selected || !metric[comparisonPeriod]) return null;

    const current = Number(metric.selected.value ?? 0);
    const previous = Number(metric[comparisonPeriod]!.value ?? 0);
    const change = current - previous;

    // selaraskan kebijakan: previous=0 → NaN (biar UI render '—'), 0 jika keduanya 0
    let changePercent: number;
    if (previous === 0) {
      changePercent = current === 0 ? 0 : Number.NaN;
    } else {
      changePercent = (change / previous) * 100;
    }

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

  /* =============== EXECUTIVE SUMMARY-LIKE SNAPSHOT =============== */

  getCurrentPeriodSummary(): {
    totalUnitSales: number;
    totalSPK: number;
    totalDO: number;
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
    // samakan dengan sales-state: normalisasi month saat bandingkan
    const norm = (m: string | null) =>
      m == null ? null : String(m).padStart(2, '0');
    return (
      a.companyId === b.companyId &&
      a.branchId === b.branchId &&
      a.useCustomDate === b.useCustomDate &&
      a.compare === b.compare &&
      (a.year ?? null) === (b.year ?? null) &&
      norm(a.month ?? null) === norm(b.month ?? null) &&
      (a.selectedDate ?? null) === (b.selectedDate ?? null)
    );
  }

  /* =============== STATE INTROSPECTION =============== */

  getFullState(): MainState {
    return this._state();
  }

  /* =============== CLEAR / RESET =============== */

  clearAll() {
    this._state.set(initialMainState);
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

  private hydrate(): MainState | null {
    if (!this.isBrowser) return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw) as Partial<MainState>;

      // Minimal validation + defaults agar aman bila versi berubah
      return {
        filter: parsed.filter ?? defaultMainFilter,
        kpiData: parsed.kpiData ?? null,
        lastUpdated: parsed.lastUpdated ?? null,
      };
    } catch {
      return null;
    }
  }
}
