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
  profit: number;
}

// ✅ TYPES: Additional KPI
export interface AdditionalKpiSnapshot {
  jumlahMekanik: number;
  jumlahHariKerja: number;
  totalBiayaUsaha: number;
  totalProfit: number;
  totalRevenueRealisasi:number;
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
  additionalKpi: AdditionalKpiSnapshot; // ✅ Tambah additional KPI
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
  profit: 0,
};

// ✅ Initial Additional KPI
const initialAdditionalKpi: AdditionalKpiSnapshot = {
  jumlahMekanik: 0,
  jumlahHariKerja: 0,
  totalBiayaUsaha: 0,
  totalProfit: 0,
  totalRevenueRealisasi: 0, 
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
  additionalKpi: initialAdditionalKpi, // ✅ Include additional KPI
  sisaHariKerja: initialSisaHariKerja,
  charts: initialCharts,
  lastUpdated: null,
};

// ====== STORAGE CONFIG ======
const STORAGE_KEY = 'afterSalesState:v2'; // ✅ Bump version untuk schema change

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

  // ✅ Patch helper for additional KPI
  private patchAdditionalKpi(partial: Partial<AdditionalKpiSnapshot>) {
    this._state.update((s) => ({ 
      ...s, 
      additionalKpi: { ...s.additionalKpi, ...partial },
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
  saveFilterAfterSales(filter: AfterSalesFilter) { 
    this.patch({ filter }); 
  }

  getFilterAfterSales(): AfterSalesFilter | null {
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
      profit: kpi.profit ?? this._state().kpi.profit,
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

  // ✅ ADDITIONAL KPI MANAGEMENT
  saveAdditionalKpi(additionalKpi: Partial<AdditionalKpiSnapshot>) {
    this.patchAdditionalKpi({
      jumlahMekanik: additionalKpi.jumlahMekanik ?? this._state().additionalKpi.jumlahMekanik,
      jumlahHariKerja: additionalKpi.jumlahHariKerja ?? this._state().additionalKpi.jumlahHariKerja,
      totalBiayaUsaha: additionalKpi.totalBiayaUsaha ?? this._state().additionalKpi.totalBiayaUsaha,
      totalProfit: additionalKpi.totalProfit ?? this._state().additionalKpi.totalProfit,
      totalRevenueRealisasi: additionalKpi.totalRevenueRealisasi ?? this._state().additionalKpi.totalRevenueRealisasi
    });
  }

  getAdditionalKpi(): AdditionalKpiSnapshot {
    return this._state().additionalKpi;
  }

  hasAdditionalKpi(): boolean {
    const k = this._state().additionalKpi;
    return k.jumlahMekanik > 0 || 
           k.jumlahHariKerja > 0 || 
           k.totalBiayaUsaha > 0 || 
           k.totalProfit !== 0; // profit bisa negatif, jadi cek !== 0
           k.totalRevenueRealisasi > 0; // Tambah cek totalRevenueRealisasi
  }

  clearAdditionalKpi() {
    this.patchAdditionalKpi(initialAdditionalKpi);
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
          profit: parsed.kpi?.profit ?? 0,
        },
        // ✅ Hydrate additional KPI
        additionalKpi: {
          jumlahMekanik: parsed.additionalKpi?.jumlahMekanik ?? 0,
          jumlahHariKerja: parsed.additionalKpi?.jumlahHariKerja ?? 0,
          totalBiayaUsaha: parsed.additionalKpi?.totalBiayaUsaha ?? 0,
          totalProfit: parsed.additionalKpi?.totalProfit ?? 0,
          totalRevenueRealisasi: parsed.additionalKpi?.totalRevenueRealisasi ?? 0,
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