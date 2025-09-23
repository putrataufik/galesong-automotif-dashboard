import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { FilterMainDashboardComponent } from '../../shared/components/filter-main-dashboard/filter-main-dashboard.component';

import {
  SalesApiService,
  UiKpis,
  UiSalesKpiResponse,
  SalesTrendMonthlyResponse,
  DoVsSpkMonthlyResponse,
  SalesModelDistributionMonthlyResponse,
} from '../../core/services/sales-api.service';

import { SalesFilter } from '../../core/models/sales.models';
import {
  AfterSalesApiService,
  UiAfterSalesResponse,
  RawAfterSalesMetrics,
  RawProporsiItem,
  RawComparisonBlock,
} from '../../core/services/after-sales-api.service';

// ⬇️ State khusus Main
import {
  MainDashboardStateService,
  MainSalesSnapshot,
  MainAfterSalesSnapshot,
  MainTrendSnapshot,
  MainDoVsSpkSnapshot,
} from '../../core/state/main-state.service';

import { AppFilter } from '../../types/filter.model';
import {
  getCompanyDisplayName as utilCompanyName,
  getCategoryDisplayName as utilCategoryName,
  getBranchDisplayName as utilBranchName,
  getPeriodDisplayName as utilPeriodName,
} from './main-utils';

import { mapToLineSeries } from '../../shared/utils/chart-mapper';
import { YoyProgressListComponent } from '../../shared/components/yoy-progress-list/yoy-progress-list.component';
import { LineChartCardComponent } from '../../shared/components/line-chart-card/line-chart-card.component';

const MONTH_LABELS: string[] = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MEI',
  'JUN',
  'JUL',
  'AGU',
  'SEP',
  'OKT',
  'NOV',
  'DES',
];

type ModelYoYMoM = {
  name: string;
  curr: number;
  prevY: number | null;
  prevM: number | null;
};

@Component({
  selector: 'app-main-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    KpiCardComponent,
    FilterMainDashboardComponent,
    YoyProgressListComponent,
    LineChartCardComponent,
  ],
  templateUrl: './main-dashboard.component.html',
  styleUrls: ['./main-dashboard.component.css'],
})
export class MainDashboardComponent implements OnInit {
  // Services
  private readonly salesApi = inject(SalesApiService);
  private readonly afterSalesApi = inject(AfterSalesApiService);
  private readonly mainState = inject(MainDashboardStateService);

  // UI signals
  loadingMessage = signal('Data Sedang di Siapkan...');
  loading = signal(false);
  error = signal<string | null>(null);

  // Chart loading/error (opsional, agar granular)
  trendLoading = signal(false);
  trendError = signal<string | null>(null);

  doSpkLoading = signal(false);
  doSpkError = signal<string | null>(null);

  modelDistLoading = signal(false);
  modelDistError = signal<string | null>(null);

  readonly MIN_SPINNER_MS = 1200;

  // Filter UI (hydrate dari state Main)
  currentFilter: AppFilter = this.toAppFilter(
    this.mainState.getFilter() ?? {
      companyId: 'SGM',
      branchId: 'all-branch',
      useCustomDate: false,
      compare: false,
      year: String(new Date().getFullYear()),
      month: String(new Date().getMonth() + 1)
        .toString()
        .padStart(2, '0'),
      selectedDate: null,
    }
  );

  // ===== Selectors dari state untuk ditampilkan di template =====
  kpis(): UiKpis | null {
    return this.mainState.getKpis();
  }
  selectedMetrics(): RawAfterSalesMetrics | null {
    return this.mainState.selected();
  }
  prevDateBlock(): RawComparisonBlock | null {
    return this.mainState.prevDate();
  }
  prevMonthBlock(): RawComparisonBlock | null {
    return this.mainState.prevMonth();
  }
  prevYearBlock(): RawComparisonBlock | null {
    return this.mainState.prevYear();
  }
  proporsiItems(): RawProporsiItem[] {
    return this.mainState.proporsi();
  }
  getTotalUnitEntry(): number {
    const it = this.mainState.proporsi();
    return it.reduce(
      (acc, x) => acc + (Number(x.selected?.value ?? 0) || 0),
      0
    );
  }

  // ===== Chart view models (render dari state) =====
  readonly MONTH_LABELS = MONTH_LABELS;
  private readonly TREND_COLORS = ['#2563eb', '#ef4444', '#10b981', '#f59e0b'];
  private readonly DOSPK_COLORS = ['#f59e0b', '#10b981'];
  trendLineSeries = computed(() => {
    const snap = this.mainState.getTrendSnapshot();
    const ds = snap?.datasets ?? [];
    return mapToLineSeries(ds, this.TREND_COLORS, {
      tension: 0.35,
      borderWidth: 3,
      fill: false,
    });
  });

  doSpkLineSeries = computed(() => {
    const snap = this.mainState.getDoVsSpkSnapshot();
    const ds = snap?.datasets ?? [];
    return mapToLineSeries(ds, this.DOSPK_COLORS, {
      tension: 0.35,
      borderWidth: 3,
      fill: false,
    });
  });

  // ✅ Labels jadi computed murni
  modelLabelCurr = computed(
    () => this.mainState.getModelDistSnapshot()?.current?.label ?? 'Current'
  );
  modelLabelPrevM = computed(
    () =>
      this.mainState.getModelDistSnapshot()?.prevMonth?.label ?? 'Prev Month'
  );
  modelLabelPrevY = computed(
    () => this.mainState.getModelDistSnapshot()?.prevYear?.label ?? 'Prev Year'
  );

  // ✅ Rows tetap computed murni, TANPA set() ke signal lain
  modelDistRows = computed(() => {
    const m = this.mainState.getModelDistSnapshot();
    if (!m) return [];

    const mapOf = (items?: { name: string; value: number }[]) =>
      new Map<string, number>(
        (items ?? []).map((it) => [it.name, Number(it.value ?? 0)])
      );

    const cur = mapOf(m.current?.items);
    const pm = mapOf(m.prevMonth?.items);
    const py = mapOf(m.prevYear?.items);

    const names = new Set<string>([...cur.keys(), ...pm.keys(), ...py.keys()]);
    return Array.from(names)
      .map((name) => ({
        name,
        curr: cur.get(name) ?? 0,
        prevM: pm.has(name) ? pm.get(name)! : null,
        prevY: py.has(name) ? py.get(name)! : null,
      }))
      .sort((a, b) => b.curr - a.curr || a.name.localeCompare(b.name));
  });

  // ===== Utils display =====
  get compare(): boolean {
    return !!this.currentFilter.compare;
  }
  getCompanyDisplayName(company: string) {
    return utilCompanyName(company);
  }
  getCategoryDisplayName(category: string) {
    return utilCategoryName(category);
  }
  getBranchDisplayName(branch: string) {
    return utilBranchName(branch);
  }
  getPeriodDisplayName(): string {
    return utilPeriodName({
      useCustomDate: (this.currentFilter as any).useCustomDate,
      selectedDate: (this.currentFilter as any).selectedDate,
      year: this.currentFilter.year,
      month: this.currentFilter.month,
    });
  }

  ngOnInit(): void {
    // Hydrate dari state Main
    const sf =
      this.mainState.getFilter() ?? this.toSalesFilter(this.currentFilter);
    this.currentFilter = this.toAppFilter(sf);

    const hasSales = !!this.mainState.getKpis();
    const hasAfter = !!this.mainState.selected();

    // Cek grafik dari cache yang relevan
    const { company, compare, year, month } = this.currentFilter;
    const trendOk = this.mainState.isTrendCacheValid(company, year, !!compare);
    const dovsOk = this.mainState.isDoVsSpkCacheValid(company, year);
    const mdOk = this.mainState.isModelDistCacheValid(
      company,
      year,
      month,
      !!compare
    );

    if (hasSales && hasAfter && trendOk && dovsOk && mdOk) {
      this.error.set(null);
      this.loading.set(false);
      return;
    }

    // Fetch KPI & After-Sales + 3 grafik
    this.fetchBothAndUpdate(sf);
    this.fetchTrend(this.currentFilter);
    this.fetchDoVsSpk(this.currentFilter);
    this.fetchModelDist(this.currentFilter);
  }

  /* ========================= Converters ========================= */

  private toSalesFilter(ui: AppFilter): SalesFilter {
    const monthVal = String(ui.month).padStart(2, '0');
    return {
      companyId: ui.company,
      branchId: ui.branch ?? 'all-branch',
      useCustomDate: false,
      compare: !!ui.compare,
      year:
        ui.year && ui.year.trim() ? ui.year : String(new Date().getFullYear()),
      month: monthVal,
      selectedDate: null,
    };
  }

  private toAppFilter(f: SalesFilter): AppFilter {
    return {
      company: f.companyId,
      category: 'all-category',
      year: f.year ?? String(new Date().getFullYear()),
      month:
        f.month ??
        String(new Date().getMonth() + 1)
          .toString()
          .padStart(2, '0'),
      branch: f.branchId ?? 'all-branch',
      compare: !!f.compare,
    };
  }

  /* ==================== Fetch + Save to State ==================== */

  private fetchBothAndUpdate(filter: SalesFilter): void {
    this.loading.set(true);
    this.error.set(null);
    const start = performance.now();

    // Simpan filter ke state Main
    this.mainState.saveFilter(filter);

    const sales$ = this.salesApi
      .getSalesKpiView(filter)
      .pipe(catchError((err) => of({ __error: err } as any)));

    const after$ = this.afterSalesApi
      .getAfterSalesView(filter)
      .pipe(catchError((err) => of({ __error: err } as any)));

    forkJoin({ sales: sales$, after: after$ }).subscribe(({ sales, after }) => {
      // ---- Sales → STATE (Main) ----
      if ((sales as any)?.__error) {
        const snap: MainSalesSnapshot = {
          request: {},
          kpis: null,
          timestamp: Date.now(),
        };
        this.mainState.saveSalesSnapshot(snap);
      } else {
        const resp = sales as UiSalesKpiResponse;
        const snap: MainSalesSnapshot = {
          request: resp.data.request,
          kpis: resp.data.kpis,
          timestamp: Date.now(),
        };
        this.mainState.saveSalesSnapshot(snap);
      }

      // ---- After Sales → STATE (Main) ----
      if ((after as any)?.__error) {
        this.mainState.clearAfterSnapshot();
      } else {
        const aResp = after as UiAfterSalesResponse;
        const snap: MainAfterSalesSnapshot = {
          request: aResp.data.request,
          selected: aResp.data.kpi_data.selected,
          prevDate: aResp.data.kpi_data.comparisons?.prevDate,
          prevMonth: aResp.data.kpi_data.comparisons?.prevMonth,
          prevYear: aResp.data.kpi_data.comparisons?.prevYear,
          proporsi: aResp.data.proporsi_after_sales?.data.items ?? [],
          timestamp: Date.now(),
        };
        this.mainState.saveAfterSnapshot(snap);
      }

      // ---- Error aggregate ----
      const bothFailed = !!(sales as any)?.__error && !!(after as any)?.__error;
      this.error.set(
        bothFailed ? 'Gagal memuat data (Sales & After Sales).' : null
      );

      // ---- Spinner smooth ----
      const elapsed = performance.now() - start;
      const remain = Math.max(0, this.MIN_SPINNER_MS - elapsed);
      setTimeout(() => this.loading.set(false), remain);
    });
  }

  onSearch(filter: AppFilter) {
    this.currentFilter = filter;

    // Simpan filter versi SalesFilter agar konsisten di state
    const sf = this.toSalesFilter(filter);
    this.mainState.saveFilter(sf);

    // Refresh KPI/After-Sales dan 3 grafik
    this.fetchBothAndUpdate(sf);
    this.fetchTrend(filter);
    this.fetchDoVsSpk(filter);
    this.fetchModelDist(filter);
  }

  /* ========================= Fetch Charts ========================= */

  private fetchTrend(ui: AppFilter) {
    this.trendLoading.set(true);
    this.trendError.set(null);

    const companyId = ui.company;
    const year = ui.year;
    const compare = !!ui.compare;

    // Cache check
    if (this.mainState.isTrendCacheValid(companyId, year, compare)) {
      this.trendLoading.set(false);
      return;
    }

    this.salesApi.getSalesTrendMonthlyRaw(companyId, year, compare).subscribe({
      next: (res: SalesTrendMonthlyResponse) => {
        const ds = res?.data?.salesMontlyTrend?.datasets ?? [];
        const snap: Omit<MainTrendSnapshot, 'key' | 'timestamp'> = {
          companyId,
          year,
          compare,
          datasets: ds,
        };
        this.mainState.saveTrendSnapshot(snap);
        this.trendLoading.set(false);
      },
      error: (err) => {
        this.trendError.set(err?.message || 'Gagal memuat tren bulanan');
        this.mainState.clearTrendSnapshot();
        this.trendLoading.set(false);
        console.error('Main Trend fetch error:', err);
      },
    });
  }

  private fetchDoVsSpk(ui: AppFilter) {
    this.doSpkLoading.set(true);
    this.doSpkError.set(null);

    const companyId = ui.company;
    const year = ui.year;

    if (this.mainState.isDoVsSpkCacheValid(companyId, year)) {
      this.doSpkLoading.set(false);
      return;
    }

    this.salesApi.getDoVsSpkMonthlyRaw(companyId, year).subscribe({
      next: (res: DoVsSpkMonthlyResponse) => {
        const ds = res?.data?.DOvsSPKMontlyTrend?.datasets ?? [];
        const snap: Omit<MainDoVsSpkSnapshot, 'key' | 'timestamp'> = {
          companyId,
          year,
          datasets: ds,
        };
        this.mainState.saveDoVsSpkSnapshot(snap);
        this.doSpkLoading.set(false);
      },
      error: (err) => {
        this.doSpkError.set(err?.message || 'Gagal memuat DO vs SPK');
        this.mainState.clearDoVsSpkSnapshot();
        this.doSpkLoading.set(false);
        console.error('Main DOvsSPK fetch error:', err);
      },
    });
  }

  private fetchModelDist(ui: AppFilter) {
    this.modelDistLoading.set(true);
    this.modelDistError.set(null);

    const companyId = ui.company;
    const year = ui.year;
    const month = String(ui.month).padStart(2, '0');
    const compare = !!ui.compare;

    if (this.mainState.isModelDistCacheValid(companyId, year, month, compare)) {
      this.modelDistLoading.set(false);
      return;
    }

    this.salesApi
      .getModelDistributionMonthlyRaw(companyId, year, month, compare)
      .subscribe({
        next: (res: SalesModelDistributionMonthlyResponse) => {
          const cur = res?.data?.current;
          const pm = res?.data?.prevMonth;
          const py = res?.data?.prevYear;

          this.mainState.saveModelDistSnapshot({
            companyId,
            year,
            month,
            compare,
            current: cur,
            prevMonth: pm,
            prevYear: py,
          });
          this.modelDistLoading.set(false);
        },
        error: (err) => {
          this.modelDistError.set(
            err?.message || 'Gagal memuat distribusi model'
          );
          this.mainState.clearModelDistSnapshot();
          this.modelDistLoading.set(false);
          console.error('Main ModelDist fetch error:', err);
        },
      });
  }
}
