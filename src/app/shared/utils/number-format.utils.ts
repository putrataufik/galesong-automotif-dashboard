// utils/number-format.ts
export type CompactUnit = 'K' | 'M' | 'B' | 'T';

export interface CompactCurrencyOptions {
  locale?: string;            // default: 'id-ID'
  currency?: string;          // default: 'IDR'
  symbol?: string;            // default: 'Rp'
  spaceBetweenSymbol?: boolean; // default: true -> "Rp 10 M"
  compactFrom?: number;       // mulai compact dari nilai berapa, default: 1_000
  maxFractionDigits?: number; // maksimal digit desimal untuk compact, default: 1
  minFractionDigits?: number; // minimal digit desimal untuk compact, default: 0
  trimTrailingZeros?: boolean; // hilangkan .0, default: true
}

const UNITS: Array<{ value: number; unit: CompactUnit }> = [
  { value: 1e12, unit: 'T' },
  { value: 1e9,  unit: 'B' },
  { value: 1e6,  unit: 'M' },
  { value: 1e3,  unit: 'K' },
];

/**
 * Format angka rupiah menjadi compact string:
 *  - >= 1e12 -> T, >= 1e9 -> B, >= 1e6 -> M, >= 1e3 -> K
 *  - < 1e3 -> format currency penuh (Rp 12.345)
 *  - Negatif -> "-Rp 10 M"
 *  - Bisa diatur desimal & opsi lainnya via options
 */
export function formatCompactCurrency(
  value: number,
  locale: string = 'id-ID'
): string {
  if (value == null || !Number.isFinite(value)) return '—';

  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  // Unit
  let scaled = abs;
  let unit = '';
  if (abs >= 1e9) {
    scaled = abs / 1e9;
    unit = 'B';
  } else if (abs >= 1e6) {
    scaled = abs / 1e6;
    unit = 'M';
  } else if (abs >= 1e3) {
    scaled = abs / 1e3;
    unit = 'K';
  }

  // Format dengan maksimal 2 digit desimal
  let num = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(scaled);

  // Hapus .00 atau ,00 atau nol di belakang
  num = num.replace(/([.,]\d*?)0+$/, '$1'); // 2,10 -> 2,1 ; 2,00 -> 2
  num = num.replace(/([.,])$/, '');         // hapus koma/titik di akhir

  return `${sign}Rp ${num}${unit ? ' ' + unit : ''}`;
}
