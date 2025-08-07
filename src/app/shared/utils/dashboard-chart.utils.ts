// dashboard-chart.utils.ts

import { ChartData } from "../../types/sales.model";


const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

export function getMonthLabel(monthNumber: string): string {
  const monthIndex = Math.max(1, Math.min(12, Number(monthNumber))) - 1;
  return MONTH_LABELS[monthIndex];
}

export function processLineChartData(monthlyData: any): ChartData | null {
  const sales = monthlyData?.sales ?? [];
  if (!sales.length) return null;

  const sortedMonths = [...sales].sort((a, b) => Number(a.month) - Number(b.month));

  const labels = sortedMonths.map((month) => getMonthLabel(month.month));
  const data = sortedMonths.map((month) => Number(month.unit_sold));

  return { labels, data };
}

export function processBarChartData(branchData: any, cabangMap: Record<string, string>): ChartData | null {
  const sales = branchData?.sales ?? [];
  if (!sales.length) return null;

  return {
    labels: sales.map((branch: any) => cabangMap[branch.branch] || branch.branch),
    data: sales.map((branch: any) => Number(branch.unit_sold)),
  };
}

export function processPieChartData(unitsData: any, limit = 8): ChartData | null {
  const sales = unitsData?.sales ?? [];
  if (!sales.length) return null;

  const sortedSales = [...sales]
    .sort((a, b) => Number(b.unit_sold) - Number(a.unit_sold))
    .slice(0, limit);

  return {
    labels: sortedSales.map((unit: any) => unit.unit_name),
    data: sortedSales.map((unit: any) => Number(unit.unit_sold)),
  };
}
