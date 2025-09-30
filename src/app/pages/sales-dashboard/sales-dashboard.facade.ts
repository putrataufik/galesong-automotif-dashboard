import { inject, signal } from '@angular/core';
import {
  SalesApiService,
  UiKpis,
  UiSalesKpiResponse,
  SalesTrendMonthlyResponse,
  DoVsSpkMonthlyResponse,
  StockUnitRawResponse,
} from '../../core/services/sales-api.service';
import { SalesStateService } from '../../core/state/sales-state.service';
import { AppFilter } from '../../types/filter.model';
import { SalesFilter } from '../../core/models/sales.models';
import { getTrendMonth, getTrendYear, toSalesFilter } from './sales.utils';
import { mapToLineSeries } from '../../shared/utils/chart-mapper';

import { forkJoin, of } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';

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

  // Stock Unit (RAW)
  stockLoading = signal(false);
  stockError = signal<string | null>(null);
  stockGroups = signal<StockUnitRawResponse['data']>([]);

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

    // ===== Stock Unit (cache-first)
    {
      const companyId = currentUi.company;
      const cached = this.state.getStockUnitRaw();
      if (cached && this.state.isStockUnitCacheValid(companyId)) {
        // PENTING: pastikan flag loading = false saat pakai cache
        this.stockLoading.set(false);
        this.stockGroups.set(cached.data ?? []);
      } else {
        this.fetchStockUnits(currentUi);
      }
    }
  }

  // Hard-refresh: koordinasi batch + spinner global
  refreshAll(ui: AppFilter) {
    const sf = toSalesFilter(ui);
    const companyId = ui.company;
    const year = getTrendYear(ui);
    const month = getTrendMonth(ui);
    const compare = !!ui.compare;

    this.loading.set(true);
    this.error.set(null);

    // Set loading per-bagian: minimal untuk Stock Unit supaya panel tak "nyangkut"
    this.stockLoading.set(true);

    const reqs = [
      // KPI
      this.api.getSalesKpiView(sf).pipe(
        tap((resp: UiSalesKpiResponse) => {
          this.state.saveKpiData({
            request: resp.data.request,
            kpis: resp.data.kpis,
            timestamp: Date.now(),
          });
          this.salesKpi.set(resp.data.kpis);
          const ok = !!resp.data.kpis && Object.keys(resp.data.kpis).length > 0;
          this.hasData.set(ok);
          this.isDataEmpty.set(!ok);
        }),
        catchError((err) => {
          this.error.set(err?.message || 'Gagal memuat data');
          this.hasData.set(false);
          this.isDataEmpty.set(true);
          console.error('Sales KPI fetch error (refreshAll):', err);
          return of(null);
        })
      ),

      // Trend
      this.api.getSalesTrendMonthlyRaw(companyId, year, compare).pipe(
        tap((res: SalesTrendMonthlyResponse) => {
          const ds = res?.data?.salesMontlyTrend?.datasets ?? [];
          this.trendLineSeries.set(mapToLineSeries(ds, this.TREND_COLORS));
          this.state.saveTrendMonthly({ companyId, year, compare, datasets: ds });
        }),
        catchError((err) => {
          this.trendError.set(err?.message || 'Gagal memuat tren bulanan');
          this.trendLineSeries.set([]);
          console.error('Sales Trend fetch error (refreshAll):', err);
          return of(null);
        })
      ),

      // DO vs SPK
      this.api.getDoVsSpkMonthlyRaw(companyId, year).pipe(
        tap((res: DoVsSpkMonthlyResponse) => {
          const ds = res?.data?.DOvsSPKMontlyTrend?.datasets ?? [];
          this.doSpkLineSeries.set(mapToLineSeries(ds, this.DOSPK_COLORS));
          this.state.saveDoVsSpkMonthly({ companyId, year, datasets: ds });
        }),
        catchError((err) => {
          this.doSpkError.set(err?.message || 'Gagal memuat DO vs SPK');
          this.doSpkLineSeries.set([]);
          console.error('DOvsSPK fetch error (refreshAll):', err);
          return of(null);
        })
      ),

      // Distribusi Model
      this.api.getModelDistributionMonthlyRaw(companyId, year, month, compare).pipe(
        tap((res) => {
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
            companyId, year, month, compare,
            current: cur, prevMonth: pm, prevYear: py
          });
        }),
        catchError((err) => {
          this.modelDistError.set(err?.message || 'Gagal memuat distribusi model');
          this.modelDistItems.set([]);
          console.error('Model Distribution fetch error (refreshAll):', err);
          return of(null);
        })
      ),

      // Stock Unit — PENTING: kelola flag stockLoading di sini
      this.api.getStockUnitRaw(companyId).pipe(
        tap((res: StockUnitRawResponse) => {
          const groups = Array.isArray(res?.data) ? res.data : [];
          this.stockGroups.set(groups);
          this.state.saveStockUnitRaw(res, companyId);
        }),
        catchError((err) => {
          this.stockError.set(err?.message || 'Gagal memuat Stock Unit');
          this.stockGroups.set([]);
          console.error('Stock Unit fetch error (refreshAll):', err);
          return of(null);
        }),
        finalize(() => this.stockLoading.set(false))
      ),
    ];

    forkJoin(reqs)
      .pipe(
        finalize(() => {
          this.loading.set(false);
        })
      )
      .subscribe();
  }

  // === KPI ===
  private fetchKpis(f: SalesFilter) {
    this.error.set(null);
    this.state.saveFilter(f);
    this.api.getSalesKpiView(f).subscribe({
      next: (resp: UiSalesKpiResponse) => {
        this.state.saveKpiData({
          request: resp.data.request,
          kpis: resp.data.kpis,
          timestamp: Date.now(),
        });
        this.salesKpi.set(resp.data.kpis);
        const ok = !!resp.data.kpis && Object.keys(resp.data.kpis).length > 0;
        this.hasData.set(ok);
        this.isDataEmpty.set(!ok);
      },
      error: (err) => {
        this.error.set(err?.message || 'Gagal memuat data');
        this.hasData.set(false);
        this.isDataEmpty.set(true);
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

    this.api
      .getSalesTrendMonthlyRaw(companyId, year, compare)
      .pipe(
        tap((res: SalesTrendMonthlyResponse) => {
          const ds = res?.data?.salesMontlyTrend?.datasets ?? [];
          this.trendLineSeries.set(mapToLineSeries(ds, this.TREND_COLORS));
          this.state.saveTrendMonthly({ companyId, year, compare, datasets: ds });
        }),
        catchError((err) => {
          this.trendError.set(err?.message || 'Gagal memuat tren bulanan');
          this.trendLineSeries.set([]);
          console.error('Sales Trend fetch error:', err);
          return of(null);
        }),
        finalize(() => this.trendLoading.set(false))
      )
      .subscribe();
  }

  // === DO vs SPK ===
  private fetchDoVsSpk(ui: AppFilter) {
    this.doSpkLoading.set(true);
    this.doSpkError.set(null);

    const year = getTrendYear(ui);
    const companyId = ui.company;

    this.api
      .getDoVsSpkMonthlyRaw(companyId, year)
      .pipe(
        tap((res: DoVsSpkMonthlyResponse) => {
          const ds = res?.data?.DOvsSPKMontlyTrend?.datasets ?? [];
          this.doSpkLineSeries.set(mapToLineSeries(ds, this.DOSPK_COLORS));
          this.state.saveDoVsSpkMonthly({ companyId, year, datasets: ds });
        }),
        catchError((err) => {
          this.doSpkError.set(err?.message || 'Gagal memuat DO vs SPK');
          this.doSpkLineSeries.set([]);
          console.error('DOvsSPK fetch error:', err);
          return of(null);
        }),
        finalize(() => this.doSpkLoading.set(false))
      )
      .subscribe();
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
      .pipe(
        tap((res) => {
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
        }),
        catchError((err) => {
          this.modelDistError.set(
            err?.message || 'Gagal memuat distribusi model'
          );
          this.modelDistItems.set([]);
          console.error('Model Distribution fetch error:', err);
          return of(null);
        }),
        finalize(() => this.modelDistLoading.set(false))
      )
      .subscribe();
  }

  // === Stock Unit (RAW) ===
  private fetchStockUnits(ui: AppFilter) {
    this.stockLoading.set(true);
    this.stockError.set(null);

    const companyId = ui.company;
    this.api
      .getStockUnitRaw(companyId)
      .pipe(
        tap((res: StockUnitRawResponse) => {
          const groups = Array.isArray(res?.data) ? res.data : [];
          this.stockGroups.set(groups);
          this.state.saveStockUnitRaw(res, companyId);
        }),
        catchError((err) => {
          this.stockError.set(err?.message || 'Gagal memuat Stock Unit');
          this.stockGroups.set([]);
          console.error('Stock Unit fetch error:', err);
          return of(null);
        }),
        finalize(() => this.stockLoading.set(false))
      )
      .subscribe();
  }
}
