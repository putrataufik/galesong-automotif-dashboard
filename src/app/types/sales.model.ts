// src/app/types/sales.model.ts

import { FilterInfo } from "./filter.model";

// Interfaces
export interface ChartData {
  labels: string[];
  data: number[];
  targetData?: number[];
  datasets?: Array<{
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
    borderWidth?: number;
  }>;
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
  filterInfo: FilterInfo[];
  sales: SalesMonthlyItem[];
}

export interface SalesUnitsResponse {
  filterInfo: FilterInfo[];
  sales: SalesUnitsItem[];
}

export interface SalesBranchResponse {
  filterInfo: FilterInfo[];
  sales: SalesBranchItem[];
}
