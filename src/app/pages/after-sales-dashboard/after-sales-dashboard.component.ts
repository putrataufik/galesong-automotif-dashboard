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
import {
  AfterSalesResponse,
  AfterSalesItem,
} from '../../types/aftersales.model';
import {
  buildDescendingDayOptions,
  estimateRemainingWorkdays,
  isSameMonthYear,
  normalizeMonth,
  processAftersalesToKpi,
  formatCompactNumber,
  sumBy,
  num,
} from '../../shared/utils/dashboard-aftersales-kpi.utils';
import { ChartData } from '../../types/sales.model';
import { getMonthLabel } from '../../shared/utils/dashboard-chart.utils';
import { LineChartCardComponent } from "../../shared/components/line-chart-card/line-chart-card.component";

interface KpiData {
  afterSales: { realisasi: number; target: number };
  serviceCabang: { realisasi: number; target: number };
  jasaService: { realisasi: number; target: number };
  unitEntry: { realisasi: number; target: number };
  sparepartTunai: { realisasi: number; target: number };
  sparepartBengkel: { realisasi: number; target: number };
  oli: { realisasi: number; target: number };

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

  totalUnitEntry: number;
  profit: number;

  //CPUS SPAREPART BENGKEL #1
  partBengkelExpress: { realisasi: number; target: number };
  partBengkelOli: { realisasi: number; target: number };
  partBengkelOverhoul: { realisasi: number; target: number };
  partBengkelRutin: { realisasi: number; target: number };
  partBengkelSedang: { realisasi: number; target: number };
  partBengkelBerat: { realisasi: number; target: number };
}

// Interface untuk KPI tambahan
interface AdditionalKpiData {
  jumlahMekanik: number;
  jumlahHariKerja: number;
  totalBiayaUsaha: number;
  totalProfit: number;
  totalRevenueRealisasi: number;
  totalProfitRealisasi: number;
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
    KpiCardComponent,
    LineChartCardComponent
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
  additionalKpiData = signal<AdditionalKpiData | null>(null);
  currentFilter = signal<AfterSalesFilter | null>(null);
  totalRevenueChart = signal<ChartData | null>(null);

  // Sisa Hari Kerja (managed by state)
  sisaHariKerja = '';
  sisaHariKerjaOptions: SisaHariOption[] = [];
  showSisaHariKerja = signal(false);

  // Computed untuk menentukan apakah tampilkan Jumlah Mekanik
  showJumlahMekanik = computed(() => {
    const filter = this.currentFilter();
    if (!filter?.month || filter.month === 'all-month') return false;
    return true;
  });

  // Computed untuk menentukan apakah tampilkan Jumlah Hari Kerja
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

  private processRevenueChart(response: AfterSalesResponse): ChartData | null {
    const rawData = response.aftersales || [];
    if (!rawData.length) return null;

    // TIDAK filter by bulan - ambil semua data dalam tahun
    let dataToProcess = [...rawData];
    
    // TETAP filter by cabang jika ada
    const filter = this.currentFilter();
    if (filter?.cabang && filter.cabang !== 'all-cabang') {
      dataToProcess = dataToProcess.filter(item => item.cabang_id === filter.cabang);
    }

    // Group by month - SEMUA bulan dalam tahun
    const monthlyRevenue = dataToProcess.reduce((acc: any, item: any) => {
      const month = item.month;
      if (!acc[month]) {
        acc[month] = 0;
      }
      // Sum total_revenue_realisasi untuk bulan tersebut
      acc[month] += sumBy([item], x => x.total_revenue_realisasi);
      return acc;
    }, {});

    // Sort by month (1-12) dan convert ke format chart
    const sortedMonths = Object.keys(monthlyRevenue).sort((a, b) => Number(a) - Number(b));
    
    const chartLabels = sortedMonths.map(month => getMonthLabel(month)); // Jan, Feb, Mar...
    const revenueData = sortedMonths.map(month => monthlyRevenue[month]);

    return {
      labels: chartLabels,
      data: revenueData
    };
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
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (response) => {
          this.updateSisaHariKerjaOptions(filter, response.aftersales);

          const revenueChart = this.processRevenueChart(response);
          const processed = this.processAfterSalesData(response, filter);
          const additionalKpi = this.calculateAdditionalKpi(response, filter);

          this.kpiData.set(processed);
          this.additionalKpiData.set(additionalKpi);
          this.totalRevenueChart.set(revenueChart);

          console.log('data Chart:', revenueChart);

          // ✅ Simpan ke state
          this.afterSalesState.saveKpi(processed);
          this.afterSalesState.saveAdditionalKpi(additionalKpi);
          this.afterSalesState.saveTotalRevenueChart(revenueChart); // ✅ Simpan chart ke state

          console.log('Processed KPI Data:', processed);
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
  private processAfterSalesData(
    response: AfterSalesResponse,
    filter: AfterSalesFilter
  ): KpiData {
    return processAftersalesToKpi(response.aftersales || [], {
      month: filter.month,
      cabang: filter.cabang,
    });
  }

  private calculateAdditionalKpi(
    response: AfterSalesResponse,
    filter: AfterSalesFilter
  ): AdditionalKpiData {
    const rawData = response.aftersales || [];
    console.log('Raw After Sales Data:', rawData);

    // Filter data sesuai dengan filter yang diterapkan
    let filteredData = [...rawData];

    // Filter berdasarkan bulan
    if (filter.month && filter.month !== 'all-month') {
      const monthStr = String(normalizeMonth(filter.month));
      filteredData = filteredData.filter(
        (item) => String(item.month) === monthStr
      );
    }

    // Filter berdasarkan cabang
    if (filter.cabang && filter.cabang !== 'all-cabang') {
      filteredData = filteredData.filter(
        (item) => item.cabang_id === filter.cabang
      );
    }

    // Hitung ADDITIONAL KPI
    const jumlahMekanik = this.calculateJumlahMekanik(filteredData);
    const jumlahHariKerja = sumBy(filteredData, (item) => item.hari_kerja);
    const totalBiayaUsaha = sumBy(filteredData, (item) => item.biaya_usaha);
    const totalProfit = sumBy(filteredData, (item) => item.profit);
    const totalRevenueRealisasi = sumBy(
      filteredData,
      (item) => item.total_revenue_realisasi
    );
    const totalProfitRealisasi = sumBy(
      filteredData,
      (r) =>
        num(r.jasa_service_realisasi) +
        0.2 *
          (num(r.after_sales_realisasi) -
            (num(r.jasa_service_realisasi) + num(r.part_bengkel_realisasi))) +
        0.17 * num(r.part_bengkel_realisasi) +
        0.17 * num(r.part_tunai_realisasi) -
        num(r.biaya_usaha)
    );

    return {
      jumlahMekanik,
      jumlahHariKerja,
      totalBiayaUsaha,
      totalProfit,
      totalRevenueRealisasi,
      totalProfitRealisasi,
    };
  }

  // Method untuk menghitung jumlah mekanik unik
  private calculateJumlahMekanik(data: AfterSalesItem[]): number {
    if (data.length === 0) return 0;

    // Opsi 1: Jika 'mekanik' adalah total mekanik per cabang/bulan, ambil sum
    const totalMekanik = sumBy(data, (item) => item.mekanik);
    return totalMekanik;
  }

  // --------------------------
  // Util: Sisa Hari Kerja (DRY)
  // --------------------------
  private updateSisaHariKerjaOptions(
    filter: AfterSalesFilter,
    apiData?: AfterSalesItem[]
  ): void {
    // Hanya tampil untuk bulan & tahun berjalan
    const monthNum =
      filter?.month && filter.month !== 'all-month'
        ? normalizeMonth(filter.month)
        : null;
    const yearNum = filter?.period ? parseInt(filter.period, 10) : null;
    const shouldShow = isSameMonthYear(monthNum, yearNum);

    if (!shouldShow) {
      this.resetSisaHariState();
      return;
    }

    // Hitung default berdasarkan tanggal hari ini (gunakan data API jika tersedia)
    const monthStr = String(normalizeMonth(filter.month!));
    const dataForMonth = (apiData ?? []).filter(
      (item) => item.month === monthStr
    );

    const totalHariKerja =
      dataForMonth?.[0]?.['hari_kerja' as keyof AfterSalesItem];
    const totalHariKerjaNum =
      totalHariKerja == null
        ? undefined
        : Number(String(totalHariKerja).replace(/,/g, ''));

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

  private applySisaHariState(
    options: SisaHariOption[],
    selected: string
  ): void {
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

    // Hydrate additional KPI
    const savedAdditionalKpi = this.afterSalesState.getAdditionalKpi();
    if (this.afterSalesState.hasAdditionalKpi())
      this.additionalKpiData.set(savedAdditionalKpi);

    // ✅ Hydrate chart data
    const savedTotalRevenueChart = this.afterSalesState.getTotalRevenueChart();
    if (savedTotalRevenueChart) this.totalRevenueChart.set(savedTotalRevenueChart);

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
    this.additionalKpiData.set(null);
    this.totalRevenueChart.set(null); // ✅ Reset chart data
    this.currentFilter.set(null);
    this.sisaHariKerjaOptions = [];
    this.sisaHariKerja = '';
    this.totalRevenueChart.set(null);
  }
}