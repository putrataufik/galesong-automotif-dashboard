// src/app/shared/utils/dashboard-chart.utils.ts

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

// === AFTER SALES CHART PROCESSING ===
export function processAfterSalesRealisasiVsTargetData(afterSalesData: any): ChartData | null {
  const aftersales = afterSalesData?.aftersales ?? [];
  
  if (!aftersales.length) return null;

  // Group by month dan sum realisasi + target
  const monthlyData = aftersales.reduce((acc: any, item: any) => {
    const month = item.month;
    
    if (!acc[month]) {
      acc[month] = {
        realisasi: 0,
        target: 0
      };
    }
    acc[month].realisasi += Number(item.after_sales_realisasi);
    acc[month].target += Number(item.after_sales_target);
    return acc;
  }, {});

  // Sort by month dan convert ke format chart
  const sortedMonths = Object.keys(monthlyData).sort((a, b) => Number(a) - Number(b));

  const chartLabels = sortedMonths.map(month => getMonthLabel(month));
  const realisasiData = sortedMonths.map(month => monthlyData[month].realisasi);
  const targetData = sortedMonths.map(month => monthlyData[month].target);

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
        borderWidth: 1
      },
      {
        label: 'Target', 
        data: targetData,
        backgroundColor: '#ffc107',
        borderColor: '#ffc107', 
        borderWidth: 1
      }
    ]
  };

  console.log('Final chart result:', result);
  console.log('=== END DEBUG ===');
  
  return result;
}

export function processAfterSalesProfitByBranchData(
  afterSalesData: any, 
  cabangMap: Record<string, string>
): ChartData | null {
  const aftersales = afterSalesData?.aftersales ?? [];
  if (!aftersales.length) return null;

  // Group by cabang dan sum profit
  const branchData = aftersales.reduce((acc: any, item: any) => {
    const cabangId = item.cabang_id;
    if (!acc[cabangId]) {
      acc[cabangId] = 0;
    }
    acc[cabangId] += Number(item.profit);
    return acc;
  }, {});

  // Sort by profit descending
  const sortedBranches = Object.entries(branchData)
    .sort(([,a], [,b]) => (b as number) - (a as number));

  return {
    labels: sortedBranches.map(([cabangId]) => cabangMap[cabangId] || cabangId),
    data: sortedBranches.map(([, profit]) => profit as number)
  };
}
