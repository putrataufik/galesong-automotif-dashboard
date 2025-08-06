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

// ----- Item pembungkus dataset per company/branch/category -----
// Jadikan generik agar 'data' selalu tepat tipe untuk handler terkait.
export interface ChartDataItem<TData> {
  company: string;
  branch?: string;
  category?: string;
  data: TData[];
}