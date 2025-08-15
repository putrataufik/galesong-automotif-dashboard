// src/app/pages/after-sales-dashboard/after-sales-dashboard.component.ts
import {
  Component,
  inject,
  signal,
  DestroyRef,
  computed,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';

import {
  FilterAftersalesDashboardComponent,
  AfterSalesFilter,
} from '../../shared/components/filter-aftersales-dashboard/filter-aftersales-dashboard.component';
import { KpiCardAsComponent } from '../../shared/components/kpi-card-as/kpi-card-as.component';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';

import { AfterSalesService } from '../../core/services/aftersales.service';
import { AfterSalesStateService } from '../../core/state/after-sales-state.service';
import { AfterSalesResponse, AfterSalesItem } from '../../types/aftersales.model';
import { 
  buildDescendingDayOptions, 
  estimateRemainingWorkdays, 
  isSameMonthYear, 
  normalizeMonth, 
  processAftersalesToKpi,
  formatCompactNumber,
  sumBy,
  toNumberSafe 
} from '../../shared/utils/dashboard-aftersales-kpi.utils';

interface KpiData {
  afterSales: { realisasi: number; target: number };
  serviceCabang: { realisasi: number; target: number };
  unitEntry: { realisasi: number; target: number };
  sparepartTunai: { realisasi: number; target: number };
  totalUnitEntry: number;
  profit: number;
}

// ✅ Interface baru untuk KPI tambahan
interface AdditionalKpiData {
  jumlahMekanik: number;
  jumlahHariKerja: number;
  totalBiayaUsaha: number;
  totalProfit: number;
  totalRevenueRealisasi: number;
}

interface SisaHariOption {
  value: string;
  name: string;
}

@Component({
  selector: 'app-after-sales-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    FilterAftersalesDashboardComponent, 
    KpiCardAsComponent,
    KpiCardComponent // ✅ Import KpiCardComponent
  ],
  templateUrl: './after-sales-dashboard.component.html',
  styleUrls: ['./after-sales-dashboard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AfterSalesDashboardComponent implements OnInit {
  // Services & destroy ref
  private readonly afterSalesService = inject(AfterSalesService);
  private readonly afterSalesState = inject(AfterSalesStateService);
  private readonly destroyRef = inject(DestroyRef);

  // State signals
  loading = signal(false);
  error = signal<string | null>(null);
  kpiData = signal<KpiData | null>(null);
  additionalKpiData = signal<AdditionalKpiData | null>(null); // ✅ Signal baru
  currentFilter = signal<AfterSalesFilter | null>(null);

  // Sisa Hari Kerja (managed by state)
  sisaHariKerja = '';
  sisaHariKerjaOptions: SisaHariOption[] = [];
  showSisaHariKerja = signal(false);

  // ✅ Computed untuk menentukan apakah tampilkan Jumlah Mekanik
  showJumlahMekanik = computed(() => {
    const filter = this.currentFilter();
    if (!filter?.month || filter.month === 'all-month') return false;
    return true;
  });

  // ✅ Computed untuk menentukan apakah tampilkan Jumlah Hari Kerja
  showJumlahHariKerja = computed(() => {
    const filter = this.currentFilter();
    if (!filter?.cabang || filter.cabang === 'all-cabang') return false;
    return true;
  });

  // Computed
  hasData = computed(() => !!this.kpiData());

  // Expose formatCompactNumber ke template
  formatCompactNumber = formatCompactNumber;

  // --------------------------
  // Lifecycle
  // --------------------------
  ngOnInit(): void {
    this.hydrateFromState();
  }

  // --------------------------
  // Public: Aksi & Events
  // --------------------------
  onSearch(filter: AfterSalesFilter): void {
    this.error.set(null);
    this.currentFilter.set(filter);
    this.afterSalesState.saveFilterAfterSales(filter);

    // Fallback sisa hari (sebelum data API ada)
    this.updateSisaHariKerjaOptions(filter);
    this.loading.set(true);

    this.afterSalesService
      .getAfterSalesMonthly(filter.company, filter.period)
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.updateSisaHariKerjaOptions(filter, response.aftersales);

          const processed = this.processAfterSalesData(response, filter);
          const additionalKpi = this.calculateAdditionalKpi(response, filter); // ✅ Hitung KPI tambahan

          this.kpiData.set(processed);
          this.additionalKpiData.set(additionalKpi); // ✅ Set KPI tambahan
          
          // ✅ Simpan ke state
          this.afterSalesState.saveKpi(processed);
          this.afterSalesState.saveAdditionalKpi(additionalKpi);
        },
        error: (err) => {
          console.error('Error fetching after sales data:', err);
          this.error.set('Gagal memuat data after sales. Silakan coba lagi.');
        },
      });
  }

  onSisaHariKerjaChange(): void {
    this.afterSalesState.setSisaHariKerjaValue(this.sisaHariKerja);

    // Memicu re-render KPI cards yang mungkin bergantung pada sisa hari kerja
    if (this.kpiData()) this.kpiData.set({ ...this.kpiData()! });
  }

  // Helpers untuk template
  getSisaHariKerja(): number | undefined {
    return this.afterSalesState.getSisaHariKerjaNumber();
  }

  getTotalUnitEntry(): number {
    return this.kpiData()?.totalUnitEntry || 0;
  }

  // --------------------------
  // Proses Data & KPI
  // --------------------------
  private processAfterSalesData(response: AfterSalesResponse, filter: AfterSalesFilter): KpiData {
    return processAftersalesToKpi(response.aftersales || [], {
      month: filter.month,
      cabang: filter.cabang,
    });
  }

  // ✅ Method baru untuk menghitung KPI tambahan
  private calculateAdditionalKpi(response: AfterSalesResponse, filter: AfterSalesFilter): AdditionalKpiData {
    const rawData = response.aftersales || [];
    console.log('Raw After Sales Data:', rawData);
    
    // Filter data sesuai dengan filter yang diterapkan
    let filteredData = [...rawData];
    
    // Filter berdasarkan bulan
    if (filter.month && filter.month !== 'all-month') {
      const monthStr = String(normalizeMonth(filter.month));
      filteredData = filteredData.filter(item => String(item.month) === monthStr);
    }
    
    // Filter berdasarkan cabang
    if (filter.cabang && filter.cabang !== 'all-cabang') {
      filteredData = filteredData.filter(item => item.cabang_id === filter.cabang);
    }

    // Hitung KPI
    const jumlahMekanik = this.calculateJumlahMekanik(filteredData);
    const jumlahHariKerja = sumBy(filteredData, item => item.hari_kerja);
    const totalBiayaUsaha = sumBy(filteredData, item => item.biaya_usaha);
    const totalProfit = sumBy(filteredData, item => item.profit);
    const totalRevenueRealisasi = sumBy(filteredData, item => item.total_revenue_realisasi);

    return {
      jumlahMekanik,
      jumlahHariKerja,
      totalBiayaUsaha,
      totalProfit,
      totalRevenueRealisasi,
    };
  }

  // ✅ Method untuk menghitung jumlah mekanik unik
  private calculateJumlahMekanik(data: AfterSalesItem[]): number {
    // Untuk menghitung jumlah mekanik unik, kita ambil unique values dari field 'mekanik'
    // Asumsi: field 'mekanik' berisi angka total mekanik per baris
    // Jika data struktur berbeda, sesuaikan logic ini
    
    if (data.length === 0) return 0;
    
    // Opsi 1: Jika 'mekanik' adalah total mekanik per cabang/bulan, ambil sum
    const totalMekanik = sumBy(data, item => item.mekanik);
    
    // Opsi 2: Jika 'mekanik' adalah identifier dan kita perlu unique count
    // const uniqueMekanik = new Set(data.map(item => item.mekanik)).size;
    
    return totalMekanik;
  }

  // --------------------------
  // Util: Sisa Hari Kerja (DRY)
  // --------------------------
  private updateSisaHariKerjaOptions(filter: AfterSalesFilter, apiData?: AfterSalesItem[]): void {
    // Hanya tampil untuk bulan & tahun berjalan
    const monthNum = filter?.month && filter.month !== 'all-month' ? normalizeMonth(filter.month) : null;
    const yearNum = filter?.period ? parseInt(filter.period, 10) : null;
    const shouldShow = isSameMonthYear(monthNum, yearNum);

    if (!shouldShow) {
      this.resetSisaHariState();
      return;
    }

    // Hitung default berdasarkan tanggal hari ini (gunakan data API jika tersedia)
    const monthStr = String(normalizeMonth(filter.month!));
    const dataForMonth = (apiData ?? []).filter((item) => item.month === monthStr);

    const totalHariKerja = dataForMonth?.[0]?.['hari_kerja' as keyof AfterSalesItem];
    const totalHariKerjaNum =
      totalHariKerja == null ? undefined : Number(String(totalHariKerja).replace(/,/g, ''));

    const defaultRemaining = estimateRemainingWorkdays(
      yearNum!,
      monthNum!,
      new Date(),
      totalHariKerjaNum
    );

    // Sembunyikan jika sudah 0 (habis)
    if (defaultRemaining <= 0) {
      this.resetSisaHariState();
      return;
    }

    // Bangun opsi 1..N dan set default terpilih = N
    const options = buildDescendingDayOptions(defaultRemaining);
    this.applySisaHariState(options, String(defaultRemaining));
  }

  private resetSisaHariState(): void {
    this.showSisaHariKerja.set(false);
    this.sisaHariKerja = '';
    this.sisaHariKerjaOptions = [];
    this.afterSalesState.setSisaHariKerjaVisibility(false);
    this.afterSalesState.setSisaHariKerjaValue('');
    this.afterSalesState.saveSisaHariKerjaOptions([]);
  }

  private applySisaHariState(options: SisaHariOption[], selected: string): void {
    this.sisaHariKerjaOptions = options;
    this.sisaHariKerja = selected;
    this.showSisaHariKerja.set(true);
    this.afterSalesState.setSisaHariKerjaVisibility(true);
    this.afterSalesState.saveSisaHariKerjaOptions(options);
    this.afterSalesState.setSisaHariKerjaValue(selected);
  }

  // --------------------------
  // State Hydration
  // --------------------------
  private hydrateFromState(): void {
    const savedFilter = this.afterSalesState.getFilterAfterSales();
    if (savedFilter) this.currentFilter.set(savedFilter);

    const savedKpi = this.afterSalesState.getKpi();
    if (this.afterSalesState.hasKpi()) this.kpiData.set(savedKpi);

    // ✅ Hydrate additional KPI
    const savedAdditionalKpi = this.afterSalesState.getAdditionalKpi();
    if (this.afterSalesState.hasAdditionalKpi()) this.additionalKpiData.set(savedAdditionalKpi);

    const sisaHariState = this.afterSalesState.getSisaHariKerjaState();
    this.sisaHariKerjaOptions = sisaHariState.options;
    this.sisaHariKerja = sisaHariState.selectedValue;
    this.showSisaHariKerja.set(sisaHariState.isVisible);
  }

  // --------------------------
  // Debug & Reset
  // --------------------------
  logCurrentState(): void {
    this.afterSalesState.logState();
  }

  clearAllData(): void {
    this.afterSalesState.clearAll();
    this.kpiData.set(null);
    this.additionalKpiData.set(null); // ✅ Reset KPI tambahan
    this.currentFilter.set(null);
    this.sisaHariKerjaOptions = [];
    this.sisaHariKerja = '';
    this.showSisaHariKerja.set(false);
  }
}