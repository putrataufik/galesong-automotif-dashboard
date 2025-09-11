// src/app/pages/main-dashboard/main-dashboard.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { SalesApiService, UiKpis, UiSalesKpiResponse, } from '../../core/services/sales-api.service';
import { SalesFilter } from '../../core/models/sales.models';
import { MainStateService, SalesKpiSnapshot, } from '../../core/state/main-state.service';
import { FilterMainDashboardComponent } from '../../shared/components/filter-main-dashboard/filter-main-dashboard.component';
import { AppFilter } from '../../types/filter.model';
import {
  getCompanyDisplayName as utilCompanyName,
  getCategoryDisplayName as utilCategoryName,
  getBranchDisplayName as utilBranchName,
  getPeriodDisplayName as utilPeriodName,
} from './main-utils';

@Component({
  selector: 'app-main-dashboard',
  standalone: true,
  imports: [CommonModule, KpiCardComponent, FilterMainDashboardComponent],
  templateUrl: './main-dashboard.component.html',
  styleUrl: './main-dashboard.component.css',
})
export class MainDashboardComponent implements OnInit {
  private readonly api = inject(SalesApiService);
  private readonly state = inject(MainStateService);

  loadingMessage = signal('Data Sedang di Siapkan...');

  // ===== signals =====
  loading = signal(false);
  error = signal<string | null>(null);
  kpis = signal<UiKpis | null>(null);

  readonly MIN_SPINNER_MS = 1200;

  // Default filter: gunakan 'all-branch' (bukan '01')
  currentFilter: AppFilter = {
    company: 'sinar-galesong-mobilindo',
    category: 'all-category',
    year: String(new Date().getFullYear()),
    month: String(new Date().getMonth() + 1).padStart(2, '0'),
    branch: 'all-branch', // ⬅️ perbaikan
    compare: true,
  };

  ngOnInit(): void {
    const sf = this.state.getCurrentFilter();
    this.currentFilter = this.toAppFilter(sf);

    if (this.state.isCacheValid(sf)) {
      this.kpis.set(this.state.getKpis());
    } else {
      this.fetchAndUpdate(sf);
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

  private fetchAndUpdate(filter: SalesFilter): void {
    this.loading.set(true);
    this.error.set(null);
    const start = performance.now();

    this.state.saveFilter(filter);

    this.api.getSalesKpiView(filter).subscribe({
      next: (resp: UiSalesKpiResponse) => {
        const snap: SalesKpiSnapshot = {
          request: resp.data.request,
          kpis: resp.data.kpis,
          timestamp: Date.now(),
        };

        this.state.saveKpiData(snap);
        this.kpis.set(resp.data.kpis);

        const elapsed = performance.now() - start;
        const remain = Math.max(0, this.MIN_SPINNER_MS - elapsed);
        setTimeout(() => this.loading.set(false), remain);
      },
      error: (err) => {
        const msg = err?.message || 'Gagal memuat data';
        this.error.set(msg);
        this.kpis.set(null);

        const elapsed = performance.now() - start;
        const remain = Math.max(0, this.MIN_SPINNER_MS - elapsed);
        setTimeout(() => this.loading.set(false), remain);
      },
    });
  }

  onSearch(filter: AppFilter) {
    this.currentFilter = filter;
    const sf = this.toSalesFilter(filter);
    this.fetchAndUpdate(sf);
  }

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
      useCustomDate: this.currentFilter.useCustomDate,
      selectedDate: this.currentFilter.selectedDate,
      year: this.currentFilter.year,
      month: this.currentFilter.month,
    });
  }
}