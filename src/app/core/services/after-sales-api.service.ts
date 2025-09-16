// src/app/core/services/after-sales-api.service.ts
import { Injectable } from '@angular/core';
import { Observable, throwError, catchError, tap, finalize, map } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { SalesFilter } from '../models/sales.models';

// ==============================
// Branch code map & format utils (reuse seperti di Sales)
// ==============================
const BRANCH_CODE_MAP: Record<string, string> = {
  '0001': 'PETTARANI',
  '0003': 'PALU',
  '0004': 'KENDARI',
  '0002': 'GORONTALO',
  '0005': 'PALOPO',
  '0006': 'SUNGGUMINASA',
};

const MON3_UPPER = ['JAN','FEB','MAR','APR','MEI','JUN','JUL','AGU','SEP','OKT','NOV','DES'];
const MON3_LOWER = ['jan','feb','mar','apr','mei','jun','jul','agu','sep','okt','nov','des'];

function branchNameFromCode(code?: string): string {
  if (!code) return '';
  return BRANCH_CODE_MAP[code] ?? code;
}
function formatPeriodMonthYear(period?: string | null): string {
  if (!period) return '';
  if (period.length < 7) return period;
  const y = period.slice(0, 4);
  const m = Number(period.slice(5, 7));
  const mon = (m >= 1 && m <= 12) ? MON3_UPPER[m - 1] : period.slice(5, 7);
  return `${y} ${mon}`;
}
function formatPeriodCustomDate(period?: string | null): string {
  if (!period) return '';
  if (period.length < 10) return period;
  const y = period.slice(0, 4);
  const m = Number(period.slice(5, 7));
  const d = Number(period.slice(8, 10));
  const mon = (m >= 1 && m <= 12) ? MON3_LOWER[m - 1] : period.slice(5, 7);
  return `${d} ${mon} ${y}`;
}

// ==============================
// RAW response types (sesuai contoh yang dikirim)
// ==============================
type Num = number | null | undefined;

export interface RawAfterSalesMetrics {
  mekanik: Num;
  hari_kerja: Num;
  biaya_usaha: Num;
  profit: Num;

  after_sales_realisasi: Num;
  after_sales_target: Num;

  unit_entry_realisasi: Num;
  unit_entry_target: Num;

  jasa_service_realisasi: Num;
  jasa_service_target: Num;

  part_tunai_realisasi: Num;
  part_tunai_target: Num;

  total_revenue_realisasi: Num;
  total_revenue_target: Num;

  // CPUS dan Non CPUS
  unit_entry_oli_realisasi: Num;
  unit_entry_express_realisasi: Num;
  unit_entry_rutin_realisasi: Num;
  unit_entry_sedang_realisasi: Num;
  unit_entry_berat_realisasi: Num;
  unit_entry_overhoul_realisasi: Num;
  unit_entry_claim_realisasi: Num;
  unit_entry_kelistrikan_realisasi: Num;
  unit_entry_kupon_realisasi: Num;
  unit_entry_over_size_realisasi: Num;
  unit_entry_pdc_realisasi: Num;
  unit_entry_cvt_realisasi: Num;
  unit_entry_body_repair_realisasi: Num;

  // CPUS dan Non CPUS
  jasa_service_oli_realisasi: Num;
  jasa_service_express_realisasi: Num;
  jasa_service_rutin_realisasi: Num;
  jasa_service_sedang_realisasi: Num;
  jasa_service_berat_realisasi: Num;
  jasa_service_overhoul_realisasi: Num;
  jasa_service_claim_realisasi: Num;
  jasa_service_kelistrikan_realisasi: Num;
  jasa_service_kupon_realisasi: Num;
  jasa_service_over_size_realisasi: Num;
  jasa_service_pdc_realisasi: Num;
  jasa_service_cvt_realisasi: Num;
  jasa_service_body_repair_realisasi: Num;

  // CPUS dan Non CPUS
  part_bengkel_realisasi: Num;
  part_bengkel_target: Num;
  part_bengkel_oli_realisasi: Num;
  part_bengkel_express_realisasi: Num;
  part_bengkel_rutin_realisasi: Num;
  part_bengkel_sedang_realisasi: Num;
  part_bengkel_berat_realisasi: Num;
  part_bengkel_overhoul_realisasi: Num;

}

export interface RawComparisonBlock {
  period: string | null;
  metrics: RawAfterSalesMetrics;
}

export interface RawProporsiItem {
  name: string;
  selected: { period: string | null; value: Num };
  prevDate?: { period: string | null; value: Num };
  prevMonth?: { period: string | null; value: Num };
}

export interface RawAfterSalesResponse {
  status: string;
  message: string;
  data: {
    request: any;
    kpi_data: {
      selected: RawAfterSalesMetrics;
      comparisons?: {
        prevDate?: RawComparisonBlock;
        prevMonth?: RawComparisonBlock;
        prevYear?: RawComparisonBlock; // jaga2 kalau backend nanti nambah
      };
    };
    proporsi_after_sales?: {
      data: { items: RawProporsiItem[] }
    };
  };
}

// ==============================
// UI-friendly types
// ==============================
export type UiPoint = { value: number; period: string };

export interface UiMetricPair {
  realisasi: number;
  target: number;
}

export interface UiAfterSalesTotals {
  // meta
  mekanik: number;
  hariKerja: number;
  biayaUsaha: number;
  profit: number;

  // high-level KPI
  afterSales: UiMetricPair;
  unitEntry: UiMetricPair;
  jasaService: UiMetricPair;
  partBengkel: UiMetricPair;
  partTunai: UiMetricPair;
  totalRevenue: UiMetricPair;
}

export interface UiBreakdownEntry { name: string; value: number; }
export interface UiBreakdowns {
  unitEntryByType: UiBreakdownEntry[];     // dari unit_entry_*_realisasi
  jasaServiceByType: UiBreakdownEntry[];   // dari jasa_service_*_realisasi
  partBengkelByType: UiBreakdownEntry[];   // dari part_bengkel_*_realisasi
}

export interface UiComparison {
  period: string;
  totals: UiAfterSalesTotals;
  breakdowns: UiBreakdowns;
}

export interface UiProporsiSlice {
  name: string;
  selected: UiPoint;
  prevDate?: UiPoint;
  prevMonth?: UiPoint;
  prevYear?: UiPoint;
}

export interface UiAfterSalesKpis {
  selected: UiComparison;
  prevDate?: UiComparison;
  prevMonth?: UiComparison;
  prevYear?: UiComparison;
}

export interface UiAfterSalesViewResponse {
  status: string;
  message: string;
  data: {
    kpis: UiAfterSalesKpis;
    proporsi: UiProporsiSlice[];
    request: any;
  };
}

// ==============================
// Service
// ==============================
@Injectable({ providedIn: 'root' })
export class AfterSalesApiService extends BaseApiService {
  private readonly DEBUG = true;
  private readonly ENDPOINT = 'getAfterSalesReportByDate';

  private logGroupStart(label: string, data?: unknown) {
    if (!this.DEBUG) return;
    console.groupCollapsed(`[AfterSalesApiService] ${label}`);
    if (data !== undefined) console.log('→', data);
    console.time(`[TIMER] ${label}`);
  }
  private log(...args: any[]) { if (this.DEBUG) console.log('[AfterSalesApiService]', ...args); }
  private logWarn(...args: any[]) { if (this.DEBUG) console.warn('[AfterSalesApiService]', ...args); }
  private logError(...args: any[]) { if (this.DEBUG) console.error('[AfterSalesApiService]', ...args); }
  private logGroupEnd(label: string) {
    if (!this.DEBUG) return;
    console.timeEnd(`[TIMER] ${label}`);
    console.groupEnd();
  }

  // ==============================
  // Public API (RAW)
  // ==============================
  getAfterSalesKpiData(filter: SalesFilter): Observable<RawAfterSalesResponse> {
    const label = `getAfterSalesKpiData ${filter.companyId}`;
    this.logGroupStart(label, { filter });

    // Validasi (longgar, sama seperti Sales)
    const validationError = this.validateFilter(filter);
    if (validationError) {
      this.logWarn('validateFilter: FAIL →', validationError);
      this.logGroupEnd(label);
      return throwError(() => new Error(validationError));
    } else {
      this.log('validateFilter: OK');
    }

    // Build params
    let params: Record<string, string | number>;
    try {
      params = this.buildParamsFromFilter(filter);
      this.log('buildParamsFromFilter →', params);
    } catch (e) {
      this.logError('buildParamsFromFilter threw:', e);
      this.logGroupEnd(label);
      return throwError(() => e instanceof Error ? e : new Error(String(e)));
    }

    const url = `${this.baseUrlOf(filter.companyId)}/${this.ENDPOINT}`;
    this.log('HTTP GET →', { url });

    return this.http.get<RawAfterSalesResponse>(
      url,
      { headers: this.authHeaders, params: this.buildParams(params) }
    ).pipe(
      tap(res => this.log('HTTP OK, response sample →', res)),
      catchError(err => {
        this.logError('HTTP ERROR captured → forwarding to handleError');
        return this.handleError(err);
      }),
      finalize(() => this.logGroupEnd(label))
    );
  }

  /**
   * UI-ready response
   */
  getAfterSalesKpiView(filter: SalesFilter): Observable<UiAfterSalesViewResponse> {
    const label = `getAfterSalesKpiView ${filter.companyId}`;
    this.logGroupStart(label, { filter });

    return this.getAfterSalesKpiData(filter).pipe(
      tap(res => this.log('RAW response →', res)),
      map(res => this.toUiResponse(res, !!filter.useCustomDate)),
      tap(ui => this.log('UI-ready response →', ui)),
      finalize(() => this.logGroupEnd(label))
    );
  }

  // ==============================
  // Preset helpers (paralel dengan Sales)
// ==============================
  getAfterSalesByDate(
    companyId: string,
    selectedDate: string,
    compare: boolean = true
  ): Observable<RawAfterSalesResponse> {
    const filter: SalesFilter = {
      companyId,
      branchId: 'all-branch',
      useCustomDate: true,
      compare,
      year: null,
      month: null,
      selectedDate
    };
    return this.getAfterSalesKpiData(filter);
  }

  getAfterSalesByMonth(
    companyId: string,
    year: string,
    month: string | null,
    compare: boolean = true
  ): Observable<RawAfterSalesResponse> {
    const filter: SalesFilter = {
      companyId,
      branchId: 'all-branch',
      useCustomDate: false,
      compare,
      year,
      month,
      selectedDate: null
    };
    return this.getAfterSalesKpiData(filter);
  }

  getCurrentMonthAfterSales(
    companyId: string,
    compare: boolean = true
  ): Observable<RawAfterSalesResponse> {
    const now = new Date();
    const year = String(now.getFullYear());
    const month = String(now.getMonth() + 1);
    return this.getAfterSalesByMonth(companyId, year, month, compare);
  }

  getAfterSalesByBranch(filter: SalesFilter): Observable<RawAfterSalesResponse> {
    if (filter.branchId === 'all-branch') {
      return throwError(() => new Error('Branch ID is required for branch-specific data'));
    }
    return this.getAfterSalesKpiData(filter);
  }

  // ==============================
  // Adapter: RAW -> UI
  // ==============================
  private n(x: Num): number { return typeof x === 'number' && isFinite(x) ? x : 0; }

  private formatPeriod(period: string | null | undefined, useCustomDate: boolean): string {
    return useCustomDate ? formatPeriodCustomDate(period ?? '') : formatPeriodMonthYear(period ?? '');
  }

  private toPair(realisasi: Num, target: Num): UiMetricPair {
    return { realisasi: this.n(realisasi), target: this.n(target) };
  }

  private metricsToTotals(m: RawAfterSalesMetrics): UiAfterSalesTotals {
    return {
      mekanik: this.n(m.mekanik),
      hariKerja: this.n(m.hari_kerja),
      biayaUsaha: this.n(m.biaya_usaha),
      profit: this.n(m.profit),

      afterSales:   this.toPair(m.after_sales_realisasi, m.after_sales_target),
      unitEntry:    this.toPair(m.unit_entry_realisasi, m.unit_entry_target),
      jasaService:  this.toPair(m.jasa_service_realisasi, m.jasa_service_target),

      partBengkel:  this.toPair(m.part_bengkel_realisasi, m.part_bengkel_target),
      partTunai:    this.toPair(m.part_tunai_realisasi, m.part_tunai_target),
      totalRevenue: this.toPair(m.total_revenue_realisasi, m.total_revenue_target),
    };
  }

  private metricsToBreakdowns(m: RawAfterSalesMetrics): UiBreakdowns {
    const unitEntryByType: UiBreakdownEntry[] = [
      { name: 'OLI', value: this.n(m.unit_entry_oli_realisasi) },
      { name: 'EXPRESS', value: this.n(m.unit_entry_express_realisasi) },
      { name: 'RUTIN', value: this.n(m.unit_entry_rutin_realisasi) },
      { name: 'SEDANG', value: this.n(m.unit_entry_sedang_realisasi) },
      { name: 'BERAT', value: this.n(m.unit_entry_berat_realisasi) },
      { name: 'OVERHOUL', value: this.n(m.unit_entry_overhoul_realisasi) },
      { name: 'CLAIM', value: this.n(m.unit_entry_claim_realisasi) },
      { name: 'KELISTRIKAN', value: this.n(m.unit_entry_kelistrikan_realisasi) },
      { name: 'KUPON', value: this.n(m.unit_entry_kupon_realisasi) },
      { name: 'OVER SIZE', value: this.n(m.unit_entry_over_size_realisasi) },
      { name: 'PDC', value: this.n(m.unit_entry_pdc_realisasi) },
      { name: 'CVT', value: this.n(m.unit_entry_cvt_realisasi) },
      { name: 'BODY REPAIR', value: this.n(m.unit_entry_body_repair_realisasi) },
    ].filter(x => x.value !== 0);

    const jasaServiceByType: UiBreakdownEntry[] = [
      { name: 'OLI', value: this.n(m.jasa_service_oli_realisasi) },
      { name: 'EXPRESS', value: this.n(m.jasa_service_express_realisasi) },
      { name: 'RUTIN', value: this.n(m.jasa_service_rutin_realisasi) },
      { name: 'SEDANG', value: this.n(m.jasa_service_sedang_realisasi) },
      { name: 'BERAT', value: this.n(m.jasa_service_berat_realisasi) },
      { name: 'OVERHOUL', value: this.n(m.jasa_service_overhoul_realisasi) },
      { name: 'CLAIM', value: this.n(m.jasa_service_claim_realisasi) },
      { name: 'KELISTRIKAN', value: this.n(m.jasa_service_kelistrikan_realisasi) },
      { name: 'KUPON', value: this.n(m.jasa_service_kupon_realisasi) },
      { name: 'OVER SIZE', value: this.n(m.jasa_service_over_size_realisasi) },
      { name: 'PDC', value: this.n(m.jasa_service_pdc_realisasi) },
      { name: 'CVT', value: this.n(m.jasa_service_cvt_realisasi) },
      { name: 'BODY REPAIR', value: this.n(m.jasa_service_body_repair_realisasi) },
    ].filter(x => x.value !== 0);

    const partBengkelByType: UiBreakdownEntry[] = [
      { name: 'OLI', value: this.n(m.part_bengkel_oli_realisasi) },
      { name: 'EXPRESS', value: this.n(m.part_bengkel_express_realisasi) },
      { name: 'RUTIN', value: this.n(m.part_bengkel_rutin_realisasi) },
      { name: 'SEDANG', value: this.n(m.part_bengkel_sedang_realisasi) },
      { name: 'BERAT', value: this.n(m.part_bengkel_berat_realisasi) },
      { name: 'OVERHOUL', value: this.n(m.part_bengkel_overhoul_realisasi) },
    ].filter(x => x.value !== 0);

    return { unitEntryByType, jasaServiceByType, partBengkelByType };
  }

  private buildComparison(block: RawComparisonBlock | undefined, useCustomDate: boolean): UiComparison | undefined {
    if (!block) return undefined;
    return {
      period: this.formatPeriod(block.period, useCustomDate),
      totals: this.metricsToTotals(block.metrics),
      breakdowns: this.metricsToBreakdowns(block.metrics),
    };
  }

  private toUiResponse(raw: RawAfterSalesResponse, useCustomDate: boolean): UiAfterSalesViewResponse {
    const sel = raw?.data?.kpi_data?.selected as RawAfterSalesMetrics;
    const comps = raw?.data?.kpi_data?.comparisons ?? {};
    const selectedPeriod = useCustomDate
      ? this.formatPeriod(raw?.data?.request?.selectedDate ?? null, true)
      : this.formatPeriod(`${raw?.data?.request?.year}-${String(raw?.data?.request?.month ?? '').padStart(2,'0')}`, false);

    const selected: UiComparison = {
      period: selectedPeriod,
      totals: this.metricsToTotals(sel),
      breakdowns: this.metricsToBreakdowns(sel),
    };

    const prevDate  = this.buildComparison(comps.prevDate,  useCustomDate);
    const prevMonth = this.buildComparison(comps.prevMonth, useCustomDate);
    const prevYear  = this.buildComparison((comps as any).prevYear, useCustomDate); // optional future-proof

    // proporsi
    const proporsiItems = raw?.data?.proporsi_after_sales?.data?.items ?? [];
    const proporsi: UiProporsiSlice[] = proporsiItems.map(it => ({
      name: it.name,
      selected:  { value: this.n(it.selected?.value),  period: this.formatPeriod(it.selected?.period ?? null, useCustomDate) },
      prevDate:  it.prevDate  ? { value: this.n(it.prevDate.value),  period: this.formatPeriod(it.prevDate.period,  useCustomDate) } : undefined,
      prevMonth: it.prevMonth ? { value: this.n(it.prevMonth.value), period: this.formatPeriod(it.prevMonth.period, useCustomDate) } : undefined,
      prevYear:  (it as any).prevYear ? { value: this.n((it as any).prevYear.value), period: this.formatPeriod((it as any).prevYear.period, useCustomDate) } : undefined,
    }));

    const ui: UiAfterSalesKpis = {
      selected,
      ...(prevDate  ? { prevDate }  : {}),
      ...(prevMonth ? { prevMonth } : {}),
      ...(prevYear  ? { prevYear }  : {}),
    };

    return {
      status: String(raw?.status ?? ''),
      message: String(raw?.message ?? ''),
      data: {
        kpis: ui,
        proporsi,
        request: raw?.data?.request ?? null,
      },
    };
  }

  // ==============================
  // Helpers (params, validation, errors)
// ==============================
  private buildParamsFromFilter(filter: SalesFilter): Record<string, string | number> {
    const params: Record<string, string | number> = {
      useCustomDate: String(filter.useCustomDate),
      compare: String(filter.compare),
    };

    if (filter.branchId && filter.branchId !== 'all-branch') {
      params['branchId'] = filter.branchId;
    }

    if (filter.useCustomDate) {
      if (!filter.selectedDate) throw new Error('selectedDate is required when useCustomDate is true');
      params['selectedDate'] = filter.selectedDate;
      params['year'] = 'null';
      params['month'] = 'null';
      return params;
    }

    if (!filter.year) throw new Error('year is required when useCustomDate is false');

    params['year'] = filter.year;
    params['selectedDate'] = 'null';
    params['month'] = filter.month == null ? 'null' : String(filter.month).padStart(2, '0');
    return params;
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = 'Unknown error occurred';
    if (error?.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else if (error) {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      }
    }
    this.logError('After Sales API Error →', errorMessage, { raw: error });
    return throwError(() => new Error(errorMessage));
  }

  validateDateFormat(date: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const ok = dateRegex.test(date) && !isNaN(new Date(date).getTime());
    this.log('validateDateFormat →', { date, ok });
    return ok;
  }

  isDateInFuture(date: string): boolean {
    const m = date?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) { this.log('isDateInFuture → invalid format', { date }); return false; }
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const d = Number(m[3]);
    const inputDate = new Date(y, mo, d);
    inputDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isFuture = inputDate.getTime() > today.getTime();
    this.log('isDateInFuture →', { date, inputDate, today, isFuture });
    return isFuture;
  }

  validateFilter(filter: SalesFilter): string | null {
    this.log('validateFilter(input) →', filter);

    if (!filter.companyId) return 'Company ID is required';

    if (filter.useCustomDate) {
      if (!filter.selectedDate) return 'selectedDate is required when useCustomDate is true';
      if (!this.validateDateFormat(filter.selectedDate)) return 'selectedDate must be in YYYY-MM-DD format';
      if (this.isDateInFuture(filter.selectedDate)) return 'selectedDate cannot be in the future';
    } else {
      if (!filter.year) return 'year is required when useCustomDate is false';

      const year = parseInt(filter.year, 10);
      if (year < 2020 || year > new Date().getFullYear()) return 'Invalid year range';

      if (filter.month != null) {
        const month = parseInt(String(filter.month), 10);
        if (month < 1 || month > 12) return 'Month must be between 1 and 12';
      }
    }
    return null;
  }

  buildCacheKey(filter: SalesFilter): string {
    const key = filter.useCustomDate
      ? `aftersales_kpi_${filter.companyId}_${filter.branchId}_${filter.selectedDate}_${filter.compare}`
      : `aftersales_kpi_${filter.companyId}_${filter.branchId}_${filter.year}_${filter.month}_${filter.compare}`;
    this.log('buildCacheKey →', key);
    return key;
  }
}
