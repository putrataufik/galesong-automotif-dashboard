// src/app/pages/main-dashboard/main-dashboard.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import {
  SalesApiService,
  UiKpis,
  UiSalesKpiResponse,
} from '../../core/services/sales-api.service';
import { SalesFilter } from '../../core/models/sales.models';
import {
  MainStateService,
  SalesKpiSnapshot,
} from '../../core/state/main-state.service';
import { FilterMainDashboardComponent } from '../../shared/components/filter-main-dashboard/filter-main-dashboard.component';
import { AppFilter } from '../../types/filter.model';
import {
  getCompanyDisplayName as utilCompanyName,
  getCategoryDisplayName as utilCategoryName,
  getBranchDisplayName as utilBranchName,
  getPeriodDisplayName as utilPeriodName,
} from './main-utils';
import {
  AfterSalesApiService,
  RawAfterSalesMetrics,
  RawAfterSalesResponse,
  RawProporsiItem,
} from '../../core/services/after-sales-api.service';

import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-main-dashboard',
  standalone: true,
  imports: [CommonModule, KpiCardComponent, FilterMainDashboardComponent],
  templateUrl: './main-dashboard.component.html',
  styleUrl: './main-dashboard.component.css',
})
export class MainDashboardComponent implements OnInit {
  private readonly api = inject(SalesApiService);
  private readonly afterSalesApi = inject(AfterSalesApiService);
  private readonly state = inject(MainStateService);

  loadingMessage = signal('Data Sedang di Siapkan...');

  // ===== signals =====
  loading = signal(false);
  error = signal<string | null>(null);
  kpis = signal<UiKpis | null>(null);

  readonly MIN_SPINNER_MS = 1200;

  // After Sales RAW
  private _afterSalesRaw = signal<RawAfterSalesResponse | null>(null);
  hasData = signal(false); // gabungan (Sales/AfterSales)

  // Default filter: gunakan 'all-branch'
  currentFilter: AppFilter = {
    company: 'sinar-galesong-mobilindo',
    category: 'all-category',
    year: String(new Date().getFullYear()),
    month: String(new Date().getMonth() + 1).padStart(2, '0'),
    branch: 'all-branch',
    compare: true,
  };

  ngOnInit(): void {
    const sf = this.state.getCurrentFilter();
    this.currentFilter = this.toAppFilter(sf);

    if (this.state.isCacheValid(sf)) {
      // Sales KPI dari cache
      this.kpis.set(this.state.getKpis());
      // After Sales: refresh ringan agar tidak stale (opsional, bisa juga di-cache terpisah)
      this.fetchBothAndUpdate(sf);
    } else {
      this.fetchBothAndUpdate(sf);
    }
  }

  // AppFilter -> SalesFilter (tidak ada 'all-month' lagi)
  private toSalesFilter(ui: AppFilter): SalesFilter {
    const monthVal = String(ui.month).padStart(2, '0');
    return {
      companyId: ui.company,
      branchId: ui.branch ?? 'all-branch',
      useCustomDate: false,
      compare: !!ui.compare,
      year: ui.year && ui.year.trim() ? ui.year : String(new Date().getFullYear()),
      month: monthVal,
      selectedDate: null,
    };
  }

  // SalesFilter -> AppFilter (untuk hydrate UI dari state)
  private toAppFilter(f: SalesFilter): AppFilter {
    return {
      company: f.companyId,
      category: 'all-category',
      year: f.year ?? String(new Date().getFullYear()),
      month: f.month ?? String(new Date().getMonth() + 1).padStart(2, '0'),
      branch: f.branchId ?? 'all-branch',
      compare: !!f.compare,
    };
  }

  /** Fetch Sales KPI + After Sales RAW secara paralel, dengan error parsial aman */
  private fetchBothAndUpdate(filter: SalesFilter): void {
    this.loading.set(true);
    this.error.set(null);
    const start = performance.now();

    this.state.saveFilter(filter);

    const sales$ = this.api.getSalesKpiView(filter).pipe(
      catchError((err) => of({ __error: err } as any))
    );

    const after$ = this.afterSalesApi.getAfterSalesView(filter).pipe(
      catchError((err) => of({ __error: err } as any))
    );

    forkJoin({ sales: sales$, after: after$ }).subscribe(({ sales, after }) => {
      // ---- Sales handling ----
      if ((sales as any)?.__error) {
        const e = (sales as any).__error;
        const msg = e?.message || 'Gagal memuat data Sales';
        // Hanya set error jika AfterSales juga gagal di bawah
        this.kpis.set(null);
      } else {
        const resp = sales as UiSalesKpiResponse;
        const snap: SalesKpiSnapshot = {
          request: resp.data.request,
          kpis: resp.data.kpis,
          timestamp: Date.now(),
        };
        this.state.saveKpiData(snap);
        this.kpis.set(resp.data.kpis);
      }

      // ---- After Sales handling ----
      if ((after as any)?.__error) {
        const e = (after as any).__error;
        const msg = e?.message || 'Gagal memuat data After Sales';
        this._afterSalesRaw.set(null);
      } else {
        const aResp = after as RawAfterSalesResponse;
        this._afterSalesRaw.set(aResp);
      }

      // ---- Error message (agregasi) ----
      const bothFailed = !!(sales as any)?.__error && !!(after as any)?.__error;
      this.error.set(bothFailed ? 'Gagal memuat data (Sales & After Sales).' : null);

      // ---- hasData & spinner ----
      const anyData = !!this.kpis() || !!this._afterSalesRaw();
      this.hasData.set(anyData);

      const elapsed = performance.now() - start;
      const remain = Math.max(0, this.MIN_SPINNER_MS - elapsed);
      setTimeout(() => this.loading.set(false), remain);
    });
  }

  onSearch(filter: AppFilter) {
    this.currentFilter = filter;
    const sf = this.toSalesFilter(filter);
    this.fetchBothAndUpdate(sf);
  }

  // ====== After Sales: expose ke template ======
  kpiDataRaw() {
    return this._afterSalesRaw()?.data?.kpi_data ?? null;
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
    return this._afterSalesRaw()?.data?.proporsi_after_sales?.data?.items ?? [];
  }

  /** Total Unit Entry (untuk kartu yang butuh denominator) */
  getTotalUnitEntry(): number {
    return Number(this.selectedMetrics()?.unit_entry_realisasi ?? 0);
  }

  // ====== Sales helpers / UI text ======
  get compare(): boolean {
    return !!this.currentFilter.compare;
  }

  getCompanyDisplayName(company: string): string {
    return utilCompanyName(company);
  }
  getCategoryDisplayName(category: string): string {
    return utilCategoryName(category);
  }
  getBranchDisplayName(branch: string): string {
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
}
