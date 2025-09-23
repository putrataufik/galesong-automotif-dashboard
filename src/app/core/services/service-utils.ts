// src/app/core/services/service-utils.ts
// Util bersama untuk Sales & After-Sales (BULAN = UPPER semua mode)

/** Nama bulan 3 huruf (ID, uppercase) */
export const MON3_UPPER = ['JAN','FEB','MAR','APR','MEI','JUN','JUL','AGU','SEP','OKT','NOV','DES'] as const;

/** "2025-09" -> "2025 SEP" (UPPER) */
export function formatPeriodMonthYear(period: string): string {
  if (!period || period.length < 7) return period ?? '';
  const y = period.slice(0, 4);
  const m = Number(period.slice(5, 7));
  const mon = (m >= 1 && m <= 12) ? MON3_UPPER[m - 1] : period.slice(5, 7);
  return `${y} ${mon}`;
}

/** "2025-09-08" -> "8 SEP 2025" (UPPER) */
export function formatPeriodCustomDate(period: string): string {
  if (!period || period.length < 10) return period ?? '';
  const y = period.slice(0, 4);
  const m = Number(period.slice(5, 7));
  const d = Number(period.slice(8, 10));
  const mon = (m >= 1 && m <= 12) ? MON3_UPPER[m - 1] : period.slice(5, 7);
  return `${d} ${mon} ${y}`;
}

/** Pilih formatter berdasarkan mode; keduanya UPPER */
export function formatPeriodByMode(
  period: string | null | undefined,
  useCustomDate: boolean
): string | null {
  if (!period) return period ?? null;
  return useCustomDate ? formatPeriodCustomDate(period) : formatPeriodMonthYear(period);
}

/** Validator YYYY-MM-DD */
export function validateDateFormatYYYYMMDD(date: string): boolean {
  const rx = /^\d{4}-\d{2}-\d{2}$/;
  return rx.test(date) && !isNaN(new Date(date).getTime());
}

/** Cek future (local midnight) */
export function isDateInFutureLocal(date: string): boolean {
  const m = date?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return false;
  const y = Number(m[1]); const mo = Number(m[2]) - 1; const d = Number(m[3]);
  const input = new Date(y, mo, d); input.setHours(0,0,0,0);
  const today = new Date();         today.setHours(0,0,0,0);
  return input.getTime() > today.getTime();
}

/** Konversi aman ke number */
export function toNumberSafe(v: unknown): number {
  return typeof v === 'number' && isFinite(v) ? v : Number(v ?? 0) || 0;
}

/** Map kode→nama cabang */
export function branchNameFromMap(map: Record<string,string>, code?: string): string {
  if (!code) return '';
  return map[code] ?? code;
}


