// src/app/pages/after-sales-dashboard/after-sales-dashboard.component.ts
import {
  Component,
  inject,
  signal,
  DestroyRef,
  computed,
  OnInit,
  ChangeDetectionStrategy,
  HostListener,
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
  KpiData,
  AdditionalKpiData,
  SisaHariOption,
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
  buildRevenueChartData,
  processAfterSalesDistribution,
} from '../../shared/utils/dashboard-aftersales-kpi.utils';
import { ChartData } from '../../types/sales.model';
import { LineChartCardComponent } from '../../shared/components/line-chart-card/line-chart-card.component';
import { KpiLegendButtonComponent } from '../../shared/components/kpi-legend-button/kpi-legend-button.component';
import { PieChartCardComponent } from '../../shared/components/pie-chart-card/pie-chart-card.component';
import {
  getSeriesCurrent as getSeriesCurrentUtil,
} from '../../shared/utils/sales.utils';
@Component({
  selector: 'app-after-sales-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FilterAftersalesDashboardComponent,
    KpiCardAsComponent,
    KpiCardComponent,
    LineChartCardComponent,
    KpiLegendButtonComponent,
    PieChartCardComponent,
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
  afterSalesDistribution = signal<ChartData | null>(null);

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

  legendOpen = false;

  toggleLegend(event: MouseEvent) {
    event.stopPropagation(); // cegah close karena click document
    this.legendOpen = !this.legendOpen;
  }

  @HostListener('document:click')
  closeLegendOnOutsideClick() {
    if (this.legendOpen) this.legendOpen = false;
  }

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
  getCompanyDisplayName(company: string): string {
    const companyMap: Record<string, string> = {
      'sinar-galesong-mobilindo': 'Sinar Galesong Mobilindo',
      'pt-galesong-otomotif': 'PT Galesong Otomotif',
      'all-company': 'Semua Perusahaan',
    };
    return companyMap[company] || company;
  }

  /**
   * Get display name for category filter
   */
  getCategoryDisplayName(category: string): string {
    const categoryMap: Record<string, string> = {
      'all-category': 'Semua Kategori',
      sales: 'Sales',
      'after-sales': 'After Sales',
    };
    return categoryMap[category] || category;
  }

  /**
   * Get display name for branch filter
   */
  getBranchDisplayName(branch: string): string {
    const branchMap: Record<string, string> = {
      'all-cabang': 'Semua Cabang',
      '0050': 'Pettarani',
      '0051': 'Palu',
      '0052': 'Kendari',
      '0053': 'Gorontalo',
      '0054': 'Palopo',
    };
    return branchMap[branch] || branch;
  }

  /**
   * Get display name for period (year + month)
   */
  getPeriodDisplayName(): string {
    const year = this.currentFilter()?.period;
    const month = this.currentFilter()?.month;

    const monthMap: Record<string, string> = {
      'all-month': 'Semua Bulan',
      '01': 'Januari',
      '02': 'Februari',
      '03': 'Maret',
      '04': 'April',
      '05': 'Mei',
      '06': 'Juni',
      '07': 'Juli',
      '08': 'Agustus',
      '09': 'September',
      '10': 'Oktober',
      '11': 'November',
      '12': 'Desember',
    };

    const yearDisplay = year || 'Semua Tahun';
    const monthDisplay = monthMap[month || 'all-month'] || month;

    if (month === 'all-month' || !month) {
      return yearDisplay;
    }

    return `${monthDisplay} ${yearDisplay}`;
  }

  get compare(): boolean {
    return this.currentFilter()?.compare ?? false;
  }

  private makeRevenueChart(
    response: AfterSalesResponse,
    filter: AfterSalesFilter
  ): ChartData | null {
    return buildRevenueChartData(response.aftersales, {
      cabang: filter.cabang,
      includeEmptyMonths: false,
    });
  }

  private makeAfterSalesDistribution(
    response: AfterSalesResponse,
    filter: AfterSalesFilter
  ): ChartData | null {
    return processAfterSalesDistribution(response.aftersales, {
      cabang: filter.cabang,
      month: filter.month,
      includeEmptyMonths: false,
    });
  }

  // --------------------------
  // Public: Aksi & Events
  // --------------------------

  periodForCards = computed<
  { year: number; month?: number } | null
>(() => {
  const f = this.currentFilter();
  if (!f?.period) return null;

  const year = parseInt(f.period, 10);
  if (!Number.isFinite(year)) return null;

  // Jika month ada & bukan "all-month" → mode bulanan
  const month =
    f.month && f.month !== 'all-month'
      ? normalizeMonth(f.month) // hasil number 1..12
      : undefined;

  return month ? { year, month } : { year };
});
  onSearch(filter: AfterSalesFilter): void {
    console.log('AfterSalesDashboardComponent: onSearch', this.currentFilter(), filter);
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

          const revenueChart = this.makeRevenueChart(response, filter);
          const processed = this.processAfterSalesData(response, filter);
          const additionalKpi = this.calculateAdditionalKpi(response, filter);
          const afterSalesDistribution = this.makeAfterSalesDistribution(
            response,
            filter
          );

          this.kpiData.set(processed);
          this.additionalKpiData.set(additionalKpi);
          this.totalRevenueChart.set(revenueChart);
          this.afterSalesDistribution.set(afterSalesDistribution);

          // ✅ Simpan ke state
          this.afterSalesState.saveKpi(processed);
          this.afterSalesState.saveAdditionalKpi(additionalKpi);
          this.afterSalesState.saveTotalRevenueChart(revenueChart);
          this.afterSalesState.saveAfterSalesDistribution(
            afterSalesDistribution
          );
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
    if (savedTotalRevenueChart)
      this.totalRevenueChart.set(savedTotalRevenueChart);

    const savedAfterSalesDistribution =
      this.afterSalesState.getAfterSalesDistribution();
    if (savedAfterSalesDistribution)
      this.afterSalesDistribution.set(savedAfterSalesDistribution);

    const sisaHariState = this.afterSalesState.getSisaHariKerjaState();
    this.sisaHariKerjaOptions = sisaHariState.options;
    this.sisaHariKerja = sisaHariState.selectedValue;
    this.showSisaHariKerja.set(sisaHariState.isVisible);
  }

  clearAllData(): void {
    this.afterSalesState.clearAll();
    this.kpiData.set(null);
    this.additionalKpiData.set(null);
    this.totalRevenueChart.set(null);
    this.currentFilter.set(null);
    this.sisaHariKerjaOptions = [];
    this.sisaHariKerja = '';
  }
}

