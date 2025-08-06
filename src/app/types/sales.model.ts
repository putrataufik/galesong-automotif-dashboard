export interface SalesFilterInfo {
  year: string;
  category: 'SALES' | 'AFTER_SALES' | 'ALL';
  companyName: string;
}

export interface SalesMonthlyItem {
  month: string;      // "1".."12"
  unit_sold: string;  // angka string
}

export interface SalesUnitsItem {
  unit_code: string;  // kode internal
  unit_name: string;  // model (CRETA, STARGAZER, ...)
  unit_sold: string;
}

export interface SalesBranchItem {
  branch: string;     // kode cabang
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
