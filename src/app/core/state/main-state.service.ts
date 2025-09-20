// src/app/core/state/main-dashboard-state.service.ts
import { Injectable, signal, computed, effect } from '@angular/core';
import { SalesFilter } from '../models/sales.models';
import { UiKpis } from '../services/sales-api.service';
import {
  RawAfterSalesMetrics,
  RawProporsiItem,
  RawComparisonBlock,
} from '../services/after-sales-api.service';

export interface MainSalesSnapshot {
  request: any;
  kpis: UiKpis | null;
  timestamp: number;
}

export interface MainAfterSalesSnapshot {
  request: any;
  selected: RawAfterSalesMetrics | null;
  prevDate?: RawComparisonBlock;
  prevMonth?: RawComparisonBlock;
  prevYear?: RawComparisonBlock;
  proporsi: RawProporsiItem[];
  timestamp: number;
}

/** ====== PERSISTENCE (single key) ====== */
const LS_KEY = 'mainstate.v1';

type PersistedShape = {
  filter: SalesFilter | null;
  salesSnap: MainSalesSnapshot | null;
  afterSnap: MainAfterSalesSnapshot | null;
};

function readAll(): PersistedShape | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as PersistedShape) : null;
  } catch {
    return null;
  }
}

function writeAll(data: PersistedShape) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch {
    // noop
  }
}

function removeAll() {
  try {
    localStorage.removeItem(LS_KEY);
  } catch {
    // noop
  }
}
/** ====================================== */

@Injectable({ providedIn: 'root' })
export class MainDashboardStateService {
  // In-memory signals
  private readonly _filter = signal<SalesFilter | null>(null);
  private readonly _salesSnap = signal<MainSalesSnapshot | null>(null);
  private readonly _afterSnap = signal<MainAfterSalesSnapshot | null>(null);

  constructor() {
    // HYDRATE dari localStorage (jika ada)
    const persisted = readAll();
    if (persisted) {
      this._filter.set(persisted.filter ?? null);
      this._salesSnap.set(persisted.salesSnap ?? null);
      this._afterSnap.set(persisted.afterSnap ?? null);
    }

    // AUTO-SAVE ke localStorage saat ada perubahan salah satu state
    effect(() => {
      writeAll({
        filter: this._filter(),
        salesSnap: this._salesSnap(),
        afterSnap: this._afterSnap(),
      });
    });
  }

  // ===== Mutators =====
  saveFilter(f: SalesFilter) {
    this._filter.set(f);
  }
  clearFilter() {
    this._filter.set(null);
    // tetap tulis keseluruhan agar state konsisten
    writeAll({
      filter: null,
      salesSnap: this._salesSnap(),
      afterSnap: this._afterSnap(),
    });
  }

  saveSalesSnapshot(s: MainSalesSnapshot) {
    this._salesSnap.set(s);
  }
  clearSalesSnapshot() {
    this._salesSnap.set(null);
    writeAll({
      filter: this._filter(),
      salesSnap: null,
      afterSnap: this._afterSnap(),
    });
  }

  saveAfterSnapshot(s: MainAfterSalesSnapshot) {
    this._afterSnap.set(s);
  }
  clearAfterSnapshot() {
    this._afterSnap.set(null);
    writeAll({
      filter: this._filter(),
      salesSnap: this._salesSnap(),
      afterSnap: null,
    });
  }

  clearAll() {
    this._filter.set(null);
    this._salesSnap.set(null);
    this._afterSnap.set(null);
    removeAll();
  }

  // ===== Selectors =====
  getFilter(): SalesFilter | null {
    return this._filter();
  }

  getKpis(): UiKpis | null {
    return this._salesSnap()?.kpis ?? null;
  }
  hasKpis() {
    return computed(() => !!this._salesSnap()?.kpis);
  }

  selected(): RawAfterSalesMetrics | null {
    return this._afterSnap()?.selected ?? null;
  }
  prevDate(): RawComparisonBlock | null {
    return this._afterSnap()?.prevDate ?? null;
  }
  prevMonth(): RawComparisonBlock | null {
    return this._afterSnap()?.prevMonth ?? null;
  }
  prevYear(): RawComparisonBlock | null {
    return this._afterSnap()?.prevYear ?? null;
  }
  proporsi(): RawProporsiItem[] {
    return this._afterSnap()?.proporsi ?? [];
  }
  hasAfter() {
    return computed(() => !!this._afterSnap()?.selected);
  }
}
