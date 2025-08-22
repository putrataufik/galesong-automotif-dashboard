// src/app/pages/dashboard/main-dashboard.component.ts
import { Component, OnInit, inject, signal, DestroyRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';

import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { FilterMainDashboardComponent } from '../../shared/components/filter-main-dashboard/filter-main-dashboard.component';
import { LineChartCardComponent } from '../../shared/components/line-chart-card/line-chart-card.component';
import { PieChartCardComponent } from '../../shared/components/pie-chart-card/pie-chart-card.component';
import { BarChartCardComponent } from '../../shared/components/bar-chart-card/bar-chart-card.component';

import { DashboardOverviewDTO, MainDashboardService } from '../../core/services/main-dashboard.service';
import { DashboardStateService } from '../../core/state/dashboard-state.service';

import { AppFilter } from '../../types/filter.model';
import { formatCompactNumber } from '../../shared/utils/dashboard-aftersales-kpi.utils';

@Component({
  selector: 'app-main-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    KpiCardComponent,
    FilterMainDashboardComponent,
    LineChartCardComponent,
    PieChartCardComponent,
    BarChartCardComponent,
  ],
  templateUrl: './main-dashboard.component.html',
  styleUrl: './main-dashboard.component.css',
})
export class MainDashboardComponent implements OnInit {
  private api = inject(MainDashboardService);
  private state = inject(DashboardStateService);
  private destroyRef = inject(DestroyRef);

  formatCompactNumber = formatCompactNumber;

  // UI state
  loading = signal(false);
  error = signal<string | null>(null);

  // KPI signals
  kpiTotalUnitSales = signal<number>(0);
  kpiTopModel = signal<{ name: string; unit: number } | null>(null);
  kpiTopBranch = signal<{ code: string; unit: number } | null>(null);
  afterSalesKpi = signal<any | null>(null);

  // Charts
  lineMonthly = signal<any | null>(null);
  branchPerformance = signal<any | null>(null);
  modelDistribution = signal<any | null>(null);
  afterSalesRealisasiVsTarget = signal<any | null>(null);
  afterSalesProfitByBranch = signal<any | null>(null);
  afterSalesDistribution = signal<any | null >(null);

  prefilledFilter: AppFilter | null = null;

  // ✅ computed signals (gantikan getter)
  hasData = computed(() =>
    !!(this.lineMonthly()
      || this.branchPerformance()
      || this.modelDistribution()
      || this.afterSalesKpi()
      || this.afterSalesRealisasiVsTarget()
      || this.afterSalesProfitByBranch()
      || this.afterSalesDistribution()
    )
  );
  isDataEmpty = computed(() => !this.hasData() && !this.loading());

  ngOnInit(): void {
    this.hydrateFromState();
  }

  onSearch(filter: AppFilter): void {
    this.error.set(null);

    if (!['sales', 'after-sales', 'all-category'].includes(filter.category)) {
      this.error.set('Kategori belum didukung. Pilih Sales, After Sales, atau All Category.');
      return;
    }

    this.state.saveFilter(filter);
    this.prefilledFilter = filter;
    this.resetSignals();

    this.loading.set(true);
    this.api.getDashboardOverview(filter.company as any, filter.period, filter.category as any)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)) // ✅ tutup loading pada success maupun error
      )
      .subscribe({
        next: (dto) => this.applyOverview(dto),
        error: () => this.error.set('Gagal memuat data. Silakan coba lagi.'),
      });
  }

  private applyOverview(d: DashboardOverviewDTO): void {
    // Charts
    this.lineMonthly.set(d.salesTrend);
    this.branchPerformance.set(d.salesByBranch);
    this.modelDistribution.set(d.salesByModel);
    this.afterSalesRealisasiVsTarget.set(d.afterSalesRealisasiVsTarget);
    this.afterSalesProfitByBranch.set(d.afterSalesProfitByBranch);
    this.afterSalesDistribution.set(d.afterSalesDistribution);

    // KPI
    this.kpiTotalUnitSales.set(d.totalUnitSales);
    this.kpiTopModel.set(d.topModel);
    this.kpiTopBranch.set(d.topBranch);
    this.afterSalesKpi.set(d.afterSalesKpi);

    // Persist once
    if (d.salesTrend) this.state.saveLineMonthly(d.salesTrend);
    if (d.salesByBranch) this.state.saveBranchPerformance(d.salesByBranch);
    if (d.salesByModel) this.state.saveModelDistribution(d.salesByModel);
    this.state.saveKpi({ totalUnitSales: d.totalUnitSales, topModel: d.topModel, topBranch: d.topBranch });
    if (d.afterSalesKpi) this.state.saveAfterSalesKpi({
      totalRevenueRealisasi: d.afterSalesKpi.totalRevenueRealisasi,
      totalBiayaUsaha: d.afterSalesKpi.totalBiayaUsaha,
      totalProfit: d.afterSalesKpi.totalProfit,
      totalHariKerja: d.afterSalesKpi.totalHariKerja,
      serviceCabang: d.afterSalesKpi.serviceCabang,
      afterSalesRealisasi: d.afterSalesKpi.afterSalesRealisasi,
      unitEntryRealisasi: d.afterSalesKpi.unitEntryRealisasi,
      sparepartTunaiRealisasi: d.afterSalesKpi.sparepartTunaiRealisasi,
      sparepartBengkelRealisasi: d.afterSalesKpi.sparepartBengkelRealisasi
    });
    if (d.afterSalesRealisasiVsTarget) this.state.saveAfterSalesRealisasiVsTarget(d.afterSalesRealisasiVsTarget);
    if (d.afterSalesProfitByBranch) this.state.saveAfterSalesProfitByBranch(d.afterSalesProfitByBranch);
    if (d.afterSalesDistribution) this.state.saveAfterSalesDistribution(d.afterSalesDistribution);
  }

  private resetSignals(): void {
    this.kpiTotalUnitSales.set(0);
    this.kpiTopModel.set(null);
    this.kpiTopBranch.set(null);
    this.lineMonthly.set(null);
    this.branchPerformance.set(null);
    this.modelDistribution.set(null);
    this.afterSalesKpi.set(null);
    this.afterSalesRealisasiVsTarget.set(null);
    this.afterSalesProfitByBranch.set(null);
    this.afterSalesDistribution.set(null);
  }

  private hydrateFromState(): void {
    const f = this.state.getFilter();
    if (f) this.prefilledFilter = f;

    const line = this.state.getLineMonthly();
    const bar = this.state.getBranchPerformance();
    const pie = this.state.getModelDistribution();
    if (line) this.lineMonthly.set(line);
    if (bar) this.branchPerformance.set(bar);
    if (pie) this.modelDistribution.set(pie);

    if (this.state.hasKpi()) {
      const k = this.state.getKpi();
      this.kpiTotalUnitSales.set(k.totalUnitSales ?? 0);
      this.kpiTopModel.set(k.topModel);
      this.kpiTopBranch.set(k.topBranch);
    }
    if (this.state.hasAfterSalesKpi()) this.afterSalesKpi.set(this.state.getAfterSalesKpi());

    const rvt = this.state.getAfterSalesRealisasiVsTarget();
    const pbb = this.state.getAfterSalesProfitByBranch();
    const asd = this.state.getAfterSalesDistribution();
    if (rvt) this.afterSalesRealisasiVsTarget.set(rvt);
    if (pbb) this.afterSalesProfitByBranch.set(pbb);
    if (asd) this.afterSalesDistribution.set(asd);
  }
}
