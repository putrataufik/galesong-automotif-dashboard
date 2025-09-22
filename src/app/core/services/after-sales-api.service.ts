// src/app/core/services/after-sales-api.service.ts
import { Injectable } from '@angular/core';
import { Observable, throwError, catchError, map } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { SalesFilter } from '../models/sales.models';

import {
  formatPeriodByMode,
  validateDateFormatYYYYMMDD,
  isDateInFutureLocal,
  toNumberSafe,
} from './service-utils';

// ===== RAW response contracts (sesuaikan jika backend berubah) =====
type Num = number | null | undefined;

export interface RawAfterSalesMetrics {
  mekanik: Num; hari_kerja: Num; biaya_usaha: Num; profit: Num;

  after_sales_realisasi: Num; after_sales_target: Num;
  unit_entry_realisasi: Num;  unit_entry_target: Num;
  jasa_service_realisasi: Num; jasa_service_target: Num;

  // unit entry breakdown
  unit_entry_oli_realisasi: Num;        unit_entry_express_realisasi: Num;
  unit_entry_rutin_realisasi: Num;      unit_entry_sedang_realisasi: Num;
  unit_entry_berat_realisasi: Num;      unit_entry_overhoul_realisasi: Num;
  unit_entry_claim_realisasi: Num;      unit_entry_kelistrikan_realisasi: Num;
  unit_entry_kupon_realisasi: Num;      unit_entry_over_size_realisasi: Num;
  unit_entry_pdc_realisasi: Num;        unit_entry_cvt_realisasi: Num;
  unit_entry_body_repair_realisasi: Num;

  // jasa service breakdown
  jasa_service_oli_realisasi: Num;      jasa_service_express_realisasi: Num;
  jasa_service_rutin_realisasi: Num;    jasa_service_sedang_realisasi: Num;
  jasa_service_berat_realisasi: Num;    jasa_service_overhoul_realisasi: Num;
  jasa_service_claim_realisasi: Num;    jasa_service_kelistrikan_realisasi: Num;
  jasa_service_kupon_realisasi: Num;    jasa_service_over_size_realisasi: Num;
  jasa_service_pdc_realisasi: Num;      jasa_service_cvt_realisasi: Num;
  jasa_service_body_repair_realisasi: Num;

  // parts + revenue
  part_bengkel_realisasi: Num;          part_bengkel_target: Num;
  part_bengkel_oli_realisasi: Num;      part_bengkel_express_realisasi: Num;
  part_bengkel_rutin_realisasi: Num;    part_bengkel_sedang_realisasi: Num;
  part_bengkel_berat_realisasi: Num;    part_bengkel_overhoul_realisasi: Num;

  part_tunai_realisasi: Num;            part_tunai_target: Num;

  total_revenue_realisasi: Num;         total_revenue_target: Num;

  // ====== computed (FE only) ======
  after_sales_plus_part_tunai_realisasi?: number;
  after_sales_plus_part_tunai_target?: number;

  service_cabang_realisasi?: number;
  service_cabang_target?: number;
  profit_realisasi?: number;
  ganti_oli_realisasi?: number;
  ganti_oli_target?: number;
}

export interface RawComparisonBlock {
  period: string | null;
  metrics: RawAfterSalesMetrics;
}

export interface RawProporsiItem {
  name: string;
  selected:  { period: string | null; value: Num };
  prevDate?: { period: string | null; value: Num };
  prevMonth?:{ period: string | null; value: Num };
  // prevYear? backend opsional
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
        prevYear?: RawComparisonBlock;
      };
    };
    proporsi_after_sales?: { data: { items: RawProporsiItem[] } };
  };
}

/* ===========================
   UI-ready (period formatted)
=========================== */
export interface UiComparisonBlock {
  period: string | null; // sudah diformat
  metrics: RawAfterSalesMetrics; // nilai tetap, termasuk computed
}
export interface UiProporsiPoint { period: string | null; value: number }
export interface UiProporsiItem {
  name: string;
  selected: UiProporsiPoint;
  prevDate?: UiProporsiPoint;
  prevMonth?: UiProporsiPoint;
}
export interface UiAfterSalesResponse {
  status: string;
  message: string;
  data: {
    request: any;
    kpi_data: {
      selected: RawAfterSalesMetrics;
      comparisons?: {
        prevDate?: UiComparisonBlock;
        prevMonth?: UiComparisonBlock;
        prevYear?: UiComparisonBlock;
      };
    };
    proporsi_after_sales?: { data: { items: UiProporsiItem[] } };
  };
}

// Mapping branchId AfterSales → Sales (untuk param branchIdTarget)
const BRANCHID_TO_TARGET: Record<string, string> = {
  // after-sales -> sales
  '0001': '0050', // PETTARANI
  '0002': '0053', // GORONTALO
  '0003': '0051', // PALU
  '0004': '0052', // KENDARI
  '0005': '0054', // PALOPO
  '0006': '0055', // SUNGGUMINASA
  'all-branch': 'all-branch',
};

function resolveBranchIdTarget(branchId?: string): string | undefined {
  if (!branchId) return undefined;
  return BRANCHID_TO_TARGET[branchId] ?? branchId;
}

// ==============================
// Service
// ==============================
@Injectable({ providedIn: 'root' })
export class AfterSalesApiService extends BaseApiService {
  private readonly ENDPOINT = 'getAfterSalesReportByDate';

  /* ===========================
     PUBLIC: RAW (plus computed)
  ============================ */
  getAfterSalesRaw(filter: SalesFilter): Observable<RawAfterSalesResponse> {
    const err = this.validateFilter(filter);
    if (err) {
      return throwError(() => new Error(err));
    }

    let params: Record<string, string | number>;
    try {
      params = this.buildParamsFromFilter(filter);
    } catch (e) {
      return throwError(() => (e instanceof Error ? e : new Error(String(e))));
    }

    const url = `${this.baseUrlOf(filter.companyId)}/${this.ENDPOINT}`;

    return this.http
      .get<RawAfterSalesResponse>(url, {
        headers: this.authHeaders,
        params: this.buildParams(params),
      })
      .pipe(
        // Enrich: metrik turunan
        map((res) => this.enrichResponseWithComputed(res)),
        catchError((err2) => this.handleError(err2))
      );
  }

  /* =========================================
     UI-ready (period diformat, +computed)
  ========================================= */
  getAfterSalesView(filter: SalesFilter): Observable<UiAfterSalesResponse> {
    return this.getAfterSalesRaw(filter).pipe(
      map((raw) => this.toUiAfterSalesResponse(raw, !!filter.useCustomDate))
    );
  }

  // ===== Helpers (params/validation/errors) =====
  private buildParamsFromFilter(filter: SalesFilter): Record<string, string | number> {
    const params: Record<string, string | number> = {
      useCustomDate: String(!!filter.useCustomDate),
      compare: String(!!filter.compare),
    };

    // === branchId & branchIdTarget ===
    const bid = filter.branchId;
    const bidTarget = resolveBranchIdTarget(bid);

    if (bid && bid !== 'all-branch') {
      params['branchId'] = bid;
    }
    if (bidTarget) {
      params['branchIdTarget'] = bidTarget;
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

    if (!filter.year) throw new Error('year is required when useCustomDate is false');
    params['year'] = filter.year;
    params['selectedDate'] = 'null';
    params['month'] = filter.month == null ? 'null' : String(filter.month).padStart(2, '0');
    return params;
  }

  private validateDateFormat(date: string): boolean {
    return validateDateFormatYYYYMMDD(date);
  }

  private isDateInFuture(date: string): boolean {
    return isDateInFutureLocal(date);
  }

  private validateFilter(filter: SalesFilter): string | null {
    if (!filter?.companyId) return 'Company ID is required';

    if (filter.useCustomDate) {
      if (!filter.selectedDate) return 'selectedDate is required when useCustomDate is true';
      if (!this.validateDateFormat(filter.selectedDate)) return 'selectedDate must be in YYYY-MM-DD format';
      if (this.isDateInFuture(filter.selectedDate)) return 'selectedDate cannot be in the future';
    } else {
      if (!filter.year) return 'year is required when useCustomDate is false';
      const y = parseInt(filter.year, 10);
      if (y < 2020 || y > new Date().getFullYear()) return 'Invalid year range';
      if (filter.month != null) {
        const mo = parseInt(String(filter.month), 10);
        if (mo < 1 || mo > 12) return 'Month must be between 1 and 12';
      }
    }
    return null;
  }

  private handleError(error: any): Observable<never> {
    let msg = 'Unknown error occurred';
    if (error?.error instanceof ErrorEvent) {
      msg = `Error: ${error.error.message}`;
    } else if (error) {
      msg = error?.error?.message ?? `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    return throwError(() => new Error(msg));
  }

  // ------------------ Rumus & Enrichment ------------------
  private num(v: Num): number {
    return toNumberSafe(v);
  }

  /**
   * CATATAN:
   * - Service Cabang: bentuk rumus tetap menghasilkan = after_sales_realisasi (aljabar).
   * - Revisi: after sales + part tunai.
   * - ProfitRealisasi: formula sesuai spesifikasi kamu.
   * - Ganti Oli = bagian residual dari service cabang (asumsi).
   */
  private computeDerived(m: RawAfterSalesMetrics) {
    const js  = this.num(m.jasa_service_realisasi);
    const as  = this.num(m.after_sales_realisasi);
    const pb  = this.num(m.part_bengkel_realisasi);
    const pt  = this.num(m.part_tunai_realisasi);
    const bu  = this.num(m.biaya_usaha);

    const asPlusPt = as + pt;

    // const middle = as - (js + pb); // dokumentasi
    const serviceCabangRealisasi = as; // sesuai bentuk rumus

    const jsT = this.num(m.jasa_service_target);
    const asT = this.num(m.after_sales_target);
    const pbT = this.num(m.part_bengkel_target);
    const ptT = this.num(m.part_tunai_target);

    const asPlusPtT = asT + ptT;
    const serviceCabangTarget = asT;

    const profitRealisasi =
      js +
      0.2 * (as - (js + pb)) +
      0.17 * pb +
      0.17 * pt -
      bu;

    const gantiOliRealisasi = serviceCabangRealisasi - js - pb;
    const gantiOliTarget    = serviceCabangTarget    - jsT - pbT;

    return {
      afterSalesPlusPartTunaiRealisasi: asPlusPt,
      afterSalesPlusPartTunaiTarget: asPlusPtT,
      serviceCabangRealisasi,
      serviceCabangTarget,
      profitRealisasi,
      gantiOliRealisasi,
      gantiOliTarget,
    };
  }

  private enrichMetrics(m: RawAfterSalesMetrics): RawAfterSalesMetrics {
    if (!m) return m;
    const d = this.computeDerived(m);
    return {
      ...m,
      after_sales_plus_part_tunai_realisasi: d.afterSalesPlusPartTunaiRealisasi,
      after_sales_plus_part_tunai_target:    d.afterSalesPlusPartTunaiTarget,
      service_cabang_realisasi:              d.serviceCabangRealisasi,
      service_cabang_target:                 d.serviceCabangTarget,
      profit_realisasi:                      d.profitRealisasi,
      ganti_oli_realisasi:                   d.gantiOliRealisasi,
      ganti_oli_target:                      d.gantiOliTarget,
    };
  }

  private enrichBlock(block?: RawComparisonBlock | null): RawComparisonBlock | undefined {
    if (!block) return block ?? undefined;
    return { ...block, metrics: this.enrichMetrics(block.metrics) };
  }

  private enrichResponseWithComputed(res: RawAfterSalesResponse): RawAfterSalesResponse {
    if (!res?.data?.kpi_data?.selected) return res;
    const kp = res.data.kpi_data;
    const comps = kp.comparisons;
    return {
      ...res,
      data: {
        ...res.data,
        kpi_data: {
          ...kp,
          selected: this.enrichMetrics(kp.selected),
          comparisons: comps
            ? {
                prevDate: this.enrichBlock(comps.prevDate),
                prevMonth: this.enrichBlock(comps.prevMonth),
                prevYear: this.enrichBlock(comps.prevYear),
              }
            : undefined,
        },
      },
    };
  }

  /* ===========================
     Period formatting (UI)
  =========================== */
  private toUiAfterSalesResponse(raw: RawAfterSalesResponse, useCustomDate: boolean): UiAfterSalesResponse {
    const fmt = (p: string | null | undefined) => formatPeriodByMode(p ?? null, useCustomDate);

    const comps = raw?.data?.kpi_data?.comparisons;
    const uiComps = comps ? {
      prevDate: comps.prevDate ? {
        period: fmt(comps.prevDate.period),
        metrics: comps.prevDate.metrics,
      } : undefined,
      prevMonth: comps.prevMonth ? {
        period: fmt(comps.prevMonth.period),
        metrics: comps.prevMonth.metrics,
      } : undefined,
      prevYear: comps.prevYear ? {
        period: fmt(comps.prevYear.period),
        metrics: comps.prevYear.metrics,
      } : undefined,
    } : undefined;

    const itemsRaw = raw?.data?.proporsi_after_sales?.data?.items ?? [];
    const uiItems: UiProporsiItem[] = itemsRaw.map(it => ([
      it.name,
      { period: fmt(it.selected?.period ?? null), value: Number(it.selected?.value ?? 0) },
      it.prevDate ? { period: fmt(it.prevDate.period), value: Number(it.prevDate.value ?? 0) } : undefined,
      it.prevMonth ? { period: fmt(it.prevMonth.period), value: Number(it.prevMonth.value ?? 0) } : undefined,
    ])).map(([name, selected, prevDate, prevMonth]) => ({
      name: name as string,
      selected: selected as UiProporsiPoint,
      prevDate: prevDate as UiProporsiPoint | undefined,
      prevMonth: prevMonth as UiProporsiPoint | undefined,
    }));

    return {
      status: String(raw?.status ?? ''),
      message: String(raw?.message ?? ''),
      data: {
        request: raw?.data?.request,
        kpi_data: {
          selected: raw?.data?.kpi_data?.selected,
          comparisons: uiComps,
        },
        proporsi_after_sales: itemsRaw.length
          ? { data: { items: uiItems } }
          : undefined,
      },
    };
  }
}
