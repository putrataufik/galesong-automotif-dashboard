// src/app/shared/utils/dashboard-chart.utils.ts

import { AfterSalesItem } from '../../types/aftersales.model';
import { ChartData } from '../../types/sales.model';
import { num, sumBy } from './dashboard-aftersales-kpi.utils';

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

export function getMonthLabel(monthNumber: string): string {
  const monthIndex = Math.max(1, Math.min(12, Number(monthNumber))) - 1;
  return MONTH_LABELS[monthIndex];
}

export function processLineChartData(monthlyData: any): ChartData | null {
  const sales = monthlyData?.sales ?? [];
  if (!sales.length) return null;

  const sortedMonths = [...sales].sort(
    (a, b) => Number(a.month) - Number(b.month)
  );

  const labels = sortedMonths.map((month) => getMonthLabel(month.month));
  const data = sortedMonths.map((month) => Number(month.unit_sold));

  return { labels, data };
}

export function processBarChartData(
  branchData: any,
  cabangMap: Record<string, string>
): ChartData | null {
  const sales = branchData?.sales ?? [];
  if (!sales.length) return null;

  return {
    labels: sales.map(
      (branch: any) => cabangMap[branch.branch] || branch.branch
    ),
    data: sales.map((branch: any) => Number(branch.unit_sold)),
  };
}

export function processPieChartData(
  unitsData: any,
  limit = 8
): ChartData | null {
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

// === AFTER SALES CHART PROCESSING ===
export function processAfterSalesRealisasiVsTargetData(
  afterSalesData: any
): ChartData | null {
  const aftersales = afterSalesData?.aftersales ?? [];

  if (!aftersales.length) return null;

  // Group by month dan sum realisasi + target
  const monthlyData = aftersales.reduce((acc: any, item: any) => {
    const month = item.month;
    if (!acc[month]) {
      acc[month] = {
        realisasi: 0,
        target: 0,
      };
    }
    acc[month].realisasi += Number(item.total_revenue_realisasi);
    acc[month].target += Number(item.total_revenue_target);
    return acc;
  }, {});

  // Sort by month dan convert ke format chart
  const sortedMonths = Object.keys(monthlyData).sort(
    (a, b) => Number(a) - Number(b)
  );

  const chartLabels = sortedMonths.map((month) => getMonthLabel(month));
  const realisasiData = sortedMonths.map(
    (month) => monthlyData[month].realisasi
  );
  const targetData = sortedMonths.map((month) => monthlyData[month].target);

  const result = {
    labels: chartLabels,
    data: realisasiData,
    targetData: targetData,
    datasets: [
      {
        label: 'Realisasi',
        data: realisasiData,
        backgroundColor: '#28a745',
        borderColor: '#28a745',
        borderWidth: 1,
      },
      {
        label: 'Target',
        data: targetData,
        backgroundColor: '#ffc107',
        borderColor: '#ffc107',
        borderWidth: 1,
      },
    ],
  };

  return result;
}

export function processAfterSalesProfitByBranchData(
  afterSalesData: any,
  cabangMap: Record<string, string>
): ChartData | null {
  const aftersales = afterSalesData?.aftersales ?? [];
  if (!aftersales.length) return null;

  // helper angka aman (boleh ganti ke util num() milikmu)
  const toNum = (v: unknown): number => {
    if (v == null) return 0;
    if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
    if (typeof v === 'string') {
      const n = Number(v.replace(/[^\d.-]/g, ''));
      return Number.isFinite(n) ? n : 0;
    }
    return 0;
  };

  // Akumulasi profit per cabang (sum dari profit tiap row)
  const branchData: Record<string, number> = aftersales.reduce(
    (acc: Record<string, number>, item: any) => {
      const cabangId = String(item?.cabang_id ?? 'unknown');

      const jasaService = toNum(item?.jasa_service_realisasi);
      const afterSales = toNum(item?.after_sales_realisasi);
      const partBengkel = toNum(item?.part_bengkel_realisasi);
      const partTunai = toNum(item?.part_tunai_realisasi);
      const biayaUsaha = toNum(item?.biaya_usaha);

      // Rumus profit (per baris)
      const profit =
        jasaService +
        0.2 * (afterSales - (jasaService + partBengkel)) +
        0.17 * partBengkel +
        0.17 * partTunai -
        biayaUsaha;

      acc[cabangId] = (acc[cabangId] ?? 0) + profit;
      return acc;
    },
    {}
  );

  // Urutkan desc berdasarkan profit
  const sortedBranches = Object.entries(branchData).sort(
    ([, a], [, b]) => b - a
  );

  return {
    labels: sortedBranches.map(([cabangId]) => cabangMap[cabangId] || cabangId),
    data: sortedBranches.map(([, profit]) => profit),
  };
}

// === AFTER SALES CHART PROCESSING ===
export function processAfterSalesTotalRevenueData(
  afterSalesData: any
): ChartData | null {
  const aftersales = afterSalesData?.aftersales ?? [];

  if (!aftersales.length) return null;

  // Group by month dan sum total_revenue_realisasi (IGNORE filter bulan)
  const monthlyRevenue = aftersales.reduce((acc: any, item: any) => {
    const month = item.month;

    if (!acc[month]) {
      acc[month] = 0;
    }
    acc[month] += Number(item.total_revenue_realisasi);
    return acc;
  }, {});

  // Sort by month dan convert ke format chart
  const sortedMonths = Object.keys(monthlyRevenue).sort(
    (a, b) => Number(a) - Number(b)
  );

  const chartLabels = sortedMonths.map((month) => getMonthLabel(month));
  const revenueData = sortedMonths.map((month) => monthlyRevenue[month]);

  return {
    labels: chartLabels,
    data: revenueData,
  };
}

export function processAfterSalesDistribution(
  afterSalesData: any
): ChartData | null {
  const rows: AfterSalesItem[] = (afterSalesData?.aftersales ?? []) as AfterSalesItem[];
  if (!rows.length) return null;

  const jasaService = sumBy(rows, (r) => num(r.jasa_service_realisasi));
  const sparepartTunai = sumBy(rows, (r) => num(r.part_tunai_realisasi));
  const sparepartBengkel = sumBy(rows, (r) => num(r.part_bengkel_realisasi));
  const totalAfterSales = sumBy(rows, (r) => num(r.after_sales_realisasi));

  // Oli sebagai residual agar total komponen = total after_sales
  let oli = totalAfterSales - (jasaService + sparepartBengkel);
  if (!Number.isFinite(oli)) oli = 0;
  if (oli < 0) oli = 0; // guard inkonsistensi

  return {
    labels: ['Jasa Service', 'Part Tunai', 'Part Bengkel', 'Oli'],
    data: [jasaService, sparepartTunai, sparepartBengkel, oli],
  };
}
