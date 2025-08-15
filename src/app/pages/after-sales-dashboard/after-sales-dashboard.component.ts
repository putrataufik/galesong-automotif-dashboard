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

import { AfterSalesService } from '../../core/services/aftersales.service';
import { AfterSalesStateService } from '../../core/state/after-sales-state.service';
import { AfterSalesResponse, AfterSalesItem } from '../../types/aftersales.model';
import { buildDescendingDayOptions, estimateRemainingWorkdays, isSameMonthYear, normalizeMonth, processAftersalesToKpi } from '../../shared/utils/dashboard-aftersales-kpi.utils';

// Utils (DRY)


interface KpiData {
  afterSales: { realisasi: number; target: number };
  serviceCabang: { realisasi: number; target: number };
  unitEntry: { realisasi: number; target: number };
  sparepartTunai: { realisasi: number; target: number };
  totalUnitEntry: number;
  profit: number;
}

interface SisaHariOption {
  value: string;
  name: string;
}

@Component({
  selector: 'app-after-sales-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, FilterAftersalesDashboardComponent, KpiCardAsComponent],
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
  currentFilter = signal<AfterSalesFilter | null>(null);

  // Sisa Hari Kerja (managed by state)
  sisaHariKerja = '';
  sisaHariKerjaOptions: SisaHariOption[] = [];
  showSisaHariKerja = signal(false);

  // Computed
  hasData = computed(() => !!this.kpiData());

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
          this.kpiData.set(processed);
          this.afterSalesState.saveKpi(processed);
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
    this.currentFilter.set(null);
    this.sisaHariKerjaOptions = [];
    this.sisaHariKerja = '';
    this.showSisaHariKerja.set(false);
  }
}
