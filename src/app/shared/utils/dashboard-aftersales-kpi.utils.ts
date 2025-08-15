// src/app/shared/utils/dashboard-aftersales-kpi.utils.ts
import { AfterSalesItem } from '../../types/aftersales.model';

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

  const totalRevenueRealisasi   = sumBy(aftersales, x => x.total_revenue_realisasi);
  const totalBiayaUsaha         = sumBy(aftersales, x => x.biaya_usaha);
  const totalProfit             = sumBy(aftersales, x => x.profit);
  const afterSalesRealisasi     = sumBy(aftersales, x => x.after_sales_realisasi);
  const sparepartTunaiRealisasi = sumBy(aftersales, x => x.part_tunai_realisasi);
  const unitEntryRealisasi      = sumBy(aftersales, x => x.unit_entry_realisasi);
  const totalHariKerja          = sumBy(aftersales, x => x.hari_kerja);

  // Service Cabang = After Sales - Sparepart Tunai
  const serviceCabang = toNumberSafe(afterSalesRealisasi) - toNumberSafe(sparepartTunaiRealisasi);

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
export interface KpiGroup { realisasi: number; target: number; }
export interface KpiResult {
  afterSales: KpiGroup;
  serviceCabang: KpiGroup;
  unitEntry: KpiGroup;
  sparepartTunai: KpiGroup;
  totalUnitEntry: number;
  profit: number;
}

/** Bangun KpiResult dari baris aftersales yang SUDAH difilter */
export function buildKpiForComponent(rows: AfterSalesItem[]): KpiResult {
  const afterSales = {
    realisasi: sumBy(rows, r => r.total_revenue_realisasi),
    target:    sumBy(rows, r => r.total_revenue_target),
  };

  const profit = sumBy(rows, r => r.profit);

  const serviceCabang = {
    realisasi: sumBy(rows, r => r.after_sales_realisasi),
    target:    sumBy(rows, r => r.after_sales_target),
  };

  const unitEntry = {
    realisasi: sumBy(rows, r => r.unit_entry_realisasi),
    target:    sumBy(rows, r => r.unit_entry_target),
  };

  const sparepartTunai = {
    realisasi: sumBy(rows, r => r.part_tunai_realisasi),
    target:    sumBy(rows, r => r.part_tunai_target),
  };

  return {
    afterSales,
    serviceCabang,
    unitEntry,
    sparepartTunai,
    totalUnitEntry: toNumberSafe(unitEntry.realisasi),
    profit: toNumberSafe(profit),
  };
}

/** Orkestrasi: filter → hitung KPI (untuk komponen AfterSales) */
export function processAftersalesToKpi(
  rows: AfterSalesItem[],
  filter: AfterSalesFilterLike
): KpiResult {
  const filtered = filterAftersales(rows, filter);
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
