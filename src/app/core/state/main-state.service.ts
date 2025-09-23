import { Injectable, signal, computed, effect } from '@angular/core';
import { SalesFilter } from '../models/sales.models';
import { UiKpis } from '../services/sales-api.service';
import {
  RawAfterSalesMetrics,
  RawProporsiItem,
  RawComparisonBlock,
} from '../services/after-sales-api.service';

/* ====================== Sales & After snapshots ====================== */

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

/* ====================== Charts snapshots (NEW) ====================== */

export type RawTrendDataset = { label: string; data: number[] };

export interface MainTrendSnapshot {
  key: string;          // trend_company_year_compare
  companyId: string;
  year: string;
  compare: boolean;
  datasets: RawTrendDataset[];
  timestamp: number;
}

export interface MainDoVsSpkSnapshot {
  key: string;          // dovsspk_company_year
  companyId: string;
  year: string;
  datasets: RawTrendDataset[];
  timestamp: number;
}

export interface MainModelDistItem { name: string; value: number }
export interface MainModelDistBlock {
  period: string; // "2025-09"
  label: string;  // "Sep 2025"
  items: MainModelDistItem[];
}
export interface MainModelDistSnapshot {
  key: string;          // modeldist_company_year_mm_compare
  companyId: string;
  year: string;         // "2025"
  month: string;        // "01".."12"
  compare: boolean;
  current?: MainModelDistBlock;
  prevMonth?: MainModelDistBlock;
  prevYear?: MainModelDistBlock;
  timestamp: number;
}

/* ====================== Persistence ====================== */

const LS_KEY = 'mainstate.v1';

type PersistedShape = {
  filter: SalesFilter | null;
  salesSnap: MainSalesSnapshot | null;
  afterSnap: MainAfterSalesSnapshot | null;
  trendSnap: MainTrendSnapshot | null;             // NEW
  doVsSpkSnap: MainDoVsSpkSnapshot | null;        // NEW
  modelDistSnap: MainModelDistSnapshot | null;     // NEW
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

/* ====================== Service ====================== */

@Injectable({ providedIn: 'root' })
export class MainDashboardStateService {
  // In-memory signals
  private readonly _filter = signal<SalesFilter | null>(null);
  private readonly _salesSnap = signal<MainSalesSnapshot | null>(null);
  private readonly _afterSnap = signal<MainAfterSalesSnapshot | null>(null);

  // Charts
  private readonly _trendSnap = signal<MainTrendSnapshot | null>(null);
  private readonly _doVsSpkSnap = signal<MainDoVsSpkSnapshot | null>(null);
  private readonly _modelDistSnap = signal<MainModelDistSnapshot | null>(null);

  constructor() {
    const persisted = readAll();
    if (persisted) {
      this._filter.set(persisted.filter ?? null);
      this._salesSnap.set(persisted.salesSnap ?? null);
      this._afterSnap.set(persisted.afterSnap ?? null);
      this._trendSnap.set(persisted.trendSnap ?? null);
      this._doVsSpkSnap.set(persisted.doVsSpkSnap ?? null);
      this._modelDistSnap.set(persisted.modelDistSnap ?? null);
    }

    // AUTO-SAVE semua perubahan
    effect(() => {
      writeAll({
        filter: this._filter(),
        salesSnap: this._salesSnap(),
        afterSnap: this._afterSnap(),
        trendSnap: this._trendSnap(),
        doVsSpkSnap: this._doVsSpkSnap(),
        modelDistSnap: this._modelDistSnap(),
      });
    });
  }

  /* ===== Mutators ===== */
  saveFilter(f: SalesFilter) { this._filter.set(f); }
  clearFilter() {
    this._filter.set(null);
    writeAll({
      filter: null,
      salesSnap: this._salesSnap(),
      afterSnap: this._afterSnap(),
      trendSnap: this._trendSnap(),
      doVsSpkSnap: this._doVsSpkSnap(),
      modelDistSnap: this._modelDistSnap(),
    });
  }

  saveSalesSnapshot(s: MainSalesSnapshot) { this._salesSnap.set(s); }
  clearSalesSnapshot() {
    this._salesSnap.set(null);
    writeAll({
      filter: this._filter(),
      salesSnap: null,
      afterSnap: this._afterSnap(),
      trendSnap: this._trendSnap(),
      doVsSpkSnap: this._doVsSpkSnap(),
      modelDistSnap: this._modelDistSnap(),
    });
  }

  saveAfterSnapshot(s: MainAfterSalesSnapshot) { this._afterSnap.set(s); }
  clearAfterSnapshot() {
    this._afterSnap.set(null);
    writeAll({
      filter: this._filter(),
      salesSnap: this._salesSnap(),
      afterSnap: null,
      trendSnap: this._trendSnap(),
      doVsSpkSnap: this._doVsSpkSnap(),
      modelDistSnap: this._modelDistSnap(),
    });
  }

  clearAll() {
    this._filter.set(null);
    this._salesSnap.set(null);
    this._afterSnap.set(null);
    this._trendSnap.set(null);
    this._doVsSpkSnap.set(null);
    this._modelDistSnap.set(null);
    removeAll();
  }

  /* ===== Charts mutators & cache keys ===== */
  private buildTrendKey(companyId: string, year: string, compare: boolean) {
    return `trend_${companyId}_${year}_${compare}`;
  }
  saveTrendSnapshot(s: Omit<MainTrendSnapshot, 'key' | 'timestamp'> & { timestamp?: number }) {
    const key = this.buildTrendKey(s.companyId, s.year, s.compare);
    this._trendSnap.set({ ...s, key, timestamp: s.timestamp ?? Date.now() });
  }
  clearTrendSnapshot() { this._trendSnap.set(null); }

  private buildDoVsSpkKey(companyId: string, year: string) {
    return `dovsspk_${companyId}_${year}`;
  }
  saveDoVsSpkSnapshot(s: Omit<MainDoVsSpkSnapshot, 'key' | 'timestamp'> & { timestamp?: number }) {
    const key = this.buildDoVsSpkKey(s.companyId, s.year);
    this._doVsSpkSnap.set({ ...s, key, timestamp: s.timestamp ?? Date.now() });
  }
  clearDoVsSpkSnapshot() { this._doVsSpkSnap.set(null); }

  private buildModelDistKey(companyId: string, year: string, month: string, compare: boolean) {
    const mm = String(month).padStart(2, '0');
    return `modeldist_${companyId}_${year}_${mm}_${compare}`;
  }
  saveModelDistSnapshot(s: Omit<MainModelDistSnapshot, 'key' | 'timestamp'> & { timestamp?: number }) {
    const key = this.buildModelDistKey(s.companyId, s.year, s.month, s.compare);
    this._modelDistSnap.set({ ...s, key, timestamp: s.timestamp ?? Date.now() });
  }
  clearModelDistSnapshot() { this._modelDistSnap.set(null); }

  /* ===== Selectors ===== */
  getFilter(): SalesFilter | null { return this._filter(); }

  getKpis(): UiKpis | null { return this._salesSnap()?.kpis ?? null; }
  hasKpis() { return computed(() => !!this._salesSnap()?.kpis); }

  selected(): RawAfterSalesMetrics | null { return this._afterSnap()?.selected ?? null; }
  prevDate(): RawComparisonBlock | null { return this._afterSnap()?.prevDate ?? null; }
  prevMonth(): RawComparisonBlock | null { return this._afterSnap()?.prevMonth ?? null; }
  prevYear(): RawComparisonBlock | null { return this._afterSnap()?.prevYear ?? null; }
  proporsi(): RawProporsiItem[] { return this._afterSnap()?.proporsi ?? []; }
  hasAfter() { return computed(() => !!this._afterSnap()?.selected); }

  // Charts selectors
  getTrendSnapshot(): MainTrendSnapshot | null { return this._trendSnap(); }
  getDoVsSpkSnapshot(): MainDoVsSpkSnapshot | null { return this._doVsSpkSnap(); }
  getModelDistSnapshot(): MainModelDistSnapshot | null { return this._modelDistSnap(); }

  // Cache validators
  isTrendCacheValid(companyId: string, year: string, compare: boolean): boolean {
    const t = this._trendSnap(); if (!t) return false;
    return t.key === this.buildTrendKey(companyId, year, compare);
  }
  isDoVsSpkCacheValid(companyId: string, year: string): boolean {
    const d = this._doVsSpkSnap(); if (!d) return false;
    return d.key === this.buildDoVsSpkKey(companyId, year);
  }
  isModelDistCacheValid(companyId: string, year: string, month: string, compare: boolean): boolean {
    const m = this._modelDistSnap(); if (!m) return false;
    return m.key === this.buildModelDistKey(companyId, year, month, compare);
  }
}
