// src/app/pages/after-sales-dashboard/after-sales-dashboard.component.ts
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Components
import { FilterAfterSalesComponent } from '../../shared/components/filter-after-sales/filter-after-sales.component';
import { KpiCardAsComponent } from '../../shared/components/kpi-card-as/kpi-card-as.component';

// Services & State
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardStateService } from '../../core/state/dashboard-state.service';

// Utils & Types
import {
  calculateAfterSalesKpi,
  AfterSalesKpiData,
  formatCompactNumber,
} from '../../shared/utils/dashboard-aftersales-kpi.utils';
import {
  processAfterSalesRealisasiVsTargetData,
  processAfterSalesProfitByBranchData,
} from '../../shared/utils/dashboard-chart.utils';
import { ChartData } from '../../types/sales.model';
import { AfterSalesFilter } from '../../types/filter.model';
import { finalize, take } from 'rxjs';

// ✅ Default filter saat pertama kali load / setelah refresh
const DEFAULT_AFTERSALES_FILTER: AfterSalesFilter = {
  company: '',                // biarkan user pilih
  branch: '',                 // '' = semua cabang
  period: String(new Date().getFullYear()), // Tahun ini
  month: 'all-month',         // Konsisten dengan FilterAfterSalesComponent
};

@Component({
  selector: 'app-after-sales-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, FilterAfterSalesComponent, KpiCardAsComponent],
  templateUrl: './after-sales-dashboard.component.html',
  styleUrls: ['./after-sales-dashboard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AfterSalesDashboardComponent implements OnInit {
  private api = inject(DashboardService);
  private state = inject(DashboardStateService);

  // Expose utils
  formatCompactNumber = formatCompactNumber;

  // UI state
  loading = signal(false);
  error = signal<string | null>(null);

  // Filter state (dioper ke child sebagai initialFilter)
  prefilledFilter: AfterSalesFilter | null = null;

  // Day selector (untuk "harapan target")
  dayOptions: number[] = Array.from({ length: 31 }, (_, i) => i + 1);
  selectedDay = signal<number | null>(null);

  // Data signals
  afterSalesKpi = signal<AfterSalesKpiData | null>(null);
  kpiCards = signal<any[]>([]);
  realisasiVsTargetChart = signal<ChartData | null>(null);
  profitByBranchChart = signal<ChartData | null>(null);

  // Getter ala DashboardComponent
  get hasData(): boolean {
    return !!(
      this.afterSalesKpi() ||
      this.realisasiVsTargetChart() ||
      this.profitByBranchChart() ||
      (this.kpiCards()?.length ?? 0) > 0
    );
  }
  get isDataEmpty(): boolean {
    return !this.hasData && !this.loading();
  }

  // ❌ Hapus load di constructor; jangan melempar error di ngOnInit
  ngOnInit(): void {
    this.loadPersistedData();
  }

  /* =================== Load Persisted =================== */
  private loadPersistedData(): void {
    // Filter
    const savedFilter = this.state.getFilterAfterSales?.();
    if (savedFilter) {
      this.prefilledFilter = savedFilter;
    } else {
      // → kalau belum ada, pakai default dan simpan agar konsisten saat refresh berikutnya
      this.prefilledFilter = DEFAULT_AFTERSALES_FILTER;
      this.state.saveFilterAfterSales?.(DEFAULT_AFTERSALES_FILTER);
    }

    // KPI
    const savedKpi = this.state.getAfterSalesKpi?.();
    if (savedKpi) {
      this.afterSalesKpi.set(savedKpi);
      this.kpiCards.set(this.buildKpiCards(savedKpi, this.selectedDay()));
    }

    // Charts
    const savedRealisasiVsTarget = this.state.getAfterSalesRealisasiVsTarget?.();
    if (savedRealisasiVsTarget) this.realisasiVsTargetChart.set(savedRealisasiVsTarget);

    const savedProfitByBranch = this.state.getAfterSalesProfitByBranch?.();
    if (savedProfitByBranch) this.profitByBranchChart.set(savedProfitByBranch);
  }

  /* =================== Search Flow =================== */
  onSearch(filter: AfterSalesFilter): void {
    this.error.set(null);
    this.prepareForNewSearch(filter);

    // Validasi minimum: butuh company & period untuk panggil API
    if (!filter.company || !filter.period) {
      this.error.set('Silakan pilih perusahaan (company) dan periode (period) terlebih dahulu.');
      return; // Jangan panggil API kalau belum lengkap
    }

    this.executeSearch(filter);
  }

  private prepareForNewSearch(filter: AfterSalesFilter): void {
    // 1) Lepaskan data lama dulu agar GC bisa kerja
    this.state.clearAfterSales?.();   // ← Pindahkan ke atas
  
    // 2) Simpan filter baru
    this.state.saveFilterAfterSales?.(filter);
  
    // 3) Update local
    this.prefilledFilter = filter;
  
    // 4) Clear local signals (opsional tapi bagus untuk UI)
    this.afterSalesKpi.set(null);
    this.kpiCards.set([]);
    this.realisasiVsTargetChart.set(null);
    this.profitByBranchChart.set(null);
  }

  private destroyRef = inject(DestroyRef);
  private executeSearch(filter: AfterSalesFilter): void {
    this.loading.set(true);
  
    const branchParam = filter.branch ? filter.branch : undefined;
  
    this.api.getAfterSalesMonthly(filter.company, filter.period, branchParam)
      .pipe(
        take(1),                                  // http completes once; sabuk pengaman
        takeUntilDestroyed(this.destroyRef),      // auto cleanup bila komponen destroy
        finalize(() => this.loading.set(false)),  // selalu matikan loading
      )
      .subscribe({
        next: (response) => this.processApiResponse(response),
        error: (err) => this.handleError(err), // jangan set loading di sini lagi (sudah di finalize)
      });
  }

  /* =================== Process Response =================== */
  private processApiResponse(response: any): void {
    try {
      const aftersalesData = response?.aftersales ?? [];

      if (!Array.isArray(aftersalesData) || aftersalesData.length === 0) {
        this.error.set('Tidak ada data after sales untuk filter yang dipilih.');
        return;
      }

      // KPI
      const kpi = calculateAfterSalesKpi(aftersalesData);
      this.afterSalesKpi.set(kpi);
      this.state.saveAfterSalesKpi?.({
        totalRevenueRealisasi: kpi.totalRevenueRealisasi,
        totalBiayaUsaha: kpi.totalBiayaUsaha,
        totalProfit: kpi.totalProfit,
        totalHariKerja: kpi.totalHariKerja,
        serviceCabang: kpi.serviceCabang,
        afterSalesRealisasi: kpi.afterSalesRealisasi,
        afterSalesTarget: kpi.afterSalesTarget,
        unitEntryRealisasi: kpi.unitEntryRealisasi,
        sparepartTunaiRealisasi: kpi.sparepartTunaiRealisasi,
      });

      // KPI Cards
      this.kpiCards.set(this.buildKpiCards(kpi, this.selectedDay()));

      // Charts
      const cabangMap = this.api.getCabangNameMap();

      const realisasiVsTarget = processAfterSalesRealisasiVsTargetData({ aftersales: aftersalesData });
      if (realisasiVsTarget) {
        this.realisasiVsTargetChart.set(realisasiVsTarget);
        this.state.saveAfterSalesRealisasiVsTarget?.(realisasiVsTarget);
      }

      const profitByBranch = processAfterSalesProfitByBranchData({ aftersales: aftersalesData }, cabangMap);
      if (profitByBranch) {
        this.profitByBranchChart.set(profitByBranch);
        this.state.saveAfterSalesProfitByBranch?.(profitByBranch);
      }
    } catch (e) {
      console.error('Error processing After Sales response:', e);
      this.error.set('Gagal memproses data. Silakan coba lagi.');
    }
  }

  /* =================== KPI Builder =================== */
  private buildKpiCards(kpi: AfterSalesKpiData, selectedDay: number | null): any[] {
    const pct = (num: number, den: number) => (!den ? 0 : Math.round((num / den) * 100));
    const afterSalesSelisih = (kpi.afterSalesRealisasi ?? 0) - (kpi.afterSalesTarget ?? 0);

    return [
      {
        title: 'AFTER SALES REALISASI vs TARGET',
        percentage: pct(kpi.afterSalesRealisasi ?? 0, kpi.afterSalesTarget ?? 0),
        realisasi: kpi.afterSalesRealisasi ?? 0,
        target: kpi.afterSalesTarget ?? 0,
        grandTotal: afterSalesSelisih,
        rataRata: Math.round((kpi.afterSalesRealisasi ?? 0) / 12),
        harapanTarget: this.calculateHarapanTarget(afterSalesSelisih, selectedDay),
        headerColor: '#2563EB',
        isRupiah: true,
      },
      {
        title: 'SERVICE CABANG REALISASI vs TARGET',
        percentage: pct(kpi.serviceCabang ?? 0, (kpi.serviceCabang ?? 0) * 1.3),
        realisasi: kpi.serviceCabang ?? 0,
        target: (kpi.serviceCabang ?? 0) * 1.3,
        grandTotal: kpi.serviceCabang ?? 0,
        rataRata: Math.round((kpi.serviceCabang ?? 0) / 8),
        harapanTarget: this.calculateHarapanTarget(kpi.serviceCabang ?? 0, selectedDay),
        headerColor: '#3B00A0',
        isRupiah: true,
      },
      {
        title: 'UNIT ENTRY REALISASI vs TARGET',
        percentage: pct(kpi.unitEntryRealisasi ?? 0, (kpi.unitEntryRealisasi ?? 0) * 1.2),
        realisasi: kpi.unitEntryRealisasi ?? 0,
        target: (kpi.unitEntryRealisasi ?? 0) * 1.2,
        grandTotal: kpi.unitEntryRealisasi ?? 0,
        rataRata: Math.round((kpi.unitEntryRealisasi ?? 0) / 12),
        harapanTarget: this.calculateHarapanTarget(kpi.unitEntryRealisasi ?? 0, selectedDay),
        headerColor: '#588000',
        isRupiah: false,
      },
      {
        title: 'SPAREPART TUNAI REALISASI vs TARGET',
        percentage: pct(kpi.sparepartTunaiRealisasi ?? 0, (kpi.sparepartTunaiRealisasi ?? 0) * 1.1),
        realisasi: kpi.sparepartTunaiRealisasi ?? 0,
        target: (kpi.sparepartTunaiRealisasi ?? 0) * 1.1,
        grandTotal: kpi.sparepartTunaiRealisasi ?? 0,
        rataRata: Math.round((kpi.sparepartTunaiRealisasi ?? 0) / 12),
        harapanTarget: this.calculateHarapanTarget(kpi.sparepartTunaiRealisasi ?? 0, selectedDay),
        headerColor: '#DC2626',
        isRupiah: true,
      },
    ];
  }

  /* =================== Helpers =================== */
  private calculateHarapanTarget(grandTotal: number, sisaHariKerja: number | null): number {
    if (!sisaHariKerja || sisaHariKerja <= 0) return 0;
    return Math.round((grandTotal ?? 0) / sisaHariKerja);
  }

  onDayChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const value = target.value === '' ? null : Number(target.value);
    this.selectedDay.set(value);

    if ((this.kpiCards()?.length ?? 0) > 0) {
      const updated = this.kpiCards().map((card) => ({
        ...card,
        harapanTarget: this.calculateHarapanTarget(card.grandTotal, value),
      }));
      this.kpiCards.set(updated);
    }
  }

  getBranchDisplayName(): string {
    const filter = this.state.getFilterAfterSales?.();
    if (!filter?.branch) return 'Semua Cabang';
    const cabangMap = this.api.getCabangNameMap();
    return cabangMap[filter.branch] || filter.branch;
  }

  getProfitChartTitle(): string {
    const branchName = this.getBranchDisplayName();
    return `Profit After Sales - ${branchName}`;
  }

  /* =================== Error Handling =================== */
  private handleError(error: any): void {
    console.error('After Sales API Error:', error);
    this.error.set('Gagal memuat data after sales. Silakan coba lagi.');
    this.loading.set(false);
  }
}
