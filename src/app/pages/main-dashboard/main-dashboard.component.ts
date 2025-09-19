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
  UiAfterSalesResponse,
  RawAfterSalesMetrics,
  RawProporsiItem,
  RawComparisonBlock,
} from '../../core/services/after-sales-api.service';

// ⬇️ Ganti ke state baru khusus Main
import { MainDashboardStateService, MainSalesSnapshot, MainAfterSalesSnapshot } from '../../core/state/main-state.service';

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
  // Services
  private readonly salesApi = inject(SalesApiService);
  private readonly afterSalesApi = inject(AfterSalesApiService);
  private readonly mainState = inject(MainDashboardStateService); // ⬅️ state khusus Main

  // UI signals
  loadingMessage = signal('Data Sedang di Siapkan...');
  loading = signal(false);
  error = signal<string | null>(null);

  readonly MIN_SPINNER_MS = 1200;

  // Filter UI (hydrate dari state Main)
  currentFilter: AppFilter = this.toAppFilter(
    this.mainState.getFilter() ?? {
      companyId: 'SGM', // fallback aman, sesuaikan default perusahaanmu
      branchId: 'all-branch',
      useCustomDate: false,
      compare: false,
      year: String(new Date().getFullYear()),
      month: String(new Date().getMonth() + 1).padStart(2, '0'),
      selectedDate: null,
    }
  );

  ngOnInit(): void {
    // Hydrate dari state Main
    const sf = this.mainState.getFilter() ?? this.toSalesFilter(this.currentFilter);
    this.currentFilter = this.toAppFilter(sf);

    const hasSales = !!this.mainState.getKpis();
    const hasAfter = !!this.mainState.selected();

    if (hasSales && hasAfter) {
      this.error.set(null);
      this.loading.set(false);
      return;
    }

    this.fetchBothAndUpdate(sf);
  }

  /* ========================= Converters ========================= */

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

  /* ==================== Fetch + Save to State ==================== */

  private fetchBothAndUpdate(filter: SalesFilter): void {
    this.loading.set(true);
    this.error.set(null);
    const start = performance.now();

    // Simpan filter ke state Main (bukan Sales/AfterSales)
    this.mainState.saveFilter(filter);

    const sales$ = this.salesApi.getSalesKpiView(filter).pipe(
      catchError((err) => of({ __error: err } as any))
    );

    const after$ = this.afterSalesApi.getAfterSalesView(filter).pipe(
      catchError((err) => of({ __error: err } as any))
    );

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
      this.error.set(bothFailed ? 'Gagal memuat data (Sales & After Sales).' : null);

      // ---- Spinner smooth ----
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

  /* ========================= Selectors (STATE → UI) ========================= */
  kpis(): UiKpis | null {
    return this.mainState.getKpis();
  }

  selectedMetrics(): RawAfterSalesMetrics | null { return this.mainState.selected(); }
  prevDateBlock(): RawComparisonBlock | null { return this.mainState.prevDate(); }
  prevMonthBlock(): RawComparisonBlock | null { return this.mainState.prevMonth(); }
  prevYearBlock(): RawComparisonBlock | null { return this.mainState.prevYear(); }
  proporsiItems(): RawProporsiItem[] { return this.mainState.proporsi(); }
  getTotalUnitEntry(): number {
    const it = this.mainState.proporsi();
    // contoh util sederhana: total unit entry dari proporsi
    return it.reduce((acc, x) => acc + (Number(x.selected?.value ?? 0) || 0), 0);
  }

  /* ========================= UI helpers / text ========================= */
  get compare(): boolean { return !!this.currentFilter.compare; }
  getCompanyDisplayName(company: string) { return utilCompanyName(company); }
  getCategoryDisplayName(category: string) { return utilCategoryName(category); }
  getBranchDisplayName(branch: string) { return utilBranchName(branch); }
  getPeriodDisplayName(): string {
    return utilPeriodName({
      useCustomDate: (this.currentFilter as any).useCustomDate,
      selectedDate: (this.currentFilter as any).selectedDate,
      year: this.currentFilter.year,
      month: this.currentFilter.month,
    });
  }
}
