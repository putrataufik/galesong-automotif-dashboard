// src/app/pages/sales-dashboard/sales-dashboard.facade.ts
import { inject, signal } from '@angular/core';
import {
  SalesApiService,
  UiKpis,
  UiSalesKpiResponse,
  SalesTrendMonthlyResponse,
  DoVsSpkMonthlyResponse,
} from '../../core/services/sales-api.service';
import { SalesStateService } from '../../core/state/sales-state.service';
import { AppFilter } from '../../types/filter.model';
import { SalesFilter } from '../../core/models/sales.models';
import { getTrendMonth, getTrendYear, toSalesFilter } from './sales.utils';
import { mapToLineSeries } from '../../shared/utils/chart-mapper';

type ModelYoYMoM = {
  name: string;
  curr: number;
  prevY: number | null;
  prevM: number | null;
};

export class SalesDashboardFacade {
  private readonly api = inject(SalesApiService);
  private readonly state = inject(SalesStateService);

  // public signals (dipakai komponen)
  loading = signal(false);
  loadingMessage = signal('Data Sedang di Siapkan...');
  error = signal<string | null>(null);
  hasData = signal(false);
  isDataEmpty = signal(true);
  salesKpi = signal<UiKpis | null>(this.state.getKpis() as UiKpis | null);

  trendLoading = signal(false);
  trendError = signal<string | null>(null);
  trendLineSeries = signal<any[]>([]);

  doSpkLoading = signal(false);
  doSpkError = signal<string | null>(null);
  doSpkLineSeries = signal<any[]>([]);

  modelDistLoading = signal(false);
  modelDistError = signal<string | null>(null);
  modelDistItems = signal<ModelYoYMoM[]>([]);
  modelLabelCurr = signal('Current');
  modelLabelPrevY = signal('Prev Year');
  modelLabelPrevM = signal('Prev Month');

  private readonly MIN_SPINNER_MS = 1500;
  private readonly TREND_COLORS = ['#2563eb', '#ef4444', '#10b981', '#f59e0b'];
  private readonly DOSPK_COLORS = ['#f59e0b', '#10b981'];

  initFromState(currentUi: AppFilter) {
    const salesFilter = toSalesFilter(currentUi);

    // ===== KPI (cache-first)
    if (this.state.isCacheValid(salesFilter)) {
      const kpis = this.state.getKpis() as UiKpis | null;
      this.salesKpi.set(kpis);
      const ok = !!kpis && Object.keys(kpis).length > 0;
      this.hasData.set(ok);
      this.isDataEmpty.set(!ok);
    } else {
      this.fetchKpis(salesFilter);
    }

    // ===== Trend Unit Terjual (cache-first)
    {
      const cached = this.state.getTrendMonthly?.();
      if (cached?.datasets?.length) {
        this.trendLineSeries.set(
          mapToLineSeries(cached.datasets, this.TREND_COLORS)
        );
      } else {
        this.fetchTrend(currentUi);
      }
    }

    // ===== DO vs SPK (cache-first)
    {
      const cached = this.state.getDoVsSpkMonthly?.();
      if (cached?.datasets?.length) {
        this.doSpkLineSeries.set(
          mapToLineSeries(cached.datasets, this.DOSPK_COLORS)
        );
      } else {
        this.fetchDoVsSpk(currentUi);
      }
    }

    // ===== Distribusi Model (cache-first)
    {
      const cached = this.state.getModelDistributionMonthly?.();
      if (cached?.current || cached?.prevMonth || cached?.prevYear) {
        const cur = cached.current,
          pm = cached.prevMonth,
          py = cached.prevYear;

        this.modelLabelCurr.set(cur?.label ?? 'Current');
        this.modelLabelPrevM.set(pm?.label ?? 'Prev Month');
        this.modelLabelPrevY.set(py?.label ?? 'Prev Year');

        const m = (x?: any[]) =>
          new Map<string, number>(
            (x ?? []).map((i: any) => [i.name, Number(i.value ?? 0)])
          );

        const mC = m(cur?.items),
          mPM = m(pm?.items),
          mPY = m(py?.items);
        const names = new Set<string>([
          ...mC.keys(),
          ...mPM.keys(),
          ...mPY.keys(),
        ]);
        const rows = Array.from(names)
          .map((name) => ({
            name,
            curr: mC.get(name) ?? 0,
            prevM: mPM.has(name) ? mPM.get(name)! : null,
            prevY: mPY.has(name) ? mPY.get(name)! : null,
          }))
          .sort((a, b) => b.curr - a.curr || a.name.localeCompare(b.name));

        this.modelDistItems.set(rows);
      } else {
        this.fetchModelDist(currentUi);
      }
    }
  }

  refreshAll(ui: AppFilter) {
    const sf = toSalesFilter(ui);
    this.fetchKpis(sf);
    this.fetchTrend(ui);
    this.fetchDoVsSpk(ui);
    this.fetchModelDist(ui);
  }

  // === KPI ===
  private fetchKpis(f: SalesFilter) {
    this.loading.set(true);
    this.error.set(null);
    const start = performance.now();

    this.state.saveFilter(f);
    this.api.getSalesKpiView(f).subscribe({
      next: (resp: UiSalesKpiResponse) => {
        this.state.saveKpiData({
          request: resp.data.request,
          kpis: resp.data.kpis,
          timestamp: Date.now(),
        });
        this.salesKpi.set(resp.data.kpis);
        this.hasData.set(true);
        this.isDataEmpty.set(
          !resp.data.kpis || Object.keys(resp.data.kpis).length === 0
        );

        const remain = Math.max(
          0,
          this.MIN_SPINNER_MS - (performance.now() - start)
        );
        setTimeout(() => this.loading.set(false), remain);
      },
      error: (err) => {
        this.error.set(err?.message || 'Gagal memuat data');
        this.hasData.set(false);
        this.isDataEmpty.set(true);
        const remain = Math.max(
          0,
          this.MIN_SPINNER_MS - (performance.now() - start)
        );
        setTimeout(() => this.loading.set(false), remain);
        console.error('Sales KPI fetch error:', err);
      },
    });
  }

  // === Trend Unit Terjual ===
  private fetchTrend(ui: AppFilter) {
    this.trendLoading.set(true);
    this.trendError.set(null);

    const year = getTrendYear(ui);
    const companyId = ui.company;
    const compare = !!ui.compare;

    this.api.getSalesTrendMonthlyRaw(companyId, year, compare).subscribe({
      next: (res: SalesTrendMonthlyResponse) => {
        const ds = res?.data?.salesMontlyTrend?.datasets ?? [];
        this.trendLineSeries.set(mapToLineSeries(ds, this.TREND_COLORS));
        this.state.saveTrendMonthly({ companyId, year, compare, datasets: ds });
        this.trendLoading.set(false);
      },
      error: (err) => {
        this.trendError.set(err?.message || 'Gagal memuat tren bulanan');
        this.trendLineSeries.set([]);
        this.trendLoading.set(false);
        console.error('Sales Trend fetch error:', err);
      },
    });
  }

  // === DO vs SPK ===
  private fetchDoVsSpk(ui: AppFilter) {
    this.doSpkLoading.set(true);
    this.doSpkError.set(null);

    const year = getTrendYear(ui);
    const companyId = ui.company;

    this.api.getDoVsSpkMonthlyRaw(companyId, year).subscribe({
      next: (res: DoVsSpkMonthlyResponse) => {
        const ds = res?.data?.DOvsSPKMontlyTrend?.datasets ?? [];
        this.doSpkLineSeries.set(mapToLineSeries(ds, this.DOSPK_COLORS));
        this.state.saveDoVsSpkMonthly({ companyId, year, datasets: ds });
        this.doSpkLoading.set(false);
      },
      error: (err) => {
        this.doSpkError.set(err?.message || 'Gagal memuat DO vs SPK');
        this.doSpkLineSeries.set([]);
        this.doSpkLoading.set(false);
        console.error('DOvsSPK fetch error:', err);
      },
    });
  }

  // === Distribusi Model (YoY/MoM) ===
  private fetchModelDist(ui: AppFilter) {
    this.modelDistLoading.set(true);
    this.modelDistError.set(null);

    const companyId = ui.company;
    const compare = !!ui.compare;
    const year = getTrendYear(ui);
    const month = getTrendMonth(ui);
    this.api
      .getModelDistributionMonthlyRaw(companyId, year, month, compare)
      .subscribe({
        next: (res) => {
          const cur = res?.data?.current;
          const pm = res?.data?.prevMonth;
          const py = res?.data?.prevYear;

          this.modelLabelCurr.set(cur?.label ?? 'Current');
          this.modelLabelPrevM.set(pm?.label ?? 'Prev Month');
          this.modelLabelPrevY.set(py?.label ?? 'Prev Year');

          const m = (x?: any[]) =>
            new Map<string, number>(
              (x ?? []).map((i: any) => [i.name, Number(i.value ?? 0)])
            );
          const mC = m(cur?.items),
            mPM = m(pm?.items),
            mPY = m(py?.items);
          const names = new Set<string>([
            ...mC.keys(),
            ...mPM.keys(),
            ...mPY.keys(),
          ]);

          const rows: ModelYoYMoM[] = Array.from(names)
            .map((name) => ({
              name,
              curr: mC.get(name) ?? 0,
              prevM: mPM.has(name) ? mPM.get(name)! : null,
              prevY: mPY.has(name) ? mPY.get(name)! : null,
            }))
            .sort((a, b) => b.curr - a.curr || a.name.localeCompare(b.name));

          this.modelDistItems.set(rows);
          this.state.saveModelDistributionMonthly({
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
          this.modelDistItems.set([]);
          this.modelDistLoading.set(false);
          console.error('Model Distribution fetch error:', err);
        },
      });
  }
}
