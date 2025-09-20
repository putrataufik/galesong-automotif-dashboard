// src/app/pages/sales-dashboard/sales-dashboard.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { FilterSalesDashboardComponent } from '../../shared/components/filter-sales-dashboard/filter-sales-dashboard.component';
import { AppFilter } from '../../types/filter.model';
import { SalesStateService } from '../../core/state/sales-state.service';
import {
  SalesApiService,
  UiKpis,
  UiSalesKpiResponse,
} from '../../core/services/sales-api.service';
import { SalesFilter } from '../../core/models/sales.models';

// ⬇️ NEW: import utils
import {
  isUiKpisEmpty,
  getCompanyDisplayName as utilCompanyName,
  getCategoryDisplayName as utilCategoryName,
  getBranchDisplayName as utilBranchName,
} from './sales.utils';
import { getPeriodDisplayName as utilPeriodName} from '../pages.utils';

type SalesKpiSnapshot<TKpis = UiKpis> = {
  request: any;
  kpis: TKpis;
  timestamp: number;
};

@Component({
  selector: 'app-sales-dashboard',
  standalone: true,
  imports: [CommonModule, KpiCardComponent, FilterSalesDashboardComponent],
  templateUrl: './sales-dashboard.component.html',
  styleUrl: './sales-dashboard.component.css',
})
export class SalesDashboardComponent implements OnInit {
  private readonly api = inject(SalesApiService);
  private readonly state = inject(SalesStateService);

  // ===== Global Loading & Error =====
  loading = signal(false);
  loadingMessage = signal('Data Sedang di Siapkan...');
  readonly MIN_SPINNER_MS = 1500;

  error = signal<string | null>(null);
  hasData = signal(false);
  isDataEmpty = signal(true);

  // ===== Filter saat ini (UI) =====
  currentFilter: AppFilter = {
    company: 'sinar-galesong-mobilindo',
    category: 'sales',
    year: String(new Date().getFullYear()),
    month: String(new Date().getMonth() + 1).padStart(2, '0'),
    branch: 'all-branch',
    compare: true,
    useCustomDate: true,
    selectedDate: new Date().toISOString().slice(0, 10), // yyyy-mm-dd
  };

  // ===== KPI untuk UI (UI-ready) =====
  salesKpi = signal<UiKpis | null>(this.state.getKpis() as UiKpis | null);

  // ===== Lifecycle =====
  ngOnInit(): void {
    const sf = this.state.getCurrentFilter();
    const ui = this.toAppFilter(sf);
    this.currentFilter = ui;

    const salesFilter = this.toSalesFilter(ui);

    if (this.state.isCacheValid(salesFilter)) {
      const kpis = this.state.getKpis() as UiKpis | null;
      this.salesKpi.set(kpis);
      const ok = !!kpis;
      this.hasData.set(ok);
      this.isDataEmpty.set(!ok || isUiKpisEmpty(kpis));
    } else {
      this.fetchAndUpdate(salesFilter);
    }
  }

  // ===== Event: user klik "Cari" di filter =====
  onSearch(filter: AppFilter): void {
    const ui: AppFilter = { ...filter, category: 'sales' };
    this.currentFilter = ui;

    const salesFilter = this.toSalesFilter(ui);

    this.fetchAndUpdate(salesFilter);
  }

  // ===== Fetch KPI (UI-ready) + enforce min spinner time =====
  private fetchAndUpdate(f: SalesFilter): void {
    this.loadingMessage.set('Data Sedang di Siapkan...');
    this.loading.set(true);
    this.error.set(null);

    const start = performance.now();

    this.state.saveFilter(f);

    this.api.getSalesKpiView(f).subscribe({
      next: (resp: UiSalesKpiResponse) => {
        const snap: SalesKpiSnapshot = {
          request: resp.data.request,
          kpis: resp.data.kpis,
          timestamp: Date.now(),
        };

        this.state.saveKpiData(snap);
        this.salesKpi.set(resp.data.kpis);
        this.hasData.set(true);
        this.isDataEmpty.set(isUiKpisEmpty(resp.data.kpis));

        const elapsed = performance.now() - start;
        const remain = Math.max(0, this.MIN_SPINNER_MS - elapsed);
        setTimeout(() => this.loading.set(false), remain);
      },
      error: (err: any) => {
        const msg = err?.message || 'Gagal memuat data';
        this.error.set(msg);
        this.hasData.set(false);
        this.isDataEmpty.set(true);

        console.error('Sales KPI fetch error:', err);

        const elapsed = performance.now() - start;
        const remain = Math.max(0, this.MIN_SPINNER_MS - elapsed);
        setTimeout(() => this.loading.set(false), remain);
      },
    });
  }

  // ===== Compare helpers (delegasi ke utils agar template tetap sama) =====
  get compare(): boolean {
    return !!this.currentFilter.compare;
  }

  get isCustom(): boolean {
    return !!this.currentFilter.useCustomDate;
  }

  // ===== Display helpers (delegasi ke utils; signature tetap agar template tidak berubah) =====
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
      useCustomDate: this.currentFilter.useCustomDate,
      selectedDate: this.currentFilter.selectedDate,
      year: this.currentFilter.year,
      month: this.currentFilter.month,
    });
  }

  // ===== Konversi filter (UI <-> API) =====
  private toSalesFilter(ui: AppFilter): SalesFilter {
    if (ui.useCustomDate) {
      return {
        companyId: ui.company,
        branchId: ui.branch ?? 'all-branch',
        useCustomDate: true,
        compare: !!ui.compare,
        year: null,
        month: null,
        selectedDate: ui.selectedDate ?? null,
      };
    }

    const monthVal =
      ui.month && ui.month !== 'all-month'
        ? String(ui.month).padStart(2, '0')
        : null;

    return {
      companyId: ui.company,
      branchId: ui.branch ?? 'all-branch',
      useCustomDate: false,
      compare: !!ui.compare,
      year: ui.year && ui.year.trim() ? ui.year : null,
      month: monthVal,
      selectedDate: null,
    };
  }

  private toAppFilter(f: SalesFilter): AppFilter {
    if (f.useCustomDate) {
      const today = new Date();
      const sd = f.selectedDate ?? '';
      const y = sd ? sd.slice(0, 4) : String(today.getFullYear());
      const m = sd
        ? sd.slice(5, 7)
        : String(today.getMonth() + 1).padStart(2, '0');

      return {
        company: f.companyId,
        category: 'sales',
        year: y, // ⬅️ bukan '' lagi
        month: m, // ⬅️ bukan 'all-month' lagi
        branch: f.branchId ?? 'all-branch',
        compare: f.compare ?? true,
        useCustomDate: true,
        selectedDate: f.selectedDate ?? today.toISOString().slice(0, 10),
      };
    }

    // mode periode
    return {
      company: f.companyId,
      category: 'sales',
      year: f.year ?? String(new Date().getFullYear()),
      month: f.month ?? String(new Date().getMonth() + 1).padStart(2, '0'),
      branch: f.branchId ?? 'all-branch',
      compare: f.compare ?? true,
      useCustomDate: false,
      selectedDate: '',
    };
  }
}
