// src/app/core/state/main-dashboard-state.service.ts
import { Injectable, signal, computed } from '@angular/core';
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

@Injectable({ providedIn: 'root' })
export class MainDashboardStateService {
  // Filter (SalesFilter dipakai untuk fetch API)
  private readonly _filter = signal<SalesFilter | null>(null);

  // Snapshots
  private readonly _salesSnap = signal<MainSalesSnapshot | null>(null);
  private readonly _afterSnap = signal<MainAfterSalesSnapshot | null>(null);

  // ===== Mutators =====
  saveFilter(f: SalesFilter) { this._filter.set(f); }
  clearFilter() { this._filter.set(null); }

  saveSalesSnapshot(s: MainSalesSnapshot) { this._salesSnap.set(s); }
  clearSalesSnapshot() { this._salesSnap.set(null); }

  saveAfterSnapshot(s: MainAfterSalesSnapshot) { this._afterSnap.set(s); }
  clearAfterSnapshot() { this._afterSnap.set(null); }

  clearAll() {
    this.clearFilter();
    this.clearSalesSnapshot();
    this.clearAfterSnapshot();
  }

  // ===== Selectors (dipakai komponen/template) =====
  getFilter(): SalesFilter | null { return this._filter(); }

  getKpis(): UiKpis | null { return this._salesSnap()?.kpis ?? null; }
  hasKpis() { return computed(() => !!this._salesSnap()?.kpis); }

  selected(): RawAfterSalesMetrics | null { return this._afterSnap()?.selected ?? null; }
  prevDate(): RawComparisonBlock | null { return this._afterSnap()?.prevDate ?? null; }
  prevMonth(): RawComparisonBlock | null { return this._afterSnap()?.prevMonth ?? null; }
  prevYear(): RawComparisonBlock | null { return this._afterSnap()?.prevYear ?? null; }
  proporsi(): RawProporsiItem[] { return this._afterSnap()?.proporsi ?? []; }
  hasAfter() { return computed(() => !!this._afterSnap()?.selected); }
}
