// src/app/core/services/sales-api.service.ts

import { Injectable } from '@angular/core';
import { Observable, throwError, catchError, tap, finalize, map } from 'rxjs';
import { BaseApiService } from './base-api.service';
import {
  SalesKpiResponse,
  SalesFilter
} from '../models/sales.models';

// ==============================
// Branch code map & format utils
// ==============================

const BRANCH_CODE_MAP: Record<string, string> = {
  '0050': 'PETTARANI',
  '0051': 'PALU',
  '0052': 'KENDARI',
  '0053': 'GORONTALO',
  '0054': 'PALOPO',
  '0055': 'SUNGGUMINASA',
};

const MON3_UPPER = ['JAN','FEB','MAR','APR','MEI','JUN','JUL','AGU','SEP','OKT','NOV','DES'];
const MON3_LOWER = ['jan','feb','mar','apr','mei','jun','jul','agu','sep','okt','nov','des'];

// "2025-09" -> "2025 SEP"
function formatPeriodMonthYear(period: string): string {
  if (!period || period.length < 7) return period ?? '';
  const y = period.slice(0, 4);
  const m = Number(period.slice(5, 7));
  const mon = (m >= 1 && m <= 12) ? MON3_UPPER[m - 1] : period.slice(5, 7);
  return `${y} ${mon}`;
}

// "2025-09-08" -> "8 sep 2025"
function formatPeriodCustomDate(period: string): string {
  if (!period || period.length < 10) return period ?? '';
  const y = period.slice(0, 4);
  const m = Number(period.slice(5, 7));
  const d = Number(period.slice(8, 10));
  const mon = (m >= 1 && m <= 12) ? MON3_LOWER[m - 1] : period.slice(5, 7);
  return `${d} ${mon} ${y}`;
}

function branchNameFromCode(code?: string): string {
  if (!code) return '';
  return BRANCH_CODE_MAP[code] ?? code;
}

// ==============================
// UI-friendly types (adapter)
// ==============================

export type UiKpiPoint = { value: number; period: string };
export type UiKpiBranchPoint = UiKpiPoint & { code: string; branchName: string };
export type UiKpiModelPoint = UiKpiPoint & { name: string };

export interface UiKpis {
  totalUnitSales?:  { selected?: UiKpiPoint; prevMonth?: UiKpiPoint; prevYear?: UiKpiPoint; prevDate?: UiKpiPoint };
  totalSPK?:        { selected?: UiKpiPoint; prevMonth?: UiKpiPoint; prevYear?: UiKpiPoint; prevDate?: UiKpiPoint };
  totalDO?:         { selected?: UiKpiPoint; prevMonth?: UiKpiPoint; prevYear?: UiKpiPoint; prevDate?: UiKpiPoint };
  totalProspect?:   { selected?: UiKpiPoint; prevMonth?: UiKpiPoint; prevYear?: UiKpiPoint; prevDate?: UiKpiPoint };
  totalHotProspect?:{ selected?: UiKpiPoint; prevMonth?: UiKpiPoint; prevYear?: UiKpiPoint; prevDate?: UiKpiPoint };
  topBranch?:       { selected?: UiKpiBranchPoint; prevMonth?: UiKpiBranchPoint; prevYear?: UiKpiBranchPoint; prevDate?: UiKpiBranchPoint };
  topModel?:        { selected?: UiKpiModelPoint;  prevMonth?: UiKpiModelPoint;  prevYear?: UiKpiModelPoint;  prevDate?: UiKpiModelPoint  };

}

export interface UiSalesKpiResponse {
  status: string;
  message: string;
  data: {
    kpis: UiKpis;
    request: any;
  };
}

// ==============================
// Service
// ==============================

@Injectable({ providedIn: 'root' })
export class SalesApiService extends BaseApiService {

  // Toggle semua console.* debug
  private readonly DEBUG = true;

  private logGroupStart(label: string, data?: unknown) {
    if (!this.DEBUG) return;
    console.groupCollapsed(`[SalesApiService] ${label}`);
    if (data !== undefined) console.log('→', data);
    console.time(`[TIMER] ${label}`);
  }
  private log(...args: any[]) {
    if (!this.DEBUG) return;
    console.log('[SalesApiService]', ...args);
  }
  private logWarn(...args: any[]) {
    if (!this.DEBUG) return;
    console.warn('[SalesApiService]', ...args);
  }
  private logError(...args: any[]) {
    if (!this.DEBUG) return;
    console.error('[SalesApiService]', ...args);
  }
  private logGroupEnd(label: string) {
    if (!this.DEBUG) return;
    console.timeEnd(`[TIMER] ${label}`);
    console.groupEnd();
  }

  // ==============================
  // Public API (RAW)
  // ==============================

  /**
   * Get Sales KPI data berdasarkan filter parameters (RAW response)
   */
  getSalesKpiData(filter: SalesFilter): Observable<SalesKpiResponse> {
    const label = `getSalesKpiData ${filter.companyId}`;
    this.logGroupStart(label, { filter });

    const company = filter.companyId;
    const endpoint = 'getSalesReportByDate';

    // Validasi (versi longgar: year-only boleh)
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
      params = this.buildSalesKpiParams(filter);
      this.log('buildSalesKpiParams →', params);
    } catch (e) {
      this.logError('buildSalesKpiParams threw:', e);
      this.logGroupEnd(label);
      return throwError(() => e instanceof Error ? e : new Error(String(e)));
    }

    const url = `${this.baseUrlOf(company)}/${endpoint}`;
    this.log('HTTP GET →', { url });

    return this.http.get<SalesKpiResponse>(
      url,
      {
        headers: this.authHeaders,
        params: this.buildParams(params)
      }
    ).pipe(
      tap((res) => {
        this.log('HTTP OK, response sample →', res);
      }),
      catchError((err) => {
        this.logError('HTTP ERROR captured → forwarding to handleError');
        return this.handleError(err);
      }),
      finalize(() => {
        this.logGroupEnd(label);
      })
    );
  }

  /**
   * Get Sales KPI data siap-pakai untuk komponen (UI-ready response)
   */
  getSalesKpiView(filter: SalesFilter): Observable<UiSalesKpiResponse> {
    const label = `getSalesKpiView ${filter.companyId}`;
    this.logGroupStart(label, { filter });

    return this.getSalesKpiData(filter).pipe(
      tap(res => this.log('RAW response →', res)),
      map(res => this.toUiResponse(res, !!filter.useCustomDate)),
      tap(ui => this.log('UI-ready response →', ui)),
      finalize(() => this.logGroupEnd(label))
    );
  }

  // ==============================
  // Preset helpers
  // ==============================

  getSalesKpiByDate(
    companyId: string,
    selectedDate: string,
    compare: boolean = true
  ): Observable<SalesKpiResponse> {
    this.log('getSalesKpiByDate called →', { companyId, selectedDate, compare });

    const filter: SalesFilter = {
      companyId,
      branchId: 'all-branch',
      useCustomDate: true,
      compare,
      year: null,
      month: null,
      selectedDate
    };

    return this.getSalesKpiData(filter);
  }

  getSalesKpiByMonth(
    companyId: string,
    year: string,
    month: string | null,
    compare: boolean = true
  ): Observable<SalesKpiResponse> {
    this.log('getSalesKpiByMonth called →', { companyId, year, month, compare });

    const filter: SalesFilter = {
      companyId,
      branchId: 'all-branch',
      useCustomDate: false,
      compare,
      year,
      month,          // boleh null => "year-only"
      selectedDate: null
    };

    return this.getSalesKpiData(filter);
  }

  getCurrentMonthSalesKpi(
    companyId: string,
    compare: boolean = true
  ): Observable<SalesKpiResponse> {
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString();

    this.log('getCurrentMonthSalesKpi → now:', { year, month });

    return this.getSalesKpiByMonth(companyId, year, month, compare);
  }

  getSalesKpiByBranch(filter: SalesFilter): Observable<SalesKpiResponse> {
    this.log('getSalesKpiByBranch called →', filter);
    if (filter.branchId === 'all-branch') {
      const err = 'Branch ID is required for branch-specific data';
      this.logWarn(err);
      return throwError(() => new Error(err));
    }
    return this.getSalesKpiData(filter);
  }

  // ==============================
  // Adapter: RAW -> UI
  // ==============================

  private formatPeriodByMode(period: string, useCustomDate: boolean): string {
    return useCustomDate ? formatPeriodCustomDate(period) : formatPeriodMonthYear(period);
  }

  private mapPoint(point: any, useCustomDate: boolean): UiKpiPoint | undefined {
    if (!point) return undefined;
    return {
      value: Number(point.value ?? 0),
      period: this.formatPeriodByMode(String(point.period ?? ''), useCustomDate),
    };
  }

  private mapBranchPoint(point: any, useCustomDate: boolean): UiKpiBranchPoint | undefined {
    if (!point) return undefined;
    const code = String(point.code ?? '');
    return {
      value: Number(point.value ?? 0),
      period: this.formatPeriodByMode(String(point.period ?? ''), useCustomDate),
      code,
      branchName: branchNameFromCode(code),
    };
  }

  private mapModelPoint(point: any, useCustomDate: boolean): UiKpiModelPoint | undefined {
    if (!point) return undefined;
    return {
      value: Number(point.value ?? 0),
      period: this.formatPeriodByMode(String(point.period ?? ''), useCustomDate),
      name: String(point.name ?? ''),
    };
  }

  private toUiResponse(raw: any, useCustomDate: boolean): UiSalesKpiResponse {
    const k = raw?.data?.kpis ?? {};
    const ui: UiKpis = {
      totalUnitSales: {
        selected:  this.mapPoint(k.totalUnitSales?.selected,  useCustomDate),
        prevMonth: this.mapPoint(k.totalUnitSales?.prevMonth, useCustomDate),
        prevYear:  this.mapPoint(k.totalUnitSales?.prevYear,  useCustomDate),
        prevDate:  this.mapPoint(k.totalUnitSales?.prevDate,  useCustomDate),
      },
      totalSPK: {
        selected:  this.mapPoint(k.totalSPK?.selected,  useCustomDate),
        prevMonth: this.mapPoint(k.totalSPK?.prevMonth, useCustomDate),
        prevYear:  this.mapPoint(k.totalSPK?.prevYear,  useCustomDate),
        prevDate:  this.mapPoint(k.totalSPK?.prevDate,  useCustomDate),
      },
      totalDO: {
        selected:  this.mapPoint(k.totalDO?.selected,  useCustomDate),
        prevMonth: this.mapPoint(k.totalDO?.prevMonth, useCustomDate),
        prevYear:  this.mapPoint(k.totalDO?.prevYear,  useCustomDate),
        prevDate:  this.mapPoint(k.totalDO?.prevDate,  useCustomDate),
      },
      totalProspect: {
        selected:  this.mapPoint(k.totalProspect?.selected,  useCustomDate),
        prevMonth: this.mapPoint(k.totalProspect?.prevMonth, useCustomDate),
        prevYear:  this.mapPoint(k.totalProspect?.prevYear,  useCustomDate),
        prevDate:  this.mapPoint(k.totalProspect?.prevDate,  useCustomDate),
      },
      totalHotProspect: {
        selected:  this.mapPoint(k.totalHotProspect?.selected,  useCustomDate),
        prevMonth: this.mapPoint(k.totalHotProspect?.prevMonth, useCustomDate),
        prevYear:  this.mapPoint(k.totalHotProspect?.prevYear,  useCustomDate),
        prevDate:  this.mapPoint(k.totalHotProspect?.prevDate,  useCustomDate),
      },
      topBranch: {
        selected:  this.mapBranchPoint(k.topBranch?.selected,  useCustomDate),
        prevMonth: this.mapBranchPoint(k.topBranch?.prevMonth, useCustomDate),
        prevYear:  this.mapBranchPoint(k.topBranch?.prevYear,  useCustomDate),
        prevDate:  this.mapBranchPoint(k.topBranch?.prevDate,  useCustomDate),
      },
      topModel: {
        selected:  this.mapModelPoint(k.topModel?.selected,  useCustomDate),
        prevMonth: this.mapModelPoint(k.topModel?.prevMonth, useCustomDate),
        prevYear:  this.mapModelPoint(k.topModel?.prevYear,  useCustomDate),
        prevDate:  this.mapModelPoint(k.topModel?.prevDate,  useCustomDate),
      },
    };

    console.log('[SalesApiService] toUiResponse →', {
      status: String(raw?.status ?? ''),
      message: String(raw?.message ?? ''),
      kpis: ui,
      request: raw?.data?.request ?? raw?.request ?? null,
    });
    return {
      status: String(raw?.status ?? ''),
      message: String(raw?.message ?? ''),
      data: {
      kpis: ui,
      request: raw?.data?.request ?? raw?.request ?? null,
      },
    };
  }

  // ==============================
  // Helpers (params, validation, errors)
  // ==============================

  private buildSalesKpiParams(filter: SalesFilter): Record<string, string | number> {
    this.log('buildSalesKpiParams(input) →', filter);

    const params: Record<string, string | number> = {
      useCustomDate: String(filter.useCustomDate),
      compare: String(filter.compare),
    };

    if (filter.branchId && filter.branchId !== 'all-branch') {
      params['branchId'] = filter.branchId;
    }

    if (filter.useCustomDate) {
      if (!filter.selectedDate) {
        throw new Error('selectedDate is required when useCustomDate is true');
      }
      params['selectedDate'] = filter.selectedDate;
      params['year'] = 'null';
      params['month'] = 'null';
      return params;
    }

    // Month/Year mode
    if (!filter.year) {
      throw new Error('year is required when useCustomDate is false');
    }

    params['year'] = filter.year;
    params['selectedDate'] = 'null';

    // Izinkan year-only
    if (filter.month == null) {
      params['month'] = 'null';
    } else {
      const mm = String(filter.month).padStart(2, '0');
      params['month'] = mm;
    }

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

    this.logError('Sales API Error →', errorMessage, { raw: error });
    return throwError(() => new Error(errorMessage));
  }

  validateDateFormat(date: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const ok = dateRegex.test(date) && !isNaN(new Date(date).getTime());
    this.log('validateDateFormat →', { date, ok });
    return ok;
  }

  isDateInFuture(date: string): boolean {
  // parse manual biar local midnight, bukan UTC
  const m = date?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) {
    this.log('isDateInFuture → invalid format', { date });
    return false; // atau lempar error sesuai kebutuhanmu
  }

  const y = Number(m[1]);
  const mo = Number(m[2]) - 1; // 0-based
  const d = Number(m[3]);

  const inputDate = new Date(y, mo, d); // local midnight
  inputDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isFuture = inputDate.getTime() > today.getTime();
  this.log('isDateInFuture →', { date, inputDate, today, isFuture });
  return isFuture;
}


  // Versi B (longgar): mengizinkan year-only saat useCustomDate=false
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
      ? `sales_kpi_${filter.companyId}_${filter.branchId}_${filter.selectedDate}_${filter.compare}`
      : `sales_kpi_${filter.companyId}_${filter.branchId}_${filter.year}_${filter.month}_${filter.compare}`;
    this.log('buildCacheKey →', key);
    return key;
  }
}
