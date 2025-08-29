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

// BARU
type Period = string; // "YYYY-MM" (monthly) atau "YYYY" (yearly)

interface RequestEcho {
  companyId: string;
  year: number;
  month?: string;        // "01".."12" | "all-month" | undefined
  branchId?: string;     // "all-branch" | "0050" | dst.
  modelId?: string;
}

interface Labels {
  selected: string;        // "Agu 2025" | "2025"
  selectedYear: number;    // 2025
  prevYear: string;        // "Agu 2024" | "2024"
  prevMonth: string | null;// "Jul 2025" | null (yearly)
}

interface NumberPoint { value: number; period: Period; }
interface NumberKpi {
  selected:  NumberPoint;
  prevYear:  NumberPoint | null;
  prevMonth: NumberPoint | null;
}

// 🔁 Perubahan di sini: value (bukan units)
interface ModelPoint { name: string; value: number; period: Period; }

// 🔁 Perubahan di sini: code = kode cabang (mis. "0050"), value (bukan units)
interface BranchPoint { code: string; value: number; period: Period; }

interface ModelKpi {
  selected:  ModelPoint | null;
  prevYear:  ModelPoint | null;
  prevMonth: ModelPoint | null;
}

interface BranchKpi {
  selected:  BranchPoint | null;
  prevYear:  BranchPoint | null;
  prevMonth: BranchPoint | null;
}

interface SalesKpisResponse {
  request: RequestEcho;
  labels: Labels;
  kpis: {
    totalUnitSales: NumberKpi;
    totalSPK:       NumberKpi;
    totalRevenue:   NumberKpi;
    totalDO:        NumberKpi;
    topModel:       ModelKpi;   // { name, value, period }
    topBranch:      BranchKpi;  // { code, value, period }  ← code = "0050"
  };
}

