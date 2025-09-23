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
): string {
  const num = Number(value ?? 0);
  if (!isFinite(num)) return '0';

  const sign = num < 0 ? '-' : '';
  const abs = Math.abs(num);

  if (abs >= 1_000_000_000_000) {
    return `${sign}${(abs / 1_000_000_000_000).toLocaleString('id-ID', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} T`;
  }
  if (abs >= 1_000_000_000) {
    return `${sign}${(abs / 1_000_000_000).toLocaleString('id-ID', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    })} M`;
  }
  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toLocaleString('id-ID', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} Jt`;
  }

  return `${sign}${abs.toLocaleString('id-ID', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}`;
}
