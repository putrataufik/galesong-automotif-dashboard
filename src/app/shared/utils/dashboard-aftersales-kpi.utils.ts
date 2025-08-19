// src/app/shared/utils/dashboard-aftersales-kpi.utils.ts
import { after } from 'node:test';
import { AfterSalesItem, KpiResult } from '../../types/aftersales.model';

/* =========================================================
 *  NUMBERS & AGGREGATION (DRY)
 * =======================================================*/
export function toNumberSafe(v: unknown): number {
  if (v == null) return 0;
  const n = Number(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export function sumBy<T>(rows: T[], pick: (x: T) => unknown): number {
  return rows.reduce((acc, x) => acc + toNumberSafe(pick(x)), 0);
}

const num = (v: unknown): number => {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    // hapus pemisah ribuan/kode mata uang jika ada
    const cleaned = v.replace(/[^\d.-]/g, '');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  }
  const n = Number(v as any);
  return Number.isFinite(n) ? n : 0;
};

/* =========================================================
 *  DATE & CALENDAR HELPERS
 * =======================================================*/
export const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
] as const;

/** Normalisasi bulan apa pun (string/number) ke rentang 1..12 */
export function normalizeMonth(m: string | number): number {
  const n = Number(m);
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(12, Math.trunc(n)));
}

export function daysInMonth(year: number, month1to12: number): number {
  return new Date(year, month1to12, 0).getDate();
}

export function getMonthLabel(m: string | number): string {
  const idx = normalizeMonth(m) - 1;
  return MONTH_LABELS[idx] ?? '';
}

/** Cek apakah (month, year) sama dengan bulan & tahun saat ini */
export function isSameMonthYear(
  month1to12: number | string | null | undefined,
  year: number | string | null | undefined,
  now = new Date()
): boolean {
  if (month1to12 == null || year == null) return false;
  const m = normalizeMonth(month1to12);
  const y = Number(year);
  if (!Number.isFinite(y)) return false;
  return now.getMonth() + 1 === m && now.getFullYear() === y;
}

/**
 * Estimasi sisa hari kerja dari 'today' sampai akhir bulan.
 * - Jika totalWorkdaysInMonth tersedia => gunakan proporsi hari kalender.
 * - Jika tidak => fallback ke sisa hari kalender.
 */
export function estimateRemainingWorkdays(
  year: number,
  month1to12: number,
  today: Date,
  totalWorkdaysInMonth?: number
): number {
  if (!Number.isFinite(year) || !Number.isFinite(month1to12)) return 0;

  const dim = daysInMonth(year, month1to12);
  const isCurrent = today.getFullYear() === year && today.getMonth() + 1 === month1to12;
  const startDay = isCurrent ? today.getDate() : 1;

  const calendarRemaining = Math.max(0, dim - startDay);

  if (totalWorkdaysInMonth && totalWorkdaysInMonth > 0) {
    const est = Math.round((calendarRemaining / dim) * totalWorkdaysInMonth);
    return Math.max(0, Math.min(totalWorkdaysInMonth, est));
  }
  return calendarRemaining;
}

/* =========================================================
 *  OPTIONS / DROPDOWNS
 * =======================================================*/
export interface Option { value: string; name: string; }

export function buildDescendingDayOptions(n: number): Option[] {
  const max = Math.max(0, Math.floor(n));
  return Array.from({ length: max }, (_, i) => {
    const val = String(max - i);
    return { value: val, name: `${val} hari tersisa` };
  });
}

/* =========================================================
 *  FILTER & KPI PROCESSING (AFTERSALES)
 * =======================================================*/
export interface AfterSalesFilterLike {
  month?: string;   // 'all-month' | '1'..'12'
  cabang?: string;  // 'all-cabang' | id cabang
}

/** Filter baris aftersales berdasarkan bulan & cabang */
export function filterAftersales(
  rows: AfterSalesItem[],
  filter: AfterSalesFilterLike
): AfterSalesItem[] {
  let out = [...(rows || [])];

  if (filter.month && filter.month !== 'all-month') {
    const m = String(normalizeMonth(filter.month));
    out = out.filter((r) => String(r.month) === m);
  }
  if (filter.cabang && filter.cabang !== 'all-cabang') {
    out = out.filter((r) => r.cabang_id === filter.cabang);
  }
  return out;
}

/**
 * Kumpulan KPI utama versi ringkas (dipakai di dashboard utama).
 * Gunakan ini kalau ingin angka agregat "total" across cabang/bulan terpilih.
 */
export interface AfterSalesKpiData {
  totalRevenueRealisasi: number;
  totalBiayaUsaha: number;
  totalProfit: number;
  totalHariKerja: number;
  serviceCabang: number;
  afterSalesRealisasi: number;
  unitEntryRealisasi: number;
  sparepartTunaiRealisasi: number;
}

/** Hitung KPI After Sales agregat (versi dashboard utama) */
export function calculateAfterSalesKpi(aftersales: AfterSalesItem[]): AfterSalesKpiData {
  if (!aftersales?.length) {
    return {
      totalRevenueRealisasi: 0,
      totalBiayaUsaha: 0,
      totalProfit: 0,
      totalHariKerja: 0,
      serviceCabang: 0,
      afterSalesRealisasi: 0,
      unitEntryRealisasi: 0,
      sparepartTunaiRealisasi: 0,
    };
  }

  const totalRevenueRealisasi = sumBy(aftersales, x => x.total_revenue_realisasi);
  const totalBiayaUsaha = sumBy(aftersales, x => x.biaya_usaha);
  const totalProfit = sumBy(aftersales, x => x.profit);
  const afterSalesRealisasi = sumBy(aftersales, x => x.after_sales_realisasi);
  const sparepartTunaiRealisasi = sumBy(aftersales, x => x.part_tunai_realisasi);
  const unitEntryRealisasi = sumBy(aftersales, x => x.unit_entry_realisasi);
  const totalHariKerja = sumBy(aftersales, x => x.hari_kerja);
  const serviceCabang = sumBy(
    aftersales,
    x => (num(x.jasa_service_realisasi) + (num(x.after_sales_realisasi) - (num(x.jasa_service_realisasi) + num(x.part_bengkel_realisasi))) + num(x.part_bengkel_realisasi))
  );

  return {
    totalRevenueRealisasi,
    totalBiayaUsaha,
    totalProfit,
    totalHariKerja,
    serviceCabang,
    afterSalesRealisasi,
    unitEntryRealisasi,
    sparepartTunaiRealisasi,
  };
}

/**
 * Versi KPI yang dibutuhkan komponen AfterSales (struktur berbeda):
 * afterSales, serviceCabang, unitEntry, sparepartTunai (masing2: realisasi/target),
 * plus totalUnitEntry, profit.
 */

/** Bangun KpiResult dari baris aftersales yang SUDAH difilter */
export function buildKpiForComponent(rows: AfterSalesItem[]): KpiResult {
  const afterSales = {
    realisasi: sumBy(rows, r => num(r.after_sales_realisasi) + num(r.part_tunai_realisasi)),
    target: sumBy(rows, r => num(r.after_sales_target) + num(r.part_tunai_target)),
  };

  const profit = sumBy(rows, r => r.profit);

  const serviceCabang = {
    realisasi: sumBy(
      rows,
      (r) => (num(r.jasa_service_realisasi) + (num(r.after_sales_realisasi) - (num(r.jasa_service_realisasi) + num(r.part_bengkel_realisasi))) + num(r.part_bengkel_realisasi))
    ),
    target: sumBy(
      rows,
      (r) => (num(r.jasa_service_target) + (num(r.after_sales_target) - (num(r.jasa_service_target) + num(r.part_bengkel_target))) + num(r.part_bengkel_target))
    ),
  };


  const jasaService = {
    realisasi: sumBy(rows, r => r.jasa_service_realisasi),
    target: sumBy(rows, r => r.jasa_service_target),
  };

  const unitEntry = {
    realisasi: sumBy(rows, r => r.unit_entry_realisasi),
    target: sumBy(rows, r => r.unit_entry_target),
  };

  const sparepartTunai = {
    realisasi: sumBy(rows, r => r.part_tunai_realisasi),
    target: sumBy(rows, r => r.part_tunai_target),
  };

  const sparepartBengkel = {
    realisasi: sumBy(rows, r => r.part_bengkel_realisasi),
    target: sumBy(rows, r => r.part_bengkel_target)
  }

  const oli = {
    realisasi: sumBy(
      rows,
      (r) => num(r.after_sales_realisasi) - (num(r.jasa_service_realisasi) + num(r.part_bengkel_realisasi))
    ),
    target: sumBy(
      rows,
      (r) => num(r.after_sales_target) - (num(r.jasa_service_target) + num(r.part_bengkel_target)))
  }

  console.table(
    rows.map(r => ({
      cabang: r.cabang_id,
      afterSalesTarget: r.after_sales_target,
      jasaServiceTarget: r.jasa_service_target,
      partBengkelTarget: r.part_bengkel_target,
    }))
  )
  // CPUS SERVICE 
  const jasaServiceBerat = {
    realisasi: sumBy(rows, r => r.jasa_service_berat_realisasi),
    target: sumBy(rows, r => r.jasa_service_realisasi),
  }
  const jasaServiceBodyRepair = {
    realisasi: sumBy(rows, r => r.jasa_service_body_repair_realisasi),
    target: sumBy(rows, r => r.jasa_service_realisasi),
  }
  const jasaServiceClaim = {
    realisasi: sumBy(rows, r => r.jasa_service_claim_realisasi),
    target: sumBy(rows, r => r.jasa_service_realisasi),
  }
  const jasaServiceCvt = {
    realisasi: sumBy(rows, r => r.jasa_service_cvt_realisasi),
    target: sumBy(rows, r => r.jasa_service_realisasi),
  }
  const jasaServiceExpress = {
    realisasi: sumBy(rows, r => r.jasa_service_express_realisasi),
    target: sumBy(rows, r => r.jasa_service_realisasi),
  }
  const jasaServiceKelistrikan = {
    realisasi: sumBy(rows, r => r.jasa_service_kelistrikan_realisasi),
    target: sumBy(rows, r => r.jasa_service_realisasi),
  }
  const jasaServiceKupon = {
    realisasi: sumBy(rows, r => r.jasa_service_kupon_realisasi),
    target: sumBy(rows, r => r.jasa_service_realisasi),
  }
  const jasaServiceOli = {
    realisasi: sumBy(rows, r => r.jasa_service_oli_realisasi),
    target: sumBy(rows, r => r.jasa_service_realisasi),
  }
  const jasaServiceOverSize = {
    realisasi: sumBy(rows, r => r.jasa_service_over_size_realisasi),
    target: sumBy(rows, r => r.jasa_service_realisasi),
  }
  const jasaServiceOverhoul = {
    realisasi: sumBy(rows, r => r.jasa_service_overhoul_realisasi),
    target: sumBy(rows, r => r.jasa_service_realisasi),
  }
  const jasaServicePdc = {
    realisasi: sumBy(rows, r => r.jasa_service_pdc_realisasi),
    target: sumBy(rows, r => r.jasa_service_realisasi),
  }
  const jasaServiceRutin = {
    realisasi: sumBy(rows, r => r.jasa_service_rutin_realisasi),
    target: sumBy(rows, r => r.jasa_service_realisasi),
  }
  const jasaServiceSedang = {
    realisasi: sumBy(rows, r => r.jasa_service_sedang_realisasi),
    target: sumBy(rows, r => r.jasa_service_realisasi),
  }

  const partBengkelExpress = {
    realisasi: sumBy(rows, r => r.part_bengkel_express_realisasi),
    target: sumBy(rows, r => r.part_bengkel_target),
  }
  const partBengkelOli = {
    realisasi: sumBy(rows, r => r.part_bengkel_oli_realisasi),
    target: sumBy(rows, r => r.part_bengkel_target),
  }

  const partBengkelOverhoul = {
    realisasi: sumBy(rows, r => r.part_bengkel_overhoul_realisasi),
    target: sumBy(rows, r => r.part_bengkel_target),
  }

  const partBengkelRutin = {
    realisasi: sumBy(rows, r => r.part_bengkel_rutin_realisasi),
    target: sumBy(rows, r => r.part_bengkel_target),
  }

  const partBengkelSedang = {
    realisasi: sumBy(rows, r => r.part_bengkel_sedang_realisasi),
    target: sumBy(rows, r => r.part_bengkel_target),
  }

  const partBengkelBerat = {
    realisasi: sumBy(rows, r => r.part_bengkel_berat_realisasi),
    target: sumBy(rows, r => r.part_bengkel_target),
  }


  return {
    afterSales,
    serviceCabang,
    jasaService,
    unitEntry,
    sparepartTunai,
    sparepartBengkel,
    totalUnitEntry: toNumberSafe(unitEntry.realisasi),
    oli,
    profit: toNumberSafe(profit),

    jasaServiceBerat,
    jasaServiceBodyRepair,
    jasaServiceClaim,
    jasaServiceCvt,
    jasaServiceExpress,
    jasaServiceKelistrikan,
    jasaServiceKupon,
    jasaServiceOli,
    jasaServiceOverSize,
    jasaServiceOverhoul,
    jasaServicePdc,
    jasaServiceRutin,
    jasaServiceSedang,

    partBengkelExpress,
    partBengkelOli,
    partBengkelOverhoul,
    partBengkelRutin,
    partBengkelSedang,
    partBengkelBerat,
  };
}

/** Orkestrasi: filter → hitung KPI (untuk komponen AfterSales) */
export function processAftersalesToKpi(
  rows: AfterSalesItem[],
  filter: AfterSalesFilterLike
): KpiResult {
  const filtered = filterAftersales(rows, filter);
  console.log('🔍 Filtered After Sales Rows:', filtered);
  return buildKpiForComponent(filtered);
}

/* =========================================================
 *  FORMATTERS (kompatibel dengan yang sudah dipakai)
 * =======================================================*/
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value);
}

/**
 * Format singkat angka: 1.20 Juta, 3.50 M, dst (kompatibel dengan kode kamu)
 * @param value angka input
 * @param fractionDigits jumlah angka desimal (default: 2)
 */
export function formatCompactNumber(
  value: number | string | null | undefined,
  fractionDigits = 2
): string {
  const num = Number(value ?? 0);
  if (!isFinite(num)) return '0';

  const sign = num < 0 ? '-' : '';
  const abs = Math.abs(num);

  if (abs >= 1_000_000_000_000) {
    return `${sign}${(abs / 1_000_000_000_000).toLocaleString('id-ID', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    })} T`;
  }
  if (abs >= 1_000_000_000) {
    return `${sign}${(abs / 1_000_000_000).toLocaleString('id-ID', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    })} M`;
  }
  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toLocaleString('id-ID', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    })} Juta`;
  }

  return `${sign}${abs.toLocaleString('id-ID', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}`;
}
