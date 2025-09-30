// src/app/core/services/sales-api.service.ts

import { Injectable } from '@angular/core';
import { Observable, throwError, catchError, map } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { SalesKpiResponse, SalesFilter } from '../models/sales.models';

import {
  formatPeriodByMode,
  validateDateFormatYYYYMMDD,
  isDateInFutureLocal,
  branchNameFromMap,
} from './service-utils';

// ==============================
// Branch code map
// ==============================

const BRANCH_CODE_MAP: Record<string, string> = {
  '0050': 'PETTARANI',
  '0051': 'PALU',
  '0052': 'KENDARI',
  '0053': 'GORONTALO',
  '0054': 'PALOPO',
  '0055': 'SUNGGUMINASA',
};

function branchNameFromCode(code?: string): string {
  return branchNameFromMap(BRANCH_CODE_MAP, code);
}

// ==============================
// UI-friendly types (adapter)
// ==============================

export type UiKpiPoint = { value: number; period: string };
export type UiKpiBranchPoint = UiKpiPoint & {
  code: string;
  branchName: string;
};
export type UiKpiModelPoint = UiKpiPoint & { name: string };

export interface UiKpis {
  totalUnitSales?: {
    selected?: UiKpiPoint;
    prevMonth?: UiKpiPoint;
    prevYear?: UiKpiPoint;
    prevDate?: UiKpiPoint;
  };
  totalSPK?: {
    selected?: UiKpiPoint;
    prevMonth?: UiKpiPoint;
    prevYear?: UiKpiPoint;
    prevDate?: UiKpiPoint;
  };
  totalDO?: {
    selected?: UiKpiPoint;
    prevMonth?: UiKpiPoint;
    prevYear?: UiKpiPoint;
    prevDate?: UiKpiPoint;
  };
  totalProspect?: {
    selected?: UiKpiPoint;
    prevMonth?: UiKpiPoint;
    prevYear?: UiKpiPoint;
    prevDate?: UiKpiPoint;
  };
  totalHotProspect?: {
    selected?: UiKpiPoint;
    prevMonth?: UiKpiPoint;
    prevYear?: UiKpiPoint;
    prevDate?: UiKpiPoint;
  };
  topBranch?: {
    selected?: UiKpiBranchPoint;
    prevMonth?: UiKpiBranchPoint;
    prevYear?: UiKpiBranchPoint;
    prevDate?: UiKpiBranchPoint;
  };
  topModel?: {
    selected?: UiKpiModelPoint;
    prevMonth?: UiKpiModelPoint;
    prevYear?: UiKpiModelPoint;
    prevDate?: UiKpiModelPoint;
  };
}

export interface UiSalesKpiResponse {
  status: string;
  message: string;
  data: {
    kpis: UiKpis;
    request: any;
  };
}

export interface RawTrendDataset {
  label: string;
  data: number[];
}

export interface SalesTrendMonthlyResponse {
  status: string;
  message: string;
  data: {
    // ikut ejaan API: "salesMontlyTrend" (tanpa 'h')
    salesMontlyTrend?: {
      datasets?: RawTrendDataset[];
    };
  };
}

// ↓↓↓ tambahkan di bawah SalesTrendMonthlyResponse
export interface DoVsSpkMonthlyResponse {
  status: string;
  message: string;
  data: {
    // ikut ejaan API: "DOvsSPKMontlyTrend" (tanpa 'h')
    DOvsSPKMontlyTrend?: {
      datasets?: RawTrendDataset[]; // { label: string; data: number[] } sama seperti RawTrendDataset
    };
  };
}

// RAW types: Model distribution monthly
export interface ModelDistributionItem {
  name: string;
  value: number;
}
export interface ModelDistributionBlock {
  period: string; // e.g. "2025-09"
  label: string; // e.g. "Sep 2025"
  items: ModelDistributionItem[];
}
export interface SalesModelDistributionMonthlyResponse {
  status: string;
  message: string;
  data: {
    current?: ModelDistributionBlock;
    prevMonth?: ModelDistributionBlock;
    prevYear?: ModelDistributionBlock;
  };
}

// ==== Stock Unit RAW (tanpa params) ====

export interface RawStockUnitDetail {
  tglsjln: string; // "2025-09-27"
  kgudang: string; // "0001"
  thnprod: string; // "2025" | "0" | "202"
  warna: string; // "WHT  " (bisa ada padding)
  hargabeli: string; // "342068188.00"
  ngudang: string; // "SHOWROOM UNIT PETTARANI"
  tymotor: string; // "CRT N LINE 2TR" (bisa ada padding)
  notes:string
}

export interface RawStockUnitGroup {
  kgudang: string; // "0001"
  ngudang: string; // "SHOWROOM UNIT PETTARANI"
  count: number; // 11
  detail: RawStockUnitDetail[];
}

export interface StockUnitRawResponse {
  status: string; // "success" | ...
  message: string; // "berhasil mengambil data"
  data: RawStockUnitGroup[];
}

/* ============================================================
   NEW: DO per Cabang (RAW & UI)
   ============================================================ */

// RAW dari backend sesuai contoh kamu
export interface DoByBranchItemRaw {
  branchCode: string; // "0050"
  value: number;
}
export interface DoByBranchBlockRaw {
  period: string; // "2025-08"
  label: string;  // "Aug 2025"
  items: DoByBranchItemRaw[];
}
export interface DoByBranchRawResponse {
  status: string;
  message: string;
  data: {
    DOperCabang?: {
      data?: {
        current?: DoByBranchBlockRaw;
        prevMonth?: DoByBranchBlockRaw;
        prevYear?: DoByBranchBlockRaw;
      };
    };
  };
}

// UI response: sudah pakai branchName (kode ikut disertakan untuk debugging/filter)
export interface UiDoByBranchItem {
  branchName: string;
  code: string;
  value: number;
}
export interface UiDoByBranchBlock {
  period: string;
  label: string;
  items: UiDoByBranchItem[];
}
export interface UiDoByBranchResponse {
  status: string;
  message: string;
  data: {
    doByBranch: {
      current?: UiDoByBranchBlock;
      prevMonth?: UiDoByBranchBlock;
      prevYear?: UiDoByBranchBlock;
    };
    request: any;
  };
}

// ==============================
// Service
// ==============================

@Injectable({ providedIn: 'root' })
export class SalesApiService extends BaseApiService {
  // ==============================
  // Public API (RAW)
  // ==============================

  /**
   * Get Sales KPI data berdasarkan filter parameters (RAW response)
   */
  getSalesKpiData(filter: SalesFilter): Observable<SalesKpiResponse> {
    const company = filter.companyId;
    const endpoint = 'getSalesReportByDate';

    // Validasi (versi longgar: year-only boleh)
    const validationError = this.validateFilter(filter);
    if (validationError) {
      return throwError(() => new Error(validationError));
    }

    // Build params
    let params: Record<string, string | number>;
    try {
      params = this.buildSalesKpiParams(filter);
    } catch (e) {
      return throwError(() => (e instanceof Error ? e : new Error(String(e))));
    }

    const url = `${this.baseUrlOf(company)}/${endpoint}`;

    return this.http
      .get<SalesKpiResponse>(url, {
        headers: this.authHeaders,
        params: this.buildParams(params),
      })
      .pipe(catchError((err) => this.handleError(err)));
  }

  getSalesTrendMonthlyRaw(
    companyId: string,
    year: string,
    compare: boolean = true
  ): Observable<SalesTrendMonthlyResponse> {
    // Validasi ringan tahun (optional, longgar)
    const y = parseInt(year, 10);
    const nowYear = new Date().getFullYear();
    if (!y || y < 2020 || y > nowYear) {
      // kalau mau strict:
      // return throwError(() => new Error('Invalid year range'));
    }

    const endpoint = 'getSalesTrendMonthly';
    const url = `${this.baseUrlOf(companyId)}/${endpoint}`;
    const params = { year, compare: String(compare) };

    return this.http
      .get<SalesTrendMonthlyResponse>(url, {
        headers: this.authHeaders,
        params: this.buildParams(params),
      })
      .pipe(catchError((err) => this.handleError(err)));
  }

  getDoVsSpkMonthlyRaw(
    companyId: string,
    year: string
  ): Observable<DoVsSpkMonthlyResponse> {
    // Validasi ringan tahun (optional)
    const y = parseInt(year, 10);
    const nowYear = new Date().getFullYear();
    if (!y || y < 2020 || y > nowYear) {
      // kalau mau strict:
      // return throwError(() => new Error('Invalid year range'));
    }

    const endpoint = 'getSalesReportDOvsSPKMonthly';
    const url = `${this.baseUrlOf(companyId)}/${endpoint}`;
    const params = { year };

    return this.http
      .get<DoVsSpkMonthlyResponse>(url, {
        headers: this.authHeaders,
        params: this.buildParams(params),
      })
      .pipe(catchError((err) => this.handleError(err)));
  }

  getModelDistributionMonthlyRaw(
    companyId: string,
    year: string,
    month: string,
    compare: boolean = true
  ): Observable<SalesModelDistributionMonthlyResponse> {
    // Validasi sederhana
    const y = parseInt(year, 10);
    const nowYear = new Date().getFullYear();
    if (!y || y < 2020 || y > nowYear) {
      // kalau mau strict:
      // return throwError(() => new Error('Invalid year range'));
    }
    const m = parseInt(month as any, 10);
    if (!m || m < 1 || m > 12) {
      // kalau mau strict:
      // return throwError(() => new Error('Month must be between 1 and 12'));
    }
    const mm = String(month).padStart(2, '0');

    const endpoint = 'getSalesReportByUnitMonthly';
    // Jika kamu sudah punya baseSummaryUrlOf, lebih aman gunakan itu:
    // const url = `${this.baseSummaryUrlOf(companyId)}/${endpoint}`;
    const url = `${this.baseUrlOf(companyId)}/${endpoint}`;

    const params = {
      compare: String(compare),
      year,
      month: mm, // API contoh pakai 2 digit, misal "08"
    };

    return this.http
      .get<SalesModelDistributionMonthlyResponse>(url, {
        headers: this.authHeaders,
        params: this.buildParams(params),
      })
      .pipe(catchError((err) => this.handleError(err)));
  }

  getStockUnitRaw(companyId: string): Observable<StockUnitRawResponse> {
    const endpoint = 'getStockUnit';
    const url = `${this.baseUrlOf(companyId)}/${endpoint}`;
    return this.http
      .get<any>(url, {
        headers: this.authHeaders,
      })  
      .pipe(catchError((err) => this.handleError(err)));
  }

  /* ============================================================
     NEW: Public API for DO per Cabang
     ============================================================ */

  /**
   * RAW: ambil DO per cabang (SUMMARY)
   * Contoh endpoint backend:
   *   /SUMMARY/{company}/getDoByBranch
   * Namun kita tetap pakai baseUrlOf(company) agar konsisten
   * (kalau ada baseSummaryUrlOf di BaseApiService, ganti ke sana).
   */
  getDoByBranchRaw(filter: SalesFilter): Observable<DoByBranchRawResponse> {
    const company = filter.companyId;

    // validasi light: reuse validateFilter (izinkan year-only)
    const validationError = this.validateFilter(filter);
    if (validationError) {
      return throwError(() => new Error(validationError));
    }

    const endpoint = 'getDoByBranch';
    // Jika punya summary base url:
    // const url = `${this.baseSummaryUrlOf(company)}/${endpoint}`;
    const url = `${this.baseUrlOf(company)}/${endpoint}`;

    const params = this.buildDoByBranchParams(filter);

    return this.http
      .get<DoByBranchRawResponse>(url, {
        headers: this.authHeaders,
        params: this.buildParams(params),
      })
      .pipe(catchError((err) => this.handleError(err)));
  }

  /**
   * UI-ready: DO per cabang dengan branchName
   */
  getDoByBranchView(filter: SalesFilter): Observable<UiDoByBranchResponse> {
    return this.getDoByBranchRaw(filter).pipe(
      map((raw) => this.toUiDoByBranchResponse(raw))
    );
  }

  /**
   * Get Sales KPI data siap-pakai untuk komponen (UI-ready response)
   */
  getSalesKpiView(filter: SalesFilter): Observable<UiSalesKpiResponse> {
    return this.getSalesKpiData(filter).pipe(
      map((res) => this.toUiResponse(res, !!filter.useCustomDate))
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
    const filter: SalesFilter = {
      companyId,
      branchId: 'all-branch',
      useCustomDate: true,
      compare,
      year: null,
      month: null,
      selectedDate,
    };

    return this.getSalesKpiData(filter);
  }

  getSalesKpiByMonth(
    companyId: string,
    year: string,
    month: string | null,
    compare: boolean = true
  ): Observable<SalesKpiResponse> {
    const filter: SalesFilter = {
      companyId,
      branchId: 'all-branch',
      useCustomDate: false,
      compare,
      year,
      month, // boleh null => "year-only"
      selectedDate: null,
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

    return this.getSalesKpiByMonth(companyId, year, month, compare);
  }

  getSalesKpiByBranch(filter: SalesFilter): Observable<SalesKpiResponse> {
    if (filter.branchId === 'all-branch') {
      const err = 'Branch ID is required for branch-specific data';
      return throwError(() => new Error(err));
    }
    return this.getSalesKpiData(filter);
  }

  // ==============================
  // Adapter: RAW -> UI
  // ==============================

  private mapPoint(point: any, useCustomDate: boolean): UiKpiPoint | undefined {
    if (!point) return undefined;
    return {
      value: Number(point.value ?? 0),
      period: formatPeriodByMode(String(point.period ?? ''), useCustomDate)!,
    };
  }

  private mapBranchPoint(
    point: any,
    useCustomDate: boolean
  ): UiKpiBranchPoint | undefined {
    if (!point) return undefined;
    const code = String(point.code ?? '');
    return {
      value: Number(point.value ?? 0),
      period: formatPeriodByMode(String(point.period ?? ''), useCustomDate)!,
      code,
      branchName: branchNameFromCode(code),
    };
  }

  private mapModelPoint(
    point: any,
    useCustomDate: boolean
  ): UiKpiModelPoint | undefined {
    if (!point) return undefined;
    return {
      value: Number(point.value ?? 0),
      period: formatPeriodByMode(String(point.period ?? ''), useCustomDate)!,
      name: String(point.name ?? ''),
    };
  }

  private toUiResponse(raw: any, useCustomDate: boolean): UiSalesKpiResponse {
    const k = raw?.data?.kpis ?? {};
    const ui: UiKpis = {
      totalUnitSales: {
        selected: this.mapPoint(k.totalUnitSales?.selected, useCustomDate),
        prevMonth: this.mapPoint(k.totalUnitSales?.prevMonth, useCustomDate),
        prevYear: this.mapPoint(k.totalUnitSales?.prevYear, useCustomDate),
        prevDate: this.mapPoint(k.totalUnitSales?.prevDate, useCustomDate),
      },
      totalSPK: {
        selected: this.mapPoint(k.totalSPK?.selected, useCustomDate),
        prevMonth: this.mapPoint(k.totalSPK?.prevMonth, useCustomDate),
        prevYear: this.mapPoint(k.totalSPK?.prevYear, useCustomDate),
        prevDate: this.mapPoint(k.totalSPK?.prevDate, useCustomDate),
      },
      totalDO: {
        selected: this.mapPoint(k.totalDO?.selected, useCustomDate),
        prevMonth: this.mapPoint(k.totalDO?.prevMonth, useCustomDate),
        prevYear: this.mapPoint(k.totalDO?.prevYear, useCustomDate),
        prevDate: this.mapPoint(k.totalDO?.prevDate, useCustomDate),
      },
      totalProspect: {
        selected: this.mapPoint(k.totalProspect?.selected, useCustomDate),
        prevMonth: this.mapPoint(k.totalProspect?.prevMonth, useCustomDate),
        prevYear: this.mapPoint(k.totalProspect?.prevYear, useCustomDate),
        prevDate: this.mapPoint(k.totalProspect?.prevDate, useCustomDate),
      },
      totalHotProspect: {
        selected: this.mapPoint(k.totalHotProspect?.selected, useCustomDate),
        prevMonth: this.mapPoint(k.totalHotProspect?.prevMonth, useCustomDate),
        prevYear: this.mapPoint(k.totalHotProspect?.prevYear, useCustomDate),
        prevDate: this.mapPoint(k.totalHotProspect?.prevDate, useCustomDate),
      },
      topBranch: {
        selected: this.mapBranchPoint(k.topBranch?.selected, useCustomDate),
        prevMonth: this.mapBranchPoint(k.topBranch?.prevMonth, useCustomDate),
        prevYear: this.mapBranchPoint(k.topBranch?.prevYear, useCustomDate),
        prevDate: this.mapBranchPoint(k.topBranch?.prevDate, useCustomDate),
      },
      topModel: {
        selected: this.mapModelPoint(k.topModel?.selected, useCustomDate),
        prevMonth: this.mapModelPoint(k.topModel?.prevMonth, useCustomDate),
        prevYear: this.mapModelPoint(k.topModel?.prevYear, useCustomDate),
        prevDate: this.mapModelPoint(k.topModel?.prevDate, useCustomDate),
      },
    };

    return {
      status: String(raw?.status ?? ''),
      message: String(raw?.message ?? ''),
      data: {
        kpis: ui,
        request: raw?.data?.request ?? raw?.request ?? null,
      },
    };
  }

  /* ============================================================
     Adapter: DO per Cabang RAW -> UI (branchName)
     ============================================================ */

  private mapDoByBranchBlockRawToUi(
    block?: DoByBranchBlockRaw
  ): UiDoByBranchBlock | undefined {
    if (!block) return undefined;
    const items: UiDoByBranchItem[] = (block.items ?? []).map((it) => ({
      branchName: branchNameFromCode(it.branchCode),
      code: String(it.branchCode ?? ''),
      value: Number(it.value ?? 0),
    }));
    return {
      period: String(block.period ?? ''),
      label: String(block.label ?? ''),
      items,
    };
    }

  private toUiDoByBranchResponse(raw: DoByBranchRawResponse): UiDoByBranchResponse {
    const dataNode = raw?.data?.DOperCabang?.data;
    return {
      status: String(raw?.status ?? ''),
      message: String(raw?.message ?? ''),
      data: {
        doByBranch: {
          current: this.mapDoByBranchBlockRawToUi(dataNode?.current),
          prevMonth: this.mapDoByBranchBlockRawToUi(dataNode?.prevMonth),
          prevYear: this.mapDoByBranchBlockRawToUi(dataNode?.prevYear),
        },
        // simpan echo request kalau backend menaruhnya; kalau tidak ada, null
        request: (raw as any)?.data?.request ?? (raw as any)?.request ?? null,
      },
    };
  }

  // ==============================
  // Helpers (params, validation, errors)
  // ==============================

  private buildSalesKpiParams(
    filter: SalesFilter
  ): Record<string, string | number> {
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

  /**
   * Params builder khusus DO per cabang.
   * Mengirim alias untuk kompatibilitas: branchId/branch, selectedDate/date/selected.
   */
  private buildDoByBranchParams(
    filter: SalesFilter
  ): Record<string, string | number> {
    const params: Record<string, string | number> = {
      useCustomDate: String(filter.useCustomDate),
      compare: String(filter.compare),
      // alias company kalau backend butuh
      company: String(filter.companyId),
    };

    // branch param (pakai keduanya untuk aman)
    if (filter.branchId && filter.branchId !== 'all-branch') {
      params['branchId'] = filter.branchId;
      params['branch'] = filter.branchId;
    }

    if (filter.useCustomDate) {
      if (!filter.selectedDate) {
        throw new Error('selectedDate is required when useCustomDate is true');
      }
      params['selectedDate'] = filter.selectedDate;
      // alias
      params['date'] = filter.selectedDate;
      params['selected'] = filter.selectedDate;

      // null-kan periodik
      params['year'] = 'null';
      params['month'] = 'null';
      return params;
    }

    // mode year/month (year-only diperbolehkan)
    if (!filter.year) {
      throw new Error('year is required when useCustomDate is false');
    }
    params['year'] = filter.year;

    if (filter.month == null) {
      params['month'] = 'null';
    } else {
      const mm = String(filter.month).padStart(2, '0');
      params['month'] = mm;
    }

    // kosongkan selected aliases
    params['selectedDate'] = 'null';
    params['date'] = 'null';
    params['selected'] = 'null';

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

    return throwError(() => new Error(errorMessage));
  }

  validateDateFormat(date: string): boolean {
    return validateDateFormatYYYYMMDD(date);
  }

  isDateInFuture(date: string): boolean {
    return isDateInFutureLocal(date);
  }

  // Versi B (longgar): mengizinkan year-only saat useCustomDate=false
  validateFilter(filter: SalesFilter): string | null {
    if (!filter.companyId) return 'Company ID is required';

    if (filter.useCustomDate) {
      if (!filter.selectedDate)
        return 'selectedDate is required when useCustomDate is true';
      if (!this.validateDateFormat(filter.selectedDate))
        return 'selectedDate must be in YYYY-MM-DD format';
      if (this.isDateInFuture(filter.selectedDate))
        return 'selectedDate cannot be in the future';
    } else {
      if (!filter.year) return 'year is required when useCustomDate is false';

      const year = parseInt(filter.year, 10);
      if (year < 2020 || year > new Date().getFullYear())
        return 'Invalid year range';

      if (filter.month != null) {
        const month = parseInt(String(filter.month), 10);
        if (month < 1 || month > 12) return 'Month must be between 1 and 12';
      }
    }
    return null;
  }

  buildCacheKey(filter: SalesFilter): string {
    return filter.useCustomDate
      ? `sales_kpi_${filter.companyId}_${filter.branchId}_${filter.selectedDate}_${filter.compare}`
      : `sales_kpi_${filter.companyId}_${filter.branchId}_${filter.year}_${filter.month}_${filter.compare}`;
  }
}
