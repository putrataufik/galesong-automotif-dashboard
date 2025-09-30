// src/app/pages/sales-dashboard/sales-dashboard.facade.ts
import { inject, signal } from '@angular/core';
import {
  SalesApiService,
  UiKpis,
  UiSalesKpiResponse,
  SalesTrendMonthlyResponse,
  DoVsSpkMonthlyResponse,
  StockUnitRawResponse,
  // UiDoByBranchResponse, // (opsional) kalau ingin type hint dari service
} from '../../core/services/sales-api.service';
import { SalesStateService } from '../../core/state/sales-state.service';
import { AppFilter } from '../../types/filter.model';
import { SalesFilter } from '../../core/models/sales.models';
import { getTrendMonth, getTrendYear, toSalesFilter } from './sales.utils';
import { mapToLineSeries } from '../../shared/utils/chart-mapper';

import { forkJoin, of } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { ChartData, MultiChartData } from '../../types/charts.model';

type ModelYoYMoM = {
  name: string;
  curr: number;
  prevY: number | null;
  prevM: number | null;
};

export class SalesDashboardFacade {
  private readonly api = inject(SalesApiService);
  private readonly state = inject(SalesStateService);

  // ===== Global/UI states
  loading = signal(false);
  loadingMessage = signal('Data Sedang di Siapkan...');
  error = signal<string | null>(null);
  hasData = signal(false);
  isDataEmpty = signal(true);
  salesKpi = signal<UiKpis | null>(this.state.getKpis() as UiKpis | null);

  // ===== Trend (Unit Terjual)
  trendLoading = signal(false);
  trendError = signal<string | null>(null);
  trendLineSeries = signal<any[]>([]);

  // ===== DO vs SPK
  doSpkLoading = signal(false);
  doSpkError = signal<string | null>(null);
  doSpkLineSeries = signal<any[]>([]);

  // ===== Model Distribution (YoY/MoM)
  modelDistLoading = signal(false);
  modelDistError = signal<string | null>(null);
  modelDistItems = signal<ModelYoYMoM[]>([]);
  modelLabelCurr = signal('Current');
  modelLabelPrevY = signal('Prev Year');
  modelLabelPrevM = signal('Prev Month');

  // ===== Stock Unit (RAW)
  stockLoading = signal(false);
  stockError = signal<string | null>(null);
  stockGroups = signal<StockUnitRawResponse['data']>([]);

  // ===== DO per Cabang (Bar Chart)
  doBranchLoading = signal(false);
  doBranchError = signal<string | null>(null);
  doBranchChartData = signal<ChartData | null>(null);
  doBranchPeriodLabel = signal<string>('');

  private readonly TREND_COLORS = ['#2563eb', '#ef4444', '#10b981', '#f59e0b'];
  private readonly DOSPK_COLORS = ['#f59e0b', '#10b981'];

  /* ============================================================
     INIT (cache-first per bagian) + persist filter
     ============================================================ */
  initFromState(currentUi: AppFilter) {
    const salesFilter = toSalesFilter(currentUi);
    const companyId = currentUi.company;
    const year = getTrendYear(currentUi);
    const month = getTrendMonth(currentUi);
    const compare = !!currentUi.compare;

    // ✅ simpan filter paling awal agar state selalu konsisten
    this.state.saveFilter(salesFilter);

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

    // ===== Trend Unit Terjual (cache-first + key check)
    {
      const cached = this.state.getTrendMonthly();
      if (cached && this.state.isTrendCacheValid(companyId, year, compare)) {
        const ds = cached.datasets ?? [];
        this.trendLineSeries.set(mapToLineSeries(ds, this.TREND_COLORS));
      } else {
        this.fetchTrend(currentUi);
      }
    }

    // ===== DO vs SPK (cache-first + key check)
    {
      const cached = this.state.getDoVsSpkMonthly();
      if (cached && this.state.isDoVsSpkCacheValid(companyId, year)) {
        const ds = cached.datasets ?? [];
        this.doSpkLineSeries.set(mapToLineSeries(ds, this.DOSPK_COLORS));
      } else {
        this.fetchDoVsSpk(currentUi);
      }
    }

    // ===== Distribusi Model (cache-first + key check)
    {
      const cached = this.state.getModelDistributionMonthly();
      if (
        cached &&
        this.state.isModelDistributionCacheValid(companyId, year, month, compare)
      ) {
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
      const cached = this.state.getStockUnitRaw();
      if (cached && this.state.isStockUnitCacheValid(companyId)) {
        this.stockLoading.set(false);
        this.stockGroups.set(cached.data ?? []);
      } else {
        this.fetchStockUnits(currentUi);
      }
    }

    // ===== DO per Cabang (cache-first + key check)
    {
      const cached = this.state.getDoByBranch();
      if (cached && this.state.isDoByBranchCacheValid(salesFilter)) {
        const chart = this.buildDoBranchChartFromBlocks(
          cached.current,
          cached.prevMonth,
          cached.prevYear
        );
        this.doBranchChartData.set(chart);
        this.doBranchPeriodLabel.set(cached.current?.label ?? '');
        this.doBranchLoading.set(false);
      } else {
        this.fetchDoByBranch(currentUi);
      }
    }
  }

  /* ============================================================
     Hard-refresh: koordinasi batch + spinner global
     ============================================================ */
  refreshAll(ui: AppFilter) {
    const sf = toSalesFilter(ui);
    const companyId = ui.company;
    const year = getTrendYear(ui);
    const month = getTrendMonth(ui);
    const compare = !!ui.compare;

    // ✅ simpan filter paling awal
    this.state.saveFilter(sf);

    this.loading.set(true);
    this.error.set(null);

    // Untuk panel tertentu
    this.stockLoading.set(true);

    // DO per Cabang di-trigger di luar forkJoin agar error bisa independen
    this.fetchDoByBranch(ui);

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
          this.state.saveTrendMonthly({
            companyId,
            year,
            compare,
            datasets: ds,
            timestamp: Date.now(),
          });
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
          this.state.saveDoVsSpkMonthly({
            companyId,
            year,
            datasets: ds,
            timestamp: Date.now(),
          });
        }),
        catchError((err) => {
          this.doSpkError.set(err?.message || 'Gagal memuat DO vs SPK');
          this.doSpkLineSeries.set([]);
          console.error('DOvsSPK fetch error (refreshAll):', err);
          return of(null);
        })
      ),

      // Distribusi Model
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
              timestamp: Date.now(),
            });
          }),
          catchError((err) => {
            this.modelDistError.set(
              err?.message || 'Gagal memuat distribusi model'
            );
            this.modelDistItems.set([]);
            console.error('Model Distribution fetch error (refreshAll):', err);
            return of(null);
          })
        ),

      // Stock Unit — kelola flag stockLoading di sini
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
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe();
  }

  /* ============================================================
     KPI (UI)
     ============================================================ */
  private fetchKpis(f: SalesFilter) {
    this.error.set(null);
    // simpan filter di sini boleh, tapi kita sudah save di init/refreshAll
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

  /* ============================================================
     Trend Unit Terjual (RAW)
     ============================================================ */
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
          this.state.saveTrendMonthly({
            companyId,
            year,
            compare,
            datasets: ds,
            timestamp: Date.now(),
          });
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

  /* ============================================================
     DO vs SPK (RAW)
     ============================================================ */
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
          this.state.saveDoVsSpkMonthly({
            companyId,
            year,
            datasets: ds,
            timestamp: Date.now(),
          });
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

  /* ============================================================
     Distribusi Model (RAW -> UI tabel YoY/MoM)
     ============================================================ */
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
            timestamp: Date.now(),
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

  /* ============================================================
     Stock Unit (RAW)
     ============================================================ */
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

  /* ============================================================
     DO per Cabang (RAW -> MultiChartData) + cache
     ============================================================ */
  private fetchDoByBranch(ui: AppFilter) {
    this.doBranchLoading.set(true);
    this.doBranchError.set(null);

    const filter = toSalesFilter(ui);

    this.api
      .getDoByBranchView(filter)
      .pipe(
        tap((res) => {
          // blok current/prevMonth/prevYear (UI-ready: branchName sudah dipetakan di service)
          const cur = res?.data?.doByBranch?.current;
          const pm = res?.data?.doByBranch?.prevMonth;
          const py = res?.data?.doByBranch?.prevYear;

          const chartData = this.buildDoBranchChartFromBlocks(cur, pm, py);
          this.doBranchChartData.set(chartData);
          this.doBranchPeriodLabel.set(cur?.label ?? '');

          // ✅ Persist raw blocks ke state untuk cache-first
          this.state.saveDoByBranch({
            companyId: filter.companyId,
            branchId: filter.branchId,
            useCustomDate: filter.useCustomDate,
            compare: filter.compare,
            year: filter.year,
            month:
              filter.month == null ? null : String(filter.month).padStart(2, '0'),
            selectedDate: filter.selectedDate,
            current: cur,
            prevMonth: pm,
            prevYear: py,
            timestamp: Date.now(),
          });
        }),
        catchError((err) => {
          this.doBranchError.set(err?.message || 'Gagal memuat DO per Cabang');
          this.doBranchChartData.set({ labels: [], data: [] });
          console.error('DO per Cabang fetch error:', err);
          return of(null);
        }),
        finalize(() => this.doBranchLoading.set(false))
      )
      .subscribe();
  }

  /* ============================================================
     Helper: compose MultiChartData DO per Cabang
     ============================================================ */
  private buildDoBranchChartFromBlocks(
    cur?: { label?: string; items?: Array<{ branchName: string; value: number }> },
    pm?: { label?: string; items?: Array<{ branchName: string; value: number }> },
    py?: { label?: string; items?: Array<{ branchName: string; value: number }> },
  ): ChartData {
    const toMap = (items?: { branchName: string; value: number }[]) =>
      new Map((items ?? []).map((i) => [i.branchName, Number(i.value ?? 0)]));

    const mC = toMap(cur?.items);
    const mPM = toMap(pm?.items);
    const mPY = toMap(py?.items);

    // domain label gabungan; urut desc by current
    const labels = Array.from(new Set<string>([...mC.keys(), ...mPM.keys(), ...mPY.keys()]));
    labels.sort((a, b) => (mC.get(b) ?? 0) - (mC.get(a) ?? 0));

    const v = (m: Map<string, number>) => labels.map((name) => m.get(name) ?? 0);

    const datasets: MultiChartData['datasets'] = [];
    if (cur) {
      datasets.push({
        label: cur?.label ?? 'Current',
        data: v(mC),
        backgroundColor: '#2563eb',
        borderColor: '#1e40af',
        borderWidth: 1,
      });
    }
    if (pm) {
      datasets.push({
        label: pm?.label ?? 'Prev Month',
        data: v(mPM),
        backgroundColor: '#10b981',
        borderColor: '#047857',
        borderWidth: 1,
      });
    }
    if (py) {
      datasets.push({
        label: py?.label ?? 'Prev Year',
        data: v(mPY),
        backgroundColor: '#f59e0b',
        borderColor: '#b45309',
        borderWidth: 1,
      });
    }

    // Kalau tidak ada dataset sama sekali (edge-case), kembalikan single kosong
    if (!datasets.length) return { labels, data: [] };

    return { labels, datasets } as MultiChartData;
  }
}
