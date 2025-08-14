// =============================
// src/app/core/state/after-sales-state.service.ts
// =============================
import { Injectable, signal, effect, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AfterSalesFilter } from '../../shared/components/filter-aftersales-dashboard/filter-aftersales-dashboard.component';

// === TYPES: After Sales KPI ===
export interface AfterSalesKpiSnapshot {
  afterSales: { realisasi: number; target: number };
  serviceCabang: { realisasi: number; target: number };
  unitEntry: { realisasi: number; target: number };
  sparepartTunai: { realisasi: number; target: number };
  totalUnitEntry: number;
}

// === TYPES: Sisa Hari Kerja ===
export interface SisaHariKerjaState {
  options: Array<{ value: string; name: string }>;
  selectedValue: string;
  isVisible: boolean;
}

// === TYPES: Charts (untuk future development) ===
export interface AfterSalesChartsState {
  realisasiVsTarget: any | null;
  profitByBranch: any | null;
  trendOverTime: any | null;
}

// === STATE ROOT ===
interface AfterSalesState {
  filter: AfterSalesFilter | null;
  kpi: AfterSalesKpiSnapshot;
  sisaHariKerja: SisaHariKerjaState;
  charts: AfterSalesChartsState;
  lastUpdated: number | null;
}

// ====== INITIALS ======
const initialKpi: AfterSalesKpiSnapshot = {
  afterSales: { realisasi: 0, target: 0 },
  serviceCabang: { realisasi: 0, target: 0 },
  unitEntry: { realisasi: 0, target: 0 },
  sparepartTunai: { realisasi: 0, target: 0 },
  totalUnitEntry: 0,
};

const initialSisaHariKerja: SisaHariKerjaState = {
  options: [],
  selectedValue: '',
  isVisible: false,
};

const initialCharts: AfterSalesChartsState = {
  realisasiVsTarget: null,
  profitByBranch: null,
  trendOverTime: null,
};

const initialState: AfterSalesState = {
  filter: null,
  kpi: initialKpi,
  sisaHariKerja: initialSisaHariKerja,
  charts: initialCharts,
  lastUpdated: null,
};

// ====== STORAGE CONFIG ======
const STORAGE_KEY = 'afterSalesState:v1';

@Injectable({ providedIn: 'root' })
export class AfterSalesStateService {
  // Single source of truth
  private readonly _state = signal<AfterSalesState>(initialState);

  // Flag SSR/browser
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
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
        } catch {
          // ignore: quota penuh / private mode / blocked storage
        }
      });
    }
  }

  // ====== PATCH HELPERS ======
  private patch(partial: Partial<AfterSalesState>) {
    this._state.update((s) => ({ 
      ...s, 
      ...partial, 
      lastUpdated: Date.now() 
    }));
  }

  private patchKpi(partial: Partial<AfterSalesKpiSnapshot>) {
    this._state.update((s) => ({ 
      ...s, 
      kpi: { ...s.kpi, ...partial },
      lastUpdated: Date.now()
    }));
  }

  private patchSisaHariKerja(partial: Partial<SisaHariKerjaState>) {
    this._state.update((s) => ({ 
      ...s, 
      sisaHariKerja: { ...s.sisaHariKerja, ...partial },
      lastUpdated: Date.now()
    }));
  }

  private patchCharts(partial: Partial<AfterSalesChartsState>) {
    this._state.update((s) => ({ 
      ...s, 
      charts: { ...s.charts, ...partial },
      lastUpdated: Date.now()
    }));
  }

  // ====== FILTER MANAGEMENT ======
  saveFilter(filter: AfterSalesFilter) { 
    this.patch({ filter }); 
  }

  getFilter(): AfterSalesFilter | null { 
    return this._state().filter; 
  }

  clearFilter() {
    this.patch({ filter: null });
  }

  // ====== KPI MANAGEMENT ======
  saveKpi(kpi: Partial<AfterSalesKpiSnapshot>) {
    this.patchKpi({
      afterSales: kpi.afterSales ?? this._state().kpi.afterSales,
      serviceCabang: kpi.serviceCabang ?? this._state().kpi.serviceCabang,
      unitEntry: kpi.unitEntry ?? this._state().kpi.unitEntry,
      sparepartTunai: kpi.sparepartTunai ?? this._state().kpi.sparepartTunai,
      totalUnitEntry: kpi.totalUnitEntry ?? this._state().kpi.totalUnitEntry,
    });
  }

  getKpi(): AfterSalesKpiSnapshot { 
    return this._state().kpi; 
  }

  hasKpi(): boolean {
    const k = this._state().kpi;
    return k.totalUnitEntry > 0 || 
           k.afterSales.realisasi > 0 || 
           k.serviceCabang.realisasi > 0 ||
           k.sparepartTunai.realisasi > 0;
  }

  clearKpi() {
    this.patchKpi(initialKpi);
  }

  // ====== SISA HARI KERJA MANAGEMENT ======
  saveSisaHariKerjaOptions(options: Array<{ value: string; name: string }>) {
    this.patchSisaHariKerja({ options });
  }

  setSisaHariKerjaValue(selectedValue: string) {
    this.patchSisaHariKerja({ selectedValue });
  }

  setSisaHariKerjaVisibility(isVisible: boolean) {
    this.patchSisaHariKerja({ isVisible });
  }

  getSisaHariKerjaState(): SisaHariKerjaState {
    return this._state().sisaHariKerja;
  }

  getSisaHariKerjaValue(): string {
    return this._state().sisaHariKerja.selectedValue;
  }

  getSisaHariKerjaNumber(): number | undefined {
    const value = this._state().sisaHariKerja.selectedValue;
    return value ? Number(value) : undefined;
  }

  clearSisaHariKerja() {
    this.patchSisaHariKerja(initialSisaHariKerja);
  }

  // ====== CHARTS MANAGEMENT ======
  saveRealisasiVsTargetChart(data: any) {
    this.patchCharts({ realisasiVsTarget: data });
  }

  saveProfitByBranchChart(data: any) {
    this.patchCharts({ profitByBranch: data });
  }

  saveTrendOverTimeChart(data: any) {
    this.patchCharts({ trendOverTime: data });
  }

  getCharts(): AfterSalesChartsState {
    return this._state().charts;
  }

  clearCharts() {
    this.patchCharts(initialCharts);
  }

  // ====== UTILITY METHODS ======
  getLastUpdated(): Date | null {
    const timestamp = this._state().lastUpdated;
    return timestamp ? new Date(timestamp) : null;
  }

  isDataStale(maxAgeMinutes: number = 30): boolean {
    const lastUpdated = this.getLastUpdated();
    if (!lastUpdated) return true;
    
    const now = new Date();
    const diffMinutes = (now.getTime() - lastUpdated.getTime()) / (1000 * 60);
    return diffMinutes > maxAgeMinutes;
  }

  // ====== RESET HELPERS ======
  clearAll() {
    this._state.set(initialState);
    if (this.isBrowser) {
      try { 
        sessionStorage.removeItem(STORAGE_KEY); 
      } catch {}
    }
  }

  reset() {
    this.clearAll();
  }

  // ====== DEBUG HELPERS ======
  getFullState(): AfterSalesState {
    return this._state();
  }

  logState() {
    console.log('📊 After Sales State:', this._state());
  }

  // ====== STORAGE (hydrate) ======
  private hydrate(): AfterSalesState | null {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<AfterSalesState>;

      // Minimal validation + defaults agar aman bila versi berubah
      return {
        filter: parsed.filter ?? null,
        kpi: {
          afterSales: parsed.kpi?.afterSales ?? { realisasi: 0, target: 0 },
          serviceCabang: parsed.kpi?.serviceCabang ?? { realisasi: 0, target: 0 },
          unitEntry: parsed.kpi?.unitEntry ?? { realisasi: 0, target: 0 },
          sparepartTunai: parsed.kpi?.sparepartTunai ?? { realisasi: 0, target: 0 },
          totalUnitEntry: parsed.kpi?.totalUnitEntry ?? 0,
        },
        sisaHariKerja: {
          options: parsed.sisaHariKerja?.options ?? [],
          selectedValue: parsed.sisaHariKerja?.selectedValue ?? '',
          isVisible: parsed.sisaHariKerja?.isVisible ?? false,
        },
        charts: {
          realisasiVsTarget: parsed.charts?.realisasiVsTarget ?? null,
          profitByBranch: parsed.charts?.profitByBranch ?? null,
          trendOverTime: parsed.charts?.trendOverTime ?? null,
        },
        lastUpdated: parsed.lastUpdated ?? null,
      };
    } catch {
      return null; // korup/blocked → abaikan agar app tetap jalan
    }
  }
}