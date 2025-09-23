// src/app/pages/after-sales-dashboard/after-sales.utils.ts


// Tipe opsi dropdown untuk Sisa Hari Kerja
export type SisaHariOption = { value: number; name: string };

/** Normalisasi month string → number (1..12) */
export function normalizeMonth(m?: string | number | null): number | null {
  if (m == null) return null;
  if (typeof m === 'number') return m >= 1 && m <= 12 ? m : null;
  if (m === 'all-month') return null;
  const n = parseInt(String(m), 10);
  return n >= 1 && n <= 12 ? n : null;
}

/** True jika (month, year) sama dengan bulan & tahun dari 'now' */
export function isSameMonthYear(
  monthNum: number | null,
  yearNum: number | null,
  now: Date
): boolean {
  if (monthNum == null || yearNum == null) return false;
  return yearNum === now.getFullYear() && monthNum === now.getMonth() + 1;
}

/** Tentukan (year, month) dari filter (dukung custom date) */
export function resolveFilterYearMonth(filter: {
  useCustomDate: boolean;
  selectedDate?: string | null;
  period?: string | number | null;
  month?: string | number | null;
}): { yearNum: number | null; monthNum: number | null } {
  if (filter.useCustomDate && filter.selectedDate) {
    const d = new Date(filter.selectedDate);
    return { yearNum: d.getFullYear(), monthNum: d.getMonth() + 1 };
  }
  const yearNum =
    filter.period != null ? parseInt(String(filter.period), 10) : null;
  const monthNum = normalizeMonth(filter.month ?? null);
  return { yearNum, monthNum };
}

/** Hitung sisa hari kerja (Mon–Fri). Jika totalHariKerja tersedia → gunakan sebagai plafon */
export function estimateRemainingWorkdays(
  year: number,
  month: number, // 1..12
  now: Date,
  totalHariKerja?: number
): number {
  const firstOfMonth = new Date(year, month - 1, 1);
  const lastOfMonth = new Date(year, month, 0);

  // Jika periode di masa depan penuh
  if (now < firstOfMonth) {
    const planned = countBusinessDaysInclusive(firstOfMonth, lastOfMonth);
    return totalHariKerja ? Math.min(planned, totalHariKerja) : planned;
  }

  // Jika sudah lewat
  if (now > lastOfMonth) return 0;

  // Hari kerja yang sudah terpakai (1..today)
  const used = countBusinessDaysInclusive(firstOfMonth, now);

  // Jika ada plafon total hari kerja dari backend
  if (totalHariKerja && totalHariKerja > 0) {
    return Math.max(0, Math.floor(totalHariKerja - used));
  }

  // Tanpa plafon → hitung sisa dari besok s/d akhir bulan
  const startRemain = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1
  );
  return countBusinessDaysInclusive(startRemain, lastOfMonth);
}

/** Hitung jumlah hari kerja (Mon–Fri) dari tanggal A s/d B (inklusif). */
export function countBusinessDaysInclusive(start: Date, end: Date): number {
  if (end < start) return 0;
  let d = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  let count = 0;
  while (d <= e) {
    const day = d.getDay(); // 0=Sun .. 6=Sat
    if (day !== 0 && day !== 6) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

/** Build opsi dropdown N..1 (mis. 7→[7,6,5,4,3,2,1]) */
export function buildDescendingDayOptions(n: number): SisaHariOption[] {
  const list: SisaHariOption[] = [];
  for (let i = n; i >= 1; i--) list.push({ value: i, name: `${i} Hari` });
  return list;
}

export function getBranchDisplayName(branch: string): string {
  const branchMap: Record<string, string> = {
    'all-branch': 'Semua Cabang',
    '0001': 'Pettarani',
    '0002': 'Gorontalo',
    '0003': 'Kendari',
    '0004': 'Palu',
    '0005': 'Palopo',
    '0006': 'Sungguminasa',
  };
  return branchMap[branch] || branch;
}
