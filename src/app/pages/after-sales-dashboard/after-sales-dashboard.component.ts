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

// === Child components yang dipakai di template (tetap) ===
import {
  FilterAftersalesDashboardComponent,
  AfterSalesFilter as UiFilter, // filter dari komponen filter (UI)
} from '../../shared/components/filter-aftersales-dashboard/filter-aftersales-dashboard.component';
import { KpiCardAsComponent } from '../../shared/components/kpi-card-as/kpi-card-as.component';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { LineChartCardComponent } from '../../shared/components/line-chart-card/line-chart-card.component';
import { KpiLegendButtonComponent } from '../../shared/components/kpi-legend-button/kpi-legend-button.component';
import { PieChartCardComponent } from '../../shared/components/pie-chart-card/pie-chart-card.component';

// === Service & State After Sales (yang baru) ===
import {
  AfterSalesStateService,
  UiAfterSalesKpis,
  UiAfterSalesViewResponse,
  UiProporsiSlice,
  AfterSalesFilter as ApiFilter, // filter untuk API/state
} from '../../core/state/after-sales-state.service';
import { AfterSalesApiService } from '../../core/services/after-sales-api.service';

// util format
import { formatCompactCurrency as fmtCurrency } from '../../shared/utils/number-format.utils';

// Tipe kecil untuk binding kartu
type KpiAmount = { realisasi: number; target: number };
type KpiData = {
  afterSales: KpiAmount;
  serviceCabang: KpiAmount;     // alias jasaService
  jasaService: KpiAmount;
  unitEntry: KpiAmount;
  sparepartTunai: KpiAmount;    // partTunai
  sparepartBengkel: KpiAmount;  // partBengkel
  oli: KpiAmount;

  // SRO (Jasa Service)
  jasaServiceExpress: KpiAmount;
  jasaServiceRutin: KpiAmount;
  jasaServiceSedang: KpiAmount;
  jasaServiceBerat: KpiAmount;
  jasaServiceOli: KpiAmount;
  jasaServiceOverhoul: KpiAmount;
  jasaServiceKelistrikan: KpiAmount;
  jasaServiceKupon: KpiAmount;
  jasaServicePdc: KpiAmount;
  jasaServiceCvt: KpiAmount;
  jasaServiceBodyRepair: KpiAmount;
  jasaServiceOverSize: KpiAmount;

  // Sparepart Bengkel
  partBengkelExpress: KpiAmount;
  partBengkelRutin: KpiAmount;
  partBengkelSedang: KpiAmount;
  partBengkelBerat: KpiAmount;
  partBengkelOli: KpiAmount;
  partBengkelOverhoul: KpiAmount;

  // Unit Entry
  unitEntryOliRealisasi: KpiAmount;
  unitEntryExpressRealisasi: KpiAmount;
  unitEntryRutinRealisasi: KpiAmount;
  unitEntrySedangRealisasi: KpiAmount;
  unitEntryBeratRealisasi: KpiAmount;
  unitEntryOverhoulRealisasi: KpiAmount;
  unitEntryKelistrikanRealisasi: KpiAmount;
  unitEntryOverSizeRealisasi: KpiAmount;
  unitEntryBodyRepairRealisasi: KpiAmount;
  unitEntryClaimRealisasi: KpiAmount;
  unitEntryKuponRealisasi: KpiAmount;
  unitEntryPdcRealisasi: KpiAmount;
};

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
  // Services
  private readonly api = inject(AfterSalesApiService);
  private readonly state = inject(AfterSalesStateService);

  // ===== Signals yang dipakai langsung di HTML (jaga nama & pemanggilan () ) =====
  loading = signal(false);
  error = signal<string | null>(null);
  hasData = signal(false);

  // filter di HTML: currentFilter()?.company / ?.cabang / ?.period / ?.month / ?.compare / ?.useCustomDate / ?.selectedDate
  currentFilter = signal<UiFilter | null>({
    company: 'sinar-galesong-mobilindo',
    cabang: 'all-branch',            // konsisten dengan service
    period: String(new Date().getFullYear()),
    month: String(new Date().getMonth() + 1).padStart(2, '0'),
    compare: true,
    useCustomDate: true,
    selectedDate: new Date().toISOString().slice(0, 10),
  });

  // Data siap render
  private _kpis = signal<UiAfterSalesKpis | null>(null);
  private _proporsi = signal<UiProporsiSlice[]>([]);
  private _kpiData = signal<KpiData | null>(null);

  // Chart signals yang dipanggil sebagai fungsi di template
  totalRevenueChart = signal<{ labels: string[]; data: number[] } | null>(null);
  afterSalesDistribution = signal<{ labels: string[]; data: number[] } | null>(null);

  // Sisa Hari Kerja (opsional—placeholder agar UI jalan)
  sisaHariKerja = 0;
  sisaHariKerjaOptions = [
    { value: 0, name: 'Off' },
    { value: 5, name: '5 Hari' },
    { value: 10, name: '10 Hari' },
  ];

  // Legend (tetap dari kode lama)
  legendOpen = false;
  @HostListener('document:click') closeLegendOnOutsideClick() {
    if (this.legendOpen) this.legendOpen = false;
  }
  toggleLegend(ev: MouseEvent) {
    ev.stopPropagation();
    this.legendOpen = !this.legendOpen;
  }

  // Ekspor formatter agar sama dengan template
  formatCompactNumber = fmtCurrency;

  // ======= Computed dari HTML lamamu =======
  showJumlahMekanik = computed(() => {
    const f = this.currentFilter();
    if (!f) return false;
    // tampilkan bila custom-date (harian) ATAU bulan spesifik
    return !!f.useCustomDate || (!!f.month && f.month !== 'all-month');
  });

  showJumlahHariKerja = computed(() => {
    const f = this.currentFilter();
    if (!f) return false;
    // sembunyikan jika all-cabang / all-branch & all-month
    return !(f.cabang === 'all-branch' && (!f.month || f.month === 'all-month'));
  });

  // HTML panggil sebagai fungsi:
  kpiData() { return this._kpiData(); }
  additionalKpiData() {
    const k = this._kpis();
    if (!k?.selected) return null;
    const t = k.selected.totals;
    return {
      jumlahMekanik: t.mekanik,
      jumlahHariKerja: t.hariKerja,
      totalBiayaUsaha: t.biayaUsaha,
      totalProfit: t.profit,
      totalRevenueRealisasi: t.totalRevenue.realisasi,
      totalProfitRealisasi: t.profit, // belum ada target profit → pakai sama
    };
  }

  // ===== Lifecycle =====
  ngOnInit(): void {
    // hydrate dari state (kalau ada)
    const saved = this.state.getKpiSnapshot();
    if (saved) {
      this._kpis.set(saved.kpis);
      this._proporsi.set(saved.proporsi);
      this._kpiData.set(this.mapUiToKpiData(saved.kpis));
      this.totalRevenueChart.set(this.buildRevenueChart(saved.kpis));
      this.afterSalesDistribution.set(this.buildDistribution(saved.proporsi));
      this.hasData.set(true);
    } else {
      // fetch default
      const f = this.toApiFilter(this.currentFilter()!);
      this.fetchAndUpdate(f);
    }
  }

  /* ===================== Events ===================== */
  onSearch(filter: UiFilter): void {
    this.currentFilter.set(filter);
    const f = this.toApiFilter(filter);
    this.fetchAndUpdate(f);
  }

  onSisaHariKerjaChange(): void {
    // Tidak mempengaruhi data dari API saat ini; hanya propagate untuk kartu yang mungkin perlu.
    if (this._kpiData()) this._kpiData.set({ ...this._kpiData()! });
  }

  getSisaHariKerja(): number {
    return this.sisaHariKerja;
  }

  getTotalUnitEntry(): number {
    const k = this._kpis();
    return k?.selected?.totals?.unitEntry?.realisasi ?? 0;
  }

  /* ===================== Fetch ===================== */
  private fetchAndUpdate(f: ApiFilter) {
    this.loading.set(true);
    this.error.set(null);

    this.state.saveFilter(f);

    const start = performance.now();
    const MIN_SPINNER_MS = 1200;

    this.api.getAfterSalesKpiView(f).subscribe({
      next: (resp: UiAfterSalesViewResponse) => {
        // persist + update UI
        this.state.saveKpiData(resp);

        this._kpis.set(resp.data.kpis);
        this._proporsi.set(resp.data.proporsi);
        this._kpiData.set(this.mapUiToKpiData(resp.data.kpis));
        this.totalRevenueChart.set(this.buildRevenueChart(resp.data.kpis));
        this.afterSalesDistribution.set(this.buildDistribution(resp.data.proporsi));
        this.hasData.set(true);

        const elapsed = performance.now() - start;
        const remain = Math.max(0, MIN_SPINNER_MS - elapsed);
        setTimeout(() => this.loading.set(false), remain);
      },
      error: (err) => {
        this.error.set(err?.message || 'Gagal memuat data after sales.');
        this._kpis.set(null);
        this._proporsi.set([]);
        this._kpiData.set(null);
        this.totalRevenueChart.set(null);
        this.afterSalesDistribution.set(null);
        this.hasData.set(false);

        const elapsed = performance.now() - start;
        const remain = Math.max(0, MIN_SPINNER_MS - elapsed);
        setTimeout(() => this.loading.set(false), remain);
      },
    });
  }

  /* ===================== Builder helpers ===================== */
  private buildRevenueChart(k: UiAfterSalesKpis | null): { labels: string[]; data: number[] } | null {
    if (!k?.selected) return null;
    const labels: string[] = [];
    const data: number[] = [];

    if (k.prevMonth) {
      labels.push(k.prevMonth.period);
      data.push(k.prevMonth.totals.totalRevenue.realisasi);
    }
    if (k.prevDate) {
      labels.push(k.prevDate.period);
      data.push(k.prevDate.totals.totalRevenue.realisasi);
    }
    labels.push(k.selected.period);
    data.push(k.selected.totals.totalRevenue.realisasi);

    return { labels, data };
  }

  private buildDistribution(items: UiProporsiSlice[]): { labels: string[]; data: number[] } | null {
    if (!items || !items.length) return null;
    return {
      labels: items.map(i => i.name),
      data: items.map(i => i.selected?.value ?? 0),
    };
  }

  private mapUiToKpiData(ui: UiAfterSalesKpis): KpiData {
    const sel = ui.selected.totals;
    const bd = ui.selected.breakdowns;

    const pick = (arr: {name:string; value:number}[], key:string) =>
      (arr.find(x => x.name.toUpperCase() === key.toUpperCase())?.value ?? 0);

    const toAmt = (realisasi: number, target = 0): KpiAmount => ({ realisasi, target });

    // Jasa Service / Parts / UE
    const svc = bd.jasaServiceByType;
    const pb  = bd.partBengkelByType;
    const ue  = bd.unitEntryByType;

    // OLI: dari proporsi kalau ada, fallback ke breakdown jasa service 'OLI'
    const oliFromProporsi =
      (this._proporsi().find(p => p.name.toUpperCase() === 'OLI')?.selected?.value) ?? 0;

    return {
      afterSales: toAmt(sel.afterSales.realisasi, sel.afterSales.target),
      serviceCabang: toAmt(sel.jasaService.realisasi, sel.jasaService.target),
      jasaService: toAmt(sel.jasaService.realisasi, sel.jasaService.target),
      unitEntry: toAmt(sel.unitEntry.realisasi, sel.unitEntry.target),
      sparepartTunai: toAmt(sel.partTunai.realisasi, sel.partTunai.target),
      sparepartBengkel: toAmt(sel.partBengkel.realisasi, sel.partBengkel.target),
      oli: toAmt(oliFromProporsi || pick(svc, 'OLI')),

      // SRO Jasa Service (targets belum ada → 0)
      jasaServiceExpress: toAmt(pick(svc, 'EXPRESS')),
      jasaServiceRutin: toAmt(pick(svc, 'RUTIN')),
      jasaServiceSedang: toAmt(pick(svc, 'SEDANG')),
      jasaServiceBerat: toAmt(pick(svc, 'BERAT')),
      jasaServiceOli: toAmt(pick(svc, 'OLI')),
      jasaServiceOverhoul: toAmt(pick(svc, 'OVERHOUL')),
      jasaServiceKelistrikan: toAmt(pick(svc, 'KELISTRIKAN')),
      jasaServiceKupon: toAmt(pick(svc, 'KUPON')),
      jasaServicePdc: toAmt(pick(svc, 'PDC')),
      jasaServiceCvt: toAmt(pick(svc, 'CVT')),
      jasaServiceBodyRepair: toAmt(pick(svc, 'BODY REPAIR')),
      jasaServiceOverSize: toAmt(pick(svc, 'OVER SIZE')),

      // Sparepart Bengkel
      partBengkelExpress: toAmt(pick(pb, 'EXPRESS')),
      partBengkelRutin: toAmt(pick(pb, 'RUTIN')),
      partBengkelSedang: toAmt(pick(pb, 'SEDANG')),
      partBengkelBerat: toAmt(pick(pb, 'BERAT')),
      partBengkelOli: toAmt(pick(pb, 'OLI')),
      partBengkelOverhoul: toAmt(pick(pb, 'OVERHOUL')),

      // Unit Entry (targets belum ada → 0)
      unitEntryOliRealisasi: toAmt(pick(ue, 'OLI')),
      unitEntryExpressRealisasi: toAmt(pick(ue, 'EXPRESS')),
      unitEntryRutinRealisasi: toAmt(pick(ue, 'RUTIN')),
      unitEntrySedangRealisasi: toAmt(pick(ue, 'SEDANG')),
      unitEntryBeratRealisasi: toAmt(pick(ue, 'BERAT')),
      unitEntryOverhoulRealisasi: toAmt(pick(ue, 'OVERHOUL')),
      unitEntryKelistrikanRealisasi: toAmt(pick(ue, 'KELISTRIKAN')),
      unitEntryOverSizeRealisasi: toAmt(pick(ue, 'OVER SIZE')),
      unitEntryBodyRepairRealisasi: toAmt(pick(ue, 'BODY REPAIR')),
      unitEntryClaimRealisasi: toAmt(pick(ue, 'CLAIM')),
      unitEntryKuponRealisasi: toAmt(pick(ue, 'KUPON')),
      unitEntryPdcRealisasi: toAmt(pick(ue, 'PDC')),
    };
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
    // kalau mau nama: mapping 0001→PETTARANI dst.
    return branch.toUpperCase();
  }

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

    const y = year || 'Semua Tahun';
    const m = monthMap[month || 'all-month'] || month;

    if (!month || month === 'all-month') return y;
    return `${m} ${y}`;
  }

  get compare(): boolean {
    return this.currentFilter()?.compare ?? false;
  }

  /* ===================== Converter UI <-> API ===================== */
  private toApiFilter(ui: UiFilter): ApiFilter {
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
      ui.month && ui.month !== 'all-month' ? String(ui.month).padStart(2, '0') : null;

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
}
