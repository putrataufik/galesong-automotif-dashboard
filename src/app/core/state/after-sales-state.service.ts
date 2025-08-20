// =============================
// src/app/core/state/after-sales-state.service.ts
// =============================
import { Injectable, signal, effect, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AfterSalesFilter } from '../../shared/components/filter-aftersales-dashboard/filter-aftersales-dashboard.component';
import { ChartData } from '../../types/sales.model';

// === TYPES: After Sales KPI ===
export interface AfterSalesKpiSnapshot {
  afterSales: { realisasi: number; target: number };
  serviceCabang: { realisasi: number; target: number };
  jasaService: { realisasi: number; target: number };
  unitEntry: { realisasi: number; target: number };
  sparepartTunai: { realisasi: number; target: number };
  sparepartBengkel: {realisasi: number; target: number};
  oli: {realisasi: number; target: number};
  totalUnitEntry: number;
  profit: number;
  // CPUS SERVICE
  jasaServiceBerat: { realisasi: number; target: number };
  jasaServiceBodyRepair: { realisasi: number; target: number };
  jasaServiceExpress: { realisasi: number; target: number };
  jasaServiceKelistrikan: { realisasi: number; target: number };
  jasaServiceOli: { realisasi: number; target: number };
  jasaServiceOverSize: { realisasi: number; target: number };
  jasaServiceOverhoul: { realisasi: number; target: number };
  jasaServicePdc: { realisasi: number; target: number };
  jasaServiceRutin: { realisasi: number; target: number };
  jasaServiceSedang: { realisasi: number; target: number };
  
  // Non CPUS Service
  jasaServiceClaim: { realisasi: number; target: number };
  jasaServiceKupon: { realisasi: number; target: number };
  jasaServiceCvt: { realisasi: number; target: number };
  
  // Tambahan untuk sparepart
  partBengkelExpress: { realisasi: number; target: number };
  partBengkelOli: { realisasi: number; target: number };
  partBengkelOverhoul: { realisasi: number; target: number };
  partBengkelRutin: { realisasi: number; target: number };
  partBengkelSedang: { realisasi: number; target: number };
  partBengkelBerat: { realisasi: number; target: number };

}

// ✅ TYPES: Additional KPI
export interface AdditionalKpiSnapshot {
  jumlahMekanik: number;
  jumlahHariKerja: number;
  totalBiayaUsaha: number;
  totalProfit: number;
  totalRevenueRealisasi:number;
  totalProfitRealisasi: number;
}

// === TYPES: Sisa Hari Kerja ===
export interface SisaHariKerjaState {
  options: Array<{ value: string; name: string }>;
  selectedValue: string;
  isVisible: boolean;
}

// === TYPES: Charts ===
export interface AfterSalesChartsState {
  realisasiVsTarget: ChartData | null;
  profitByBranch: ChartData | null;
  totalRevenue: ChartData | null; // ✅ Tambah chart total revenue
  trendOverTime: ChartData | null;
}

// === STATE ROOT ===
interface AfterSalesState {
  filter: AfterSalesFilter | null;
  kpi: AfterSalesKpiSnapshot;
  additionalKpi: AdditionalKpiSnapshot;
  sisaHariKerja: SisaHariKerjaState;
  charts: AfterSalesChartsState;
  lastUpdated: number | null;
}

// ====== INITIALS ======
const initialKpi: AfterSalesKpiSnapshot = {
  afterSales: { realisasi: 0, target: 0 },
  serviceCabang: { realisasi: 0, target: 0 },
  jasaService: { realisasi: 0, target: 0 },
  unitEntry: { realisasi: 0, target: 0 },
  sparepartTunai: { realisasi: 0, target: 0 },
  sparepartBengkel: {realisasi: 0, target: 0},
  oli: {realisasi:0, target:0},
  totalUnitEntry: 0,
  profit: 0,
  jasaServiceBerat: { realisasi: 0, target: 0 },
  jasaServiceBodyRepair: { realisasi: 0, target: 0 },
  jasaServiceExpress: { realisasi: 0, target: 0 },
  jasaServiceKelistrikan: { realisasi: 0, target: 0 },
  jasaServiceOli: { realisasi: 0, target: 0 },
  jasaServiceOverSize: { realisasi: 0, target: 0 },
  jasaServiceOverhoul: { realisasi: 0, target: 0 },
  jasaServicePdc: { realisasi: 0, target: 0 },
  jasaServiceRutin: { realisasi: 0, target: 0 },
  jasaServiceSedang: { realisasi: 0, target: 0 },
  jasaServiceClaim: { realisasi: 0, target: 0 },
  jasaServiceKupon: { realisasi: 0, target: 0 },
  jasaServiceCvt: { realisasi: 0, target: 0 },

  partBengkelExpress: { realisasi: 0, target: 0 },
  partBengkelOli: { realisasi: 0, target: 0 },
  partBengkelOverhoul: { realisasi: 0, target: 0 },
  partBengkelRutin: { realisasi: 0, target: 0 },
  partBengkelSedang: { realisasi: 0, target: 0 },
  partBengkelBerat: { realisasi: 0, target: 0 },


};

// ✅ Initial Additional KPI
const initialAdditionalKpi: AdditionalKpiSnapshot = {
  jumlahMekanik: 0,
  jumlahHariKerja: 0,
  totalBiayaUsaha: 0,
  totalProfit: 0,
  totalRevenueRealisasi: 0, 
  totalProfitRealisasi:0,
};

const initialSisaHariKerja: SisaHariKerjaState = {
  options: [],
  selectedValue: '',
  isVisible: false,
};

const initialCharts: AfterSalesChartsState = {
  realisasiVsTarget: null,
  profitByBranch: null,
  totalRevenue: null, // ✅ Initial null untuk total revenue chart
  trendOverTime: null,
};

const initialState: AfterSalesState = {
  filter: null,
  kpi: initialKpi,
  additionalKpi: initialAdditionalKpi,
  sisaHariKerja: initialSisaHariKerja,
  charts: initialCharts,
  lastUpdated: null,
};

// ====== STORAGE CONFIG ======
const STORAGE_KEY = 'afterSalesState:v3'; // ✅ Bump version untuk schema change

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
      jasaService: kpi.jasaService ?? this._state().kpi.jasaService,
      unitEntry: kpi.unitEntry ?? this._state().kpi.unitEntry,
      sparepartTunai: kpi.sparepartTunai ?? this._state().kpi.sparepartTunai,
      sparepartBengkel: kpi.sparepartBengkel ?? this._state().kpi.sparepartBengkel,
      oli: kpi.oli ?? this._state().kpi.oli,
      jasaServiceBerat: kpi.jasaServiceBerat ?? this._state().kpi.jasaServiceBerat,
      jasaServiceBodyRepair: kpi.jasaServiceBodyRepair ?? this._state().kpi.jasaServiceBodyRepair,
      jasaServiceExpress: kpi.jasaServiceExpress ?? this._state().kpi.jasaServiceExpress,
      jasaServiceKelistrikan: kpi.jasaServiceKelistrikan ?? this._state().kpi.jasaServiceKelistrikan,
      jasaServiceOli: kpi.jasaServiceOli ?? this._state().kpi.jasaServiceOli,
      jasaServiceOverSize: kpi.jasaServiceOverSize ?? this._state().kpi.jasaServiceOverSize,
      jasaServiceOverhoul: kpi.jasaServiceOverhoul ?? this._state().kpi.jasaServiceOverhoul,
      jasaServicePdc: kpi.jasaServicePdc ?? this._state().kpi.jasaServicePdc,
      jasaServiceRutin: kpi.jasaServiceRutin ?? this._state().kpi.jasaServiceRutin,
      jasaServiceSedang: kpi.jasaServiceSedang ?? this._state().kpi.jasaServiceSedang,
      jasaServiceClaim: kpi.jasaServiceClaim ?? this._state().kpi.jasaServiceClaim,
      jasaServiceKupon: kpi.jasaServiceKupon ?? this._state().kpi.jasaServiceKupon,
      jasaServiceCvt: kpi.jasaServiceCvt ?? this._state().kpi.jasaServiceCvt,

      partBengkelExpress: kpi.partBengkelExpress?? this._state().kpi.partBengkelExpress,
      partBengkelOli: kpi.partBengkelOli ?? this._state().kpi.partBengkelOli,
      partBengkelOverhoul: kpi.partBengkelOverhoul ?? this._state().kpi.partBengkelOverhoul,
      partBengkelRutin: kpi.partBengkelRutin ?? this._state().kpi.partBengkelRutin,
      partBengkelSedang: kpi.partBengkelSedang ?? this._state().kpi.partBengkelSedang,
      partBengkelBerat: kpi.partBengkelBerat ?? this._state().kpi.partBengkelBerat,

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

  // ====== ADDITIONAL KPI MANAGEMENT ======
  saveAdditionalKpi(additionalKpi: Partial<AdditionalKpiSnapshot>) {
    this.patchAdditionalKpi({
      jumlahMekanik: additionalKpi.jumlahMekanik ?? this._state().additionalKpi.jumlahMekanik,
      jumlahHariKerja: additionalKpi.jumlahHariKerja ?? this._state().additionalKpi.jumlahHariKerja,
      totalBiayaUsaha: additionalKpi.totalBiayaUsaha ?? this._state().additionalKpi.totalBiayaUsaha,
      totalProfit: additionalKpi.totalProfit ?? this._state().additionalKpi.totalProfit,
      totalRevenueRealisasi: additionalKpi.totalRevenueRealisasi ?? this._state().additionalKpi.totalRevenueRealisasi,
      totalProfitRealisasi: additionalKpi.totalProfitRealisasi ?? this._state().additionalKpi.totalProfitRealisasi
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
           k.totalProfit !== 0 ||
           k.totalRevenueRealisasi > 0;
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
  saveRealisasiVsTargetChart(data: ChartData | null) {
    this.patchCharts({ realisasiVsTarget: data });
  }

  getRealisasiVsTargetChart(): ChartData | null {
    return this._state().charts.realisasiVsTarget;
  }

  saveProfitByBranchChart(data: ChartData | null) {
    this.patchCharts({ profitByBranch: data });
  }

  getProfitByBranchChart(): ChartData | null {
    return this._state().charts.profitByBranch;
  }

  // ✅ TOTAL REVENUE CHART MANAGEMENT
  saveTotalRevenueChart(data: ChartData | null) {
    this.patchCharts({ totalRevenue: data });
  }

  getTotalRevenueChart(): ChartData | null {
    return this._state().charts.totalRevenue;
  }

  saveTrendOverTimeChart(data: ChartData | null) {
    this.patchCharts({ trendOverTime: data });
  }

  getTrendOverTimeChart(): ChartData | null {
    return this._state().charts.trendOverTime;
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
          jasaService: parsed.kpi?.jasaService ?? { realisasi: 0, target: 0 },
          unitEntry: parsed.kpi?.unitEntry ?? { realisasi: 0, target: 0 },
          sparepartTunai: parsed.kpi?.sparepartTunai ?? { realisasi: 0, target: 0 },
          sparepartBengkel: parsed.kpi?.sparepartBengkel?? { realisasi: 0, target: 0},
          oli: parsed.kpi?.oli ?? { realisasi: 0, target: 0 },

          jasaServiceBerat: parsed.kpi?.jasaServiceBerat ?? { realisasi: 0, target: 0 },
          jasaServiceBodyRepair: parsed.kpi?.jasaServiceBodyRepair ?? { realisasi: 0, target: 0 },
          jasaServiceExpress: parsed.kpi?.jasaServiceExpress ?? { realisasi: 0, target: 0 },
          jasaServiceKelistrikan: parsed.kpi?.jasaServiceKelistrikan ?? { realisasi: 0, target: 0 },
          jasaServiceOli: parsed.kpi?.jasaServiceOli ?? { realisasi: 0, target: 0 },
          jasaServiceOverSize: parsed.kpi?.jasaServiceOverSize ?? { realisasi: 0, target: 0 },
          jasaServiceOverhoul: parsed.kpi?.jasaServiceOverhoul ?? { realisasi: 0, target: 0 },
          jasaServicePdc: parsed.kpi?.jasaServicePdc ?? { realisasi: 0, target: 0 },
          jasaServiceRutin: parsed.kpi?.jasaServiceRutin ?? { realisasi: 0, target: 0 },
          jasaServiceSedang: parsed.kpi?.jasaServiceSedang ?? { realisasi: 0, target: 0 },
          jasaServiceClaim: parsed.kpi?.jasaServiceClaim ?? { realisasi: 0, target: 0 },
          jasaServiceKupon: parsed.kpi?.jasaServiceKupon ?? { realisasi: 0, target: 0 },
          jasaServiceCvt: parsed.kpi?.jasaServiceCvt ?? { realisasi: 0, target: 0 },
          
          partBengkelExpress: parsed.kpi?.partBengkelExpress ?? { realisasi: 0, target: 0 },
          partBengkelOli: parsed.kpi?.partBengkelOli ?? { realisasi: 0, target: 0 },
          partBengkelOverhoul: parsed.kpi?.partBengkelOverhoul ?? { realisasi: 0, target: 0 },
          partBengkelRutin: parsed.kpi?.partBengkelRutin ?? { realisasi: 0, target: 0 },
          partBengkelSedang: parsed.kpi?.partBengkelSedang ?? { realisasi: 0, target: 0 },
          partBengkelBerat: parsed.kpi?.partBengkelBerat ?? { realisasi: 0, target: 0 },

          totalUnitEntry: parsed.kpi?.totalUnitEntry ?? 0,
          profit: parsed.kpi?.profit ?? 0,
        },
        additionalKpi: {
          jumlahMekanik: parsed.additionalKpi?.jumlahMekanik ?? 0,
          jumlahHariKerja: parsed.additionalKpi?.jumlahHariKerja ?? 0,
          totalBiayaUsaha: parsed.additionalKpi?.totalBiayaUsaha ?? 0,
          totalProfit: parsed.additionalKpi?.totalProfit ?? 0,
          totalRevenueRealisasi: parsed.additionalKpi?.totalRevenueRealisasi ?? 0,
          totalProfitRealisasi: parsed.additionalKpi?.totalProfitRealisasi ?? 0
        },
        sisaHariKerja: {
          options: parsed.sisaHariKerja?.options ?? [],
          selectedValue: parsed.sisaHariKerja?.selectedValue ?? '',
          isVisible: parsed.sisaHariKerja?.isVisible ?? false,
        },
        charts: {
          realisasiVsTarget: parsed.charts?.realisasiVsTarget ?? null,
          profitByBranch: parsed.charts?.profitByBranch ?? null,
          totalRevenue: parsed.charts?.totalRevenue ?? null, // ✅ Hydrate total revenue chart
          trendOverTime: parsed.charts?.trendOverTime ?? null,
        },
        lastUpdated: parsed.lastUpdated ?? null,
      };
    } catch {
      return null;
    }
  }
}