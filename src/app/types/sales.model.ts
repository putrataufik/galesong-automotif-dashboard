export interface SalesFilterInfo {
  year: string;
  category: 'SALES' | 'AFTER_SALES' | 'ALL';
  companyName: string;
}
// Interfaces
export interface ChartData {
  labels: string[];
  data: number[];
}

export interface SalesMonthlyItem {
  month: string;
  unit_sold: string;
}

export interface SalesUnitsItem {
  unit_code: string;
  unit_name: string;
  unit_sold: string;
}

export interface SalesBranchItem {
  branch: string; // kode cabang
  unit_sold: string;
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  message: string;
  data: T;
}

export interface SalesMonthlyResponse {
  filterInfo: SalesFilterInfo;
  sales: SalesMonthlyItem[];
}

export interface SalesUnitsResponse {
  filterInfo: SalesFilterInfo;
  sales: SalesUnitsItem[];
}

export interface SalesBranchResponse {
  filterInfo: SalesFilterInfo;
  sales: SalesBranchItem[];
}
