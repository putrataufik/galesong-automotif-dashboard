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
  UiAfterSalesResponse,
  RawAfterSalesMetrics,
  RawProporsiItem,
  RawComparisonBlock,
} from '../../core/services/after-sales-api.service';

import { AfterSalesDashboardStateService } from '../../core/state/after-sales-state.service'

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
  private readonly salesState = inject(MainStateService);                     // Sales state (existing)
  private readonly asState = inject(AfterSalesDashboardStateService);         // After Sales minimal state

  // UI signals
  loadingMessage = signal('Data Sedang di Siapkan...');
  loading = signal(false);
  error = signal<string | null>(null);

  readonly MIN_SPINNER_MS = 1200;

  // Filter UI (hydrate dari Sales state)
  currentFilter: AppFilter = this.toAppFilter(this.salesState.getCurrentFilter());

  ngOnInit(): void {
  // Hydrate filter dari state Sales (dipakai juga untuk fetch jika perlu)
  const sf = this.salesState.getCurrentFilter();
  this.currentFilter = this.toAppFilter(sf);

  // Cek apakah sudah ada data di state
  const hasSales   = !!this.salesState.getKpis();
  const hasAfter   = !!this.asState.selected();

  if (hasSales && hasAfter) {
    // Sudah ada data di state → langsung pakai, tanpa fetch
    this.error.set(null);
    this.loading.set(false);
    return;
  }

  // Jika salah satu belum ada → fetch dan simpan ke state
  this.fetchBothAndUpdate(sf);
}


  /* ========================= Converters ========================= */

  // AppFilter -> SalesFilter (Main dashboard pakai year+month)
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

  /* ==================== Fetch + Save to State ==================== */

  /** Fetch Sales KPI + After Sales (UI-ready) paralel → simpan ke state */
  private fetchBothAndUpdate(filter: SalesFilter): void {
    this.loading.set(true);
    this.error.set(null);
    const start = performance.now();

    // Simpan filter ke Sales state (untuk konsistensi & breadcrumb)
    this.salesState.saveFilter(filter);

    const sales$ = this.salesApi.getSalesKpiView(filter).pipe(
      catchError((err) => of({ __error: err } as any))
    );

    const after$ = this.afterSalesApi.getAfterSalesView(filter).pipe(
      catchError((err) => of({ __error: err } as any))
    );

    forkJoin({ sales: sales$, after: after$ }).subscribe(({ sales, after }) => {
      // ---- Sales → STATE ----
      if ((sales as any)?.__error) {
        const snap: SalesKpiSnapshot = {
          request: {},
          // jika MainStateService punya clearer khusus, bisa dipakai;
          // di sini set null untuk menandai kosong.
          kpis: null as unknown as UiKpis,
          timestamp: Date.now(),
        };
        this.salesState.saveKpiData(snap);
      } else {
        const resp = sales as UiSalesKpiResponse;
        const snap: SalesKpiSnapshot = {
          request: resp.data.request,
          kpis: resp.data.kpis,
          timestamp: Date.now(),
        };
        this.salesState.saveKpiData(snap);
      }

      // ---- After Sales → STATE ----
      if ((after as any)?.__error) {
        this.asState.clearSnapshot();
      } else {
        const aResp = after as UiAfterSalesResponse;
        this.asState.saveFromView(aResp);
      }

      // ---- Error aggregate (untuk banner) ----
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
    this.fetchBothAndUpdate(sf); // fetch → simpan ke state → UI baca dari state
  }

  /* ========================= Selectors (STATE → UI) ========================= */
  // Penting: template lama mungkin memanggil kpis() (dulunya signal).
  // Method ini menjaga kompatibilitas sambil sumbernya tetap dari STATE.
  kpis(): UiKpis | null {
    return this.salesState.getKpis();
  }

  // After Sales minimal (untuk kartu/section after sales ringkas di main)
  selectedMetrics(): RawAfterSalesMetrics | null {
    return this.asState.selected();
  }
  prevDateBlock(): RawComparisonBlock | null {
    return this.asState.prevDate();
  }
  prevMonthBlock(): RawComparisonBlock | null {
    return this.asState.prevMonth();
  }
  prevYearBlock(): RawComparisonBlock | null {
    return this.asState.prevYear();
  }
  proporsiItems(): RawProporsiItem[] {
    return this.asState.proporsi();
  }
  getTotalUnitEntry(): number {
    return this.asState.getTotalUnitEntry();
  }

  /* ========================= UI helpers / text ========================= */

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
