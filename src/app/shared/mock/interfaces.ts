// src/app/shared/mock/interfaces.ts
export interface KpiCard {
  title: string;
  value: string | number;
  unit: string;
  icon: string;
  bgColor: string;
}

export interface MonthlyData {
  month: string;
  revenue: number;
  expense: number;
}

export interface MonthlyTargetData {
  month: string;
  target: number;
  realization: number;
}
export interface MonthlySalesData {
  month: string;
  salesOmzet: number;
  afterSalesOmzet: number;
}

export interface BranchPerformanceData {
  branchName: string;
  totalOmzet: number;
  rank: number;
}

export interface CompanyBranch {
  company: string;
  branches: string[];
}

export interface KpiDataItem {
  company: string;
  branch: string;
  category: string;
  kpis: {
    totalSales: number;
    totalAfterSales: number;
    totalPendapatan: number;
    totalPengeluaran: number;
    topSalesBranch: string;
    topAfterSalesBranch: string;
    totalOmzetSales: number;
    totalOmzetAfterSales: number;
  };
}

export interface ChartDataItem {
  company: string;
  branch: string;
  category: string;
  data: MonthlyData[] | MonthlyTargetData[] | MonthlySalesData[] | BranchPerformanceData[];
}