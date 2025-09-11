// src/app/core/models/sales.models.ts

// ====== REQUEST MODELS ======
export interface SalesKpiRequest {
  companyId: string;
  branchId: string;
  useCustomDate: boolean;
  compare: boolean;
  year: string | "null";
  month: string | "null";
  selectedDate: string | "null";
}

// ====== KPI VALUE MODELS ======
export interface KpiValue {
  value: number;
  period: string;
}

export interface KpiModelValue {
  name: string;
  value: number;
  period: string;
}

export interface KpiBranchValue {
  code: string;
  value: number;
  period: string;
}

// ====== KPI METRIC MODELS ======
export interface KpiMetricBase<T> {
  selected: T;
  prevDate?: T;
  prevMonth?: T;
  prevYear?: T;
}

export interface TotalUnitSalesKpi extends KpiMetricBase<KpiValue> {}
export interface TotalSPKKpi extends KpiMetricBase<KpiValue> {}
export interface TotalDOKpi extends KpiMetricBase<KpiValue> {}
export interface TopModelKpi extends KpiMetricBase<KpiModelValue> {}
export interface TopBranchKpi extends KpiMetricBase<KpiBranchValue> {}

// ====== MAIN KPI RESPONSE MODEL ======
export interface SalesKpis {
  totalUnitSales: TotalUnitSalesKpi;
  totalSPK: TotalSPKKpi;
  totalDO: TotalDOKpi;
  topModel: TopModelKpi;
  topBranch: TopBranchKpi;
}

// ====== API RESPONSE MODEL ======
export interface SalesKpiResponse {
  status: string;
  message: string;
  data: {
    request: SalesKpiRequest;
    kpis: SalesKpis;
  };
}

// ====== STATE MANAGEMENT MODELS ======
export interface SalesFilter {
  companyId: string;
  branchId: string;
  useCustomDate: boolean;
  compare: boolean;
  year: string | null;
  month: string | null;
  selectedDate: string | null;
}

export interface SalesKpiSnapshot {
  request: SalesKpiRequest;
  kpis: SalesKpis;
  timestamp: number;
}

export interface SalesChartsState {
  // Placeholder untuk future chart data
  salesTrend: any | null;
  branchComparison: any | null;
  modelDistribution: any | null;
}

export interface SalesState {
  filter: SalesFilter | null;
  kpiData: SalesKpiSnapshot | null;
  charts: SalesChartsState;
  lastUpdated: number | null;
}

// ====== UTILITY TYPES ======
export type ComparisonPeriod = 'prevDate' | 'prevMonth' | 'prevYear';
export type KpiMetricType = 'totalUnitSales' | 'totalSPK' | 'totalDO' | 'topModel' | 'topBranch';

// ====== HELPER INTERFACES ======
export interface KpiComparison {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  period: string;
  previousPeriod: string;
}

export interface ModelComparison {
  current: { name: string; value: number };
  previous: { name: string; value: number };
  period: string;
  previousPeriod: string;
}

export interface BranchComparison {
  current: { code: string; value: number };
  previous: { code: string; value: number };
  period: string;
  previousPeriod: string;
}

// ====== DEFAULT VALUES ======
export const defaultSalesFilter: SalesFilter = {
  companyId: 'sinar-galesong-mobilindo',
  branchId: 'all-branch',
  useCustomDate: false,
  compare: true,
  year: new Date().getFullYear().toString(),
  month: (new Date().getMonth() + 1).toString(),
  selectedDate: null
};

export const initialSalesChartsState: SalesChartsState = {
  salesTrend: null,
  branchComparison: null,
  modelDistribution: null
};

export const initialSalesState: SalesState = {
  filter: null,
  kpiData: null,
  charts: initialSalesChartsState,
  lastUpdated: null
};