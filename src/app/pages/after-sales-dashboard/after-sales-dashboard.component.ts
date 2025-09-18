// src/app/pages/after-sales-dashboard/after-sales-dashboard.component.ts
import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  ChangeDetectionStrategy,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Child components
import {
  FilterAftersalesDashboardComponent,
  AfterSalesFilter as UiFilter, // filter dari komponen filter (UI)
} from '../../shared/components/filter-aftersales-dashboard/filter-aftersales-dashboard.component';
import { KpiCardAsComponent } from '../../shared/components/kpi-card-as/kpi-card-as.component';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { KpiLegendButtonComponent } from '../../shared/components/kpi-legend-button/kpi-legend-button.component';

// API (RAW)
import {
  AfterSalesApiService,
  RawAfterSalesResponse,
  RawAfterSalesMetrics,
  RawProporsiItem,
} from '../../core/services/after-sales-api.service';

// util format (tetap dipakai)
import { formatCompactCurrency as fmtCurrency } from '../../shared/utils/number-format.utils';

type SisaHariOption = { value: number; name: string };

@Component({
  selector: 'app-after-sales-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FilterAftersalesDashboardComponent,
    KpiCardAsComponent,
    KpiCardComponent,
    KpiLegendButtonComponent,
  ],
  templateUrl: './after-sales-dashboard.component.html',
  styleUrls: ['./after-sales-dashboard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AfterSalesDashboardComponent implements OnInit {
  // Service
  private readonly api = inject(AfterSalesApiService);

  // ===== Signals yang dipakai di HTML =====
  loading = signal(false);
  error = signal<string | null>(null);
  hasData = signal(false);

  // RAW payload dari API
  private _raw = signal<RawAfterSalesResponse | null>(null);

  // Filter UI (default)
  currentFilter: UiFilter = {
    company: 'sinar-galesong-mobilindo',
    cabang: 'all-branch',
    period: String(new Date().getFullYear()),
    month: String(new Date().getMonth() + 1).padStart(2, '0'),
    compare: true,
    useCustomDate: true,
    selectedDate: new Date().toISOString().slice(0, 10),
  };

  // Ekspor formatter agar sama dengan template
  formatCompactNumber = fmtCurrency;

  // Legend
  legendOpen = false;
  @HostListener('document:click') closeLegendOnOutsideClick() {
    if (this.legendOpen) this.legendOpen = false;
  }
  toggleLegend(ev: MouseEvent) {
    ev.stopPropagation();
    this.legendOpen = !this.legendOpen;
  }

  // ========== Sisa Hari Kerja (fitur dari kode lama, di-port ke sini) ==========
  /** Nilai terpilih di dropdown; null = disembunyikan */
  sisaHariKerja: number | null = null;
  /** Opsi dropdown (dibangun dinamis N..1) */
  sisaHariKerjaOptions: SisaHariOption[] = [];

  onSisaHariKerjaChange(): void {
    // cukup re-render; binding kartu menggunakan getSisaHariKerja()
    // if needed: trigger signal set to force change detection on push
    this.sisaHariKerja = Number(this.sisaHariKerja);
  }
  getSisaHariKerja(): number {
    return this.sisaHariKerja ?? 0;
  }

  // ===== Computed kecil untuk visibilitas lain =====
  showJumlahMekanik = computed(() => {
    const f = this.currentFilter;
    if (!f) return false;
    return !!f.useCustomDate || (!!f.month && f.month !== 'all-month');
  });

  showJumlahHariKerja = computed(() => {
    const f = this.currentFilter;
    if (!f) return false;
    return !(f.cabang === 'all-branch' && (!f.month || f.month === 'all-month'));
  });

  // ====== Getter RAW yang dipakai di template ======
  /** Akses cepat ke block kpi_data (RAW) */
  kpiDataRaw() {
    return this._raw()?.data?.kpi_data ?? null;
  }

  /** Akses metrics terpilih (RAW selected metrics) */
  selectedMetrics(): RawAfterSalesMetrics | null {
    return this.kpiDataRaw()?.selected ?? null;
  }

  /** Akses comparisons (prevDate/prevMonth/prevYear) bila ada */
  prevDateBlock() {
    return this.kpiDataRaw()?.comparisons?.prevDate ?? null;
  }
  prevMonthBlock() {
    return this.kpiDataRaw()?.comparisons?.prevMonth ?? null;
  }
  prevYearBlock() {
    return this.kpiDataRaw()?.comparisons?.prevYear ?? null;
  }

  /** Proporsi (RAW) */
  proporsiItems(): RawProporsiItem[] {
    return this._raw()?.data?.proporsi_after_sales?.data?.items ?? [];
  }

  /** Total Unit Entry (untuk kartu yang butuh denominator) */
  getTotalUnitEntry(): number {
    return Number(this.selectedMetrics()?.unit_entry_realisasi ?? 0);
  }

  // ===== Lifecycle =====
  ngOnInit(): void {
    // fetch default
    this.fetchAndUpdate(this.toApiQuery(this.currentFilter));
  }

  /* ===================== Events ===================== */
  onSearch(filter: UiFilter): void {
    this.currentFilter = filter;
    this.fetchAndUpdate(this.toApiQuery(filter));
  }

  /* ===================== Fetch (RAW) ===================== */
  private fetchAndUpdate(params: {
    companyId: string;
    branchId: string;
    useCustomDate: boolean;
    compare: boolean;
    selectedDate: string | null;
    year: string | null;
    month: string | null;
  }) {
    this.loading.set(true);
    this.error.set(null);

    const start = performance.now();
    const MIN_SPINNER_MS = 900;

    this.api.getAfterSalesView(params).subscribe({
      next: (resp) => {
        this._raw.set(resp);
        this.hasData.set(true);

        // 🔽 bangun opsi sisa hari kerja sesuai periode & data terkini
        this.updateSisaHariKerjaOptions(this.currentFilter, resp);

        const elapsed = performance.now() - start;
        const remain = Math.max(0, MIN_SPINNER_MS - elapsed);
        setTimeout(() => this.loading.set(false), remain);
      },
      error: (err) => {
        this.error.set(err?.message || 'Gagal memuat data after sales.');
        this._raw.set(null);
        this.hasData.set(false);

        // reset dropdown sisa hari kerja
        this.hideSisaHariKerja();

        const elapsed = performance.now() - start;
        const remain = Math.max(0, MIN_SPINNER_MS - elapsed);
        setTimeout(() => this.loading.set(false), remain);
      },
    });
  }

  /* ===================== Display helpers (breadcrumb) ===================== */
  getCompanyDisplayName(company: string): string {
    const map: Record<string, string> = {
      'sinar-galesong-mobilindo': 'Sinar Galesong Mobilindo',
      'pt-galesong-otomotif': 'PT Galesong Otomotif',
      'all-company': 'Semua Perusahaan',
    };
    return map[company] ?? company;
  }

  getBranchDisplayName(branch: string): string {
    if (!branch || branch === 'all-branch') return 'Semua Cabang';
    return branch.toUpperCase();
  }

  getPeriodDisplayName(): string {
    const year = this.currentFilter?.period;
    const month = this.currentFilter?.month;

    const monthMap: Record<string, string> = {
      'all-month': 'Semua Bulan',
      '01': 'Januari', '02': 'Februari', '03': 'Maret',
      '04': 'April',   '05': 'Mei',      '06': 'Juni',
      '07': 'Juli',    '08': 'Agustus',  '09': 'September',
      '10': 'Oktober', '11': 'November', '12': 'Desember',
    };

    const y = year || 'Semua Tahun';
    const m = monthMap[month || 'all-month'] || month;

    if (!month || month === 'all-month') return y;
    return `${m} ${y}`;
  }

  get compare(): boolean {
    return this.currentFilter?.compare ?? false;
  }

  /* ===================== Converter UI -> API (RAW) ===================== */
  private toApiQuery(ui: UiFilter): {
    companyId: string;
    branchId: string;
    useCustomDate: boolean;
    compare: boolean;
    selectedDate: string | null;
    year: string | null;
    month: string | null;
  } {
    if (ui.useCustomDate) {
      return {
        companyId: ui.company,
        branchId: ui.cabang ?? 'all-branch',
        useCustomDate: true,
        compare: !!ui.compare,
        year: null,
        month: null,
        selectedDate: ui.selectedDate ?? null,
      };
    }
    const month =
      ui.month && ui.month !== 'all-month'
        ? String(ui.month).padStart(2, '0')
        : null;

    return {
      companyId: ui.company,
      branchId: ui.cabang ?? 'all-branch',
      useCustomDate: false,
      compare: !!ui.compare,
      year: ui.period ?? String(new Date().getFullYear()),
      month,
      selectedDate: null,
    };
  }

  // =====================================================================
  // ------------------------ SISA HARI KERJA -----------------------------
  // =====================================================================

  /** Hitung opsi + set visibilitas dropdown, mengikuti perilaku kode lama */
  private updateSisaHariKerjaOptions(
    filter: UiFilter,
    resp: RawAfterSalesResponse
  ): void {
    const today = new Date();

    // Tentukan target year & month dari filter (dukung custom-date dan bulan)
    const { yearNum, monthNum } = this.resolveFilterYearMonth(filter);

    // Munculkan hanya bila periode sama dengan bulan & tahun berjalan
    if (
      yearNum === null ||
      monthNum === null ||
      !this.isSameMonthYear(monthNum, yearNum, today)
    ) {
      this.hideSisaHariKerja();
      return;
    }

    // Ambil total hari kerja target dari metrics kalau tersedia
    const totalHariKerjaRaw = resp?.data?.kpi_data?.selected?.hari_kerja;
    const totalHariKerja =
      typeof totalHariKerjaRaw === 'number' && isFinite(totalHariKerjaRaw)
        ? totalHariKerjaRaw
        : undefined;

    // Estimasi sisa hari kerja
    const remaining = this.estimateRemainingWorkdays(
      yearNum,
      monthNum,
      today,
      totalHariKerja
    );

    if (remaining <= 0) {
      this.hideSisaHariKerja();
      return;
    }

    // Build opsi N..1 (tanpa "Off" agar seragam dg kode lama)
    this.sisaHariKerjaOptions = this.buildDescendingDayOptions(remaining);
    // Default pilih nilai maksimum = sisa hari
    this.sisaHariKerja = remaining;
  }

  private hideSisaHariKerja(): void {
    this.sisaHariKerjaOptions = [];
    this.sisaHariKerja = null; // template pakai (sisaHariKerja !== null) untuk visibilitas
  }

  private buildDescendingDayOptions(n: number): SisaHariOption[] {
    const list: SisaHariOption[] = [];
    for (let i = n; i >= 1; i--) {
      list.push({ value: i, name: `${i} Hari` });
    }
    return list;
  }

  /** Normalisasi month string → number (1..12) */
  private normalizeMonth(m?: string | number | null): number | null {
    if (m == null) return null;
    if (typeof m === 'number') return m >= 1 && m <= 12 ? m : null;
    if (m === 'all-month') return null;
    const n = parseInt(String(m), 10);
    return n >= 1 && n <= 12 ? n : null;
  }

  /** True jika (month, year) sama dengan bulan & tahun dari 'now' */
  private isSameMonthYear(
    monthNum: number | null,
    yearNum: number | null,
    now: Date
  ): boolean {
    if (monthNum == null || yearNum == null) return false;
    return (
      yearNum === now.getFullYear() && monthNum === now.getMonth() + 1
    );
  }

  /** Tentukan (year, month) dari filter baru (dukung custom date) */
  private resolveFilterYearMonth(filter: UiFilter): {
    yearNum: number | null;
    monthNum: number | null;
  } {
    if (filter.useCustomDate && filter.selectedDate) {
      const d = new Date(filter.selectedDate);
      return { yearNum: d.getFullYear(), monthNum: d.getMonth() + 1 };
    }
    const yearNum =
      filter.period != null ? parseInt(String(filter.period), 10) : null;
    const monthNum = this.normalizeMonth(filter.month ?? null);
    return { yearNum, monthNum };
  }

  /** Hitung sisa hari kerja (Mon–Fri). Jika totalHariKerja tersedia → gunakan sebagai plafon */
  private estimateRemainingWorkdays(
    year: number,
    month: number, // 1..12
    now: Date,
    totalHariKerja?: number
  ): number {
    const firstOfMonth = new Date(year, month - 1, 1);
    const lastOfMonth = new Date(year, month, 0);

    // Jika sekarang sebelum bulan target → seluruh hari kerja bulan itu
    if (now < firstOfMonth) {
      const planned = this.countBusinessDaysInclusive(firstOfMonth, lastOfMonth);
      return totalHariKerja ? Math.min(planned, totalHariKerja) : planned;
    }

    // Jika sudah lewat bulan target → 0
    if (now > lastOfMonth) return 0;

    // Hitung hari kerja yang sudah terpakai (Mon–Fri) dari awal bulan s/d hari ini
    const used = this.countBusinessDaysInclusive(firstOfMonth, now);

    if (totalHariKerja && totalHariKerja > 0) {
      // Jika backend memberi total hari kerja bulan itu → sisa = total - used
      return Math.max(0, Math.floor(totalHariKerja - used));
    }

    // Fallback: tanpa total → hitung hari kerja tersisa dari besok s/d akhir bulan
    const startRemain = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return this.countBusinessDaysInclusive(startRemain, lastOfMonth);
  }

  /** Hitung jumlah hari kerja (Mon–Fri) dari tanggal A s/d B (inklusif). Aman untuk selisih <= 31 hari. */
  private countBusinessDaysInclusive(start: Date, end: Date): number {
    if (end < start) return 0;
    // clone
    let d = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    let count = 0;
    while (d <= e) {
      const day = d.getDay(); // 0=Sun .. 6=Sat
      if (day !== 0 && day !== 6) count++;
      d.setDate(d.getDate() + 1);
    }
    return count;
  }
}
