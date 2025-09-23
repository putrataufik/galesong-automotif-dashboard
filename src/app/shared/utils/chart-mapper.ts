// src/app/core/utils/chart-mapper.ts
export type LineDsInput = {
  label: string;
  data: number[];
  borderColor?: string;
  backgroundColor?: string | CanvasGradient;
  pointBackgroundColor?: string;
  pointBorderColor?: string;
  fill?: boolean;
  tension?: number;
  borderWidth?: number;
};

export function pad12(arr: number[] | null | undefined): number[] {
  const out = (arr ?? []).map((n) => Number(n ?? 0));
  while (out.length < 12) out.push(0);
  return out.slice(0, 12);
}

export function hexToRgba(hex: string, alpha = 0.15) {
  const m = hex.replace('#', '');
  const full = m.length === 3 ? m.split('').map((x) => x + x).join('') : m;
  const bigint = parseInt(full, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

export function mapToLineSeries(
  datasets: Array<{ label: string; data: number[] }>,
  colors: string[],
  opt?: { tension?: number; borderWidth?: number; fill?: boolean }
): LineDsInput[] {
  const tension = opt?.tension ?? 0.35;
  const borderWidth = opt?.borderWidth ?? 3;
  const fill = opt?.fill ?? false;

  return (datasets ?? []).map((d, i) => {
    const c = colors[i % colors.length];
    return {
      label: d.label,
      data: pad12(d.data),
      borderColor: c,
      backgroundColor: hexToRgba(c, 0.12),
      pointBackgroundColor: c,
      pointBorderColor: '#000000',
      tension,
      borderWidth,
      fill,
    };
  });
}
