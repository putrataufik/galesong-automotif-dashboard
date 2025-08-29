// src/app/shared/utils/salesUtils.ts

export function monthNameToNumber(raw: any): number | null {
  if (raw == null) return null;
  const s = String(raw).trim().toLowerCase();
  const num = Number(s);
  if (Number.isFinite(num) && num >= 1 && num <= 12) return num;
  if (s === 'all' || s === 'all-month' || s === 'semua' || s === '') return null;

  const map: Record<string, number> = {
    jan: 1, january: 1, januari: 1,
    feb: 2, february: 2, februari: 2,
    mar: 3, march: 3, maret: 3,
    apr: 4, april: 4,
    mei: 5, may: 5,
    jun: 6, june: 6, juni: 6,
    jul: 7, july: 7, juli: 7,
    agu: 8, agustus: 8, aug: 8, august: 8,
    sep: 9, september: 9,
    okt: 10, october: 10, oktober: 10,
    nov: 11, november: 11,
    des: 12, december: 12, desember: 12,
  };
  return map[s] ?? null;
}

export function stringifyUnit(
  v: number | null | undefined,
  unit = 'unit'
): string | undefined {
  return v == null ? undefined : `${v} ${unit}`;
}

export function getSeriesCurrent(
  period: { year: number; month?: number } | null,
  series?: Record<string, number> | null
): number | null {
  if (!series || !period) return null;
  if (period.month) {
    const mm = period.month < 10 ? `0${period.month}` : String(period.month);
    return series[`${period.year}-${mm}`] ?? null;
  }
  return series[String(period.year)] ?? null;
}

export function getCurrentName(
  period: { year: number; month?: number } | null,
  nameSeries?: Record<string, string> | null
): string | null {
  if (!period || !nameSeries) return null;
  if (period.month) {
    const mm = period.month < 10 ? `0${period.month}` : String(period.month);
    return nameSeries[`${period.year}-${mm}`] ?? null;
  }
  return nameSeries[String(period.year)] ?? null;
}

export function buildPrevLabels(
  period: { year: number; month?: number } | null,
  unitsSeries?: Record<string, number> | null,
  nameSeries?: Record<string, string> | null
): { prevY?: string; prevM?: string } {
  if (!period || !unitsSeries) return {};

  const mm2 = (n: number) => (n < 10 ? `0${n}` : String(n));

  if (period.month) {
    const yoyKey = `${period.year - 1}-${mm2(period.month)}`;
    const pm =
      period.month === 1
        ? { y: period.year - 1, m: 12 }
        : { y: period.year, m: period.month - 1 };
    const momKey = `${pm.y}-${mm2(pm.m)}`;

    const yUnits = unitsSeries[yoyKey];
    const yName = nameSeries?.[yoyKey];
    const mUnits = unitsSeries[momKey];
    const mName = nameSeries?.[momKey];

    return {
      prevY: yUnits != null && yName ? `${yName}  (${yUnits})` : undefined,
      prevM: mUnits != null && mName ? `${mName}  (${mUnits})` : undefined,
    };
  } else {
    const yoyKey = String(period.year - 1);
    const yUnits = unitsSeries[yoyKey];
    const yName = nameSeries?.[yoyKey];
    return {
      prevY: yUnits != null && yName ? `${yName} – ${yUnits} unit` : undefined,
    };
  }
}
