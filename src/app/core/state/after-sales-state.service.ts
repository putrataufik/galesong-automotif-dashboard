// src/app/core/state/after-sales-dashboard-state.service.ts
import { Injectable, signal, effect, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

// Ambil kontrak type dari service API biar 1 sumber kebenaran
import {
  RawAfterSalesMetrics,
  RawProporsiItem,
  RawComparisonBlock,
  UiAfterSalesResponse,   // <- hasil getAfterSalesView
} from '../services/after-sales-api.service';

// Filter UI yang dipakai di komponen dashboard (biar konsisten penyimpanan)
import {
  AfterSalesFilter as UiFilter,
} from '../../shared/components/filter-aftersales-dashboard/filter-aftersales-dashboard.component';

/* ======================= TYPES (MINIMAL) ======================= */

export type AfterSalesMinimalSnapshot = {
  request: any;
  selected: RawAfterSalesMetrics | null;
  prevDate?: RawComparisonBlock | null;
  prevMonth?: RawComparisonBlock | null;
  prevYear?: RawComparisonBlock | null;
  proporsiItems: RawProporsiItem[];
  timestamp: number;
};

export interface AfterSalesDashboardState {
  filter: UiFilter | null;
  snapshot: AfterSalesMinimalSnapshot | null;
  lastUpdated: number | null;
}

/* ======================= DEFAULTS ======================= */

const STORAGE_KEY = 'asDashState:v1';

const defaultUiFilter: UiFilter = {
  company: 'sinar-galesong-mobilindo',
  cabang: 'all-branch',
  period: String(new Date().getFullYear()),
  month: String(new Date().getMonth() + 1).padStart(2, '0'),
  compare: true,
  useCustomDate: true,
  selectedDate: new Date().toISOString().slice(0, 10),
};

const initialState: AfterSalesDashboardState = {
  filter: defaultUiFilter,
  snapshot: null,
  lastUpdated: null,
};

/* ======================= SERVICE ======================= */

@Injectable({ providedIn: 'root' })
export class AfterSalesDashboardStateService {
  private readonly _state = signal<AfterSalesDashboardState>(initialState);
  private readonly isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);

    if (this.isBrowser) {
      const saved = this.hydrate();
      if (saved) this._state.set(saved);

      // persist otomatis setiap ada perubahan
      effect(() => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(this._state()));
        } catch {}
      });
    }
  }

  /* =============== helpers =============== */
  private patch(partial: Partial<AfterSalesDashboardState>) {
    this._state.update(s => ({ ...s, ...partial, lastUpdated: Date.now() }));
  }

  /* =============== FILTER (UI) =============== */
  getFilter(): UiFilter {
    return this._state().filter ?? defaultUiFilter;
  }
  saveFilter(filter: UiFilter) {
    // normalisasi bulan 2 digit kalau bukan "all-month"
    const month =
      filter.month && filter.month !== 'all-month'
        ? String(filter.month).padStart(2, '0')
        : filter.month;
    this.patch({ filter: { ...filter, month } });
  }

  /* =============== SNAPSHOT (MINIMAL) =============== */

  /** Simpan dari hasil `getAfterSalesView` (UiAfterSalesResponse) */
  saveFromView(view: UiAfterSalesResponse) {
    const kpi = view?.data?.kpi_data;
    const comps = kpi?.comparisons;

    const snap: AfterSalesMinimalSnapshot = {
      request: view?.data?.request,
      selected: kpi?.selected ?? null,
      prevDate: comps?.prevDate ?? null,
      prevMonth: comps?.prevMonth ?? null,
      prevYear: comps?.prevYear ?? null,
      proporsiItems: view?.data?.proporsi_after_sales?.data?.items ?? [],
      timestamp: Date.now(),
    };
    this.patch({ snapshot: snap });
  }

  clearSnapshot() {
    this.patch({ snapshot: null });
  }

  /* =============== GETTERS (dipakai komponen) =============== */

  hasData(): boolean {
    return !!this._state().snapshot?.selected;
  }

  /** Raw selected metrics (yang kamu pakai di kartu) */
  selected(): RawAfterSalesMetrics | null {
    return this._state().snapshot?.selected ?? null;
  }

  /** Blocks perbandingan apa adanya (punya `.period` & `.metrics`) */
  prevDate(): RawComparisonBlock | null {
    return (this._state().snapshot?.prevDate ?? null) as RawComparisonBlock | null;
  }
  prevMonth(): RawComparisonBlock | null {
    return (this._state().snapshot?.prevMonth ?? null) as RawComparisonBlock | null;
  }
  prevYear(): RawComparisonBlock | null {
    return (this._state().snapshot?.prevYear ?? null) as RawComparisonBlock | null;
  }

  /** Proporsi (RAW) */
  proporsi(): RawProporsiItem[] {
    return this._state().snapshot?.proporsiItems ?? [];
  }

  /** Util kecil yang sering dipakai kartu */
  getTotalUnitEntry(): number {
    return Number(this.selected()?.unit_entry_realisasi ?? 0);
  }

  getLastUpdated(): Date | null {
    const ts = this._state().lastUpdated;
    return ts ? new Date(ts) : null;
  }

  getFullState(): AfterSalesDashboardState {
    return this._state();
  }

  clearAll() {
    this._state.set(initialState);
    if (this.isBrowser) {
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
    }
  }

  /* =============== HYDRATE =============== */
  private hydrate(): AfterSalesDashboardState | null {
    if (!this.isBrowser) return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<AfterSalesDashboardState>;
      return {
        filter: parsed.filter ?? defaultUiFilter,
        snapshot: parsed.snapshot ?? null,
        lastUpdated: parsed.lastUpdated ?? null,
      };
    } catch {
      return null;
    }
  }
}
