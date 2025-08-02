// ===== ENUMS =====
export enum LoadingState {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error'
}

// ===== FILTER INTERFACES =====
export interface FilterParams {
  readonly companyId: string;
  readonly branchId: string | null;
  readonly category: string;
  readonly year: number;
}

export interface FilterOption {
  readonly id: string;
  readonly name: string;
}

// ===== KPI INTERFACES =====
export interface KpiCardData {
  readonly id: string;
  readonly title: string;
  readonly value: string;
  readonly unit?: string;
  readonly subtitle?: string;
  readonly icon?: string;
  readonly iconColor?: string;
  readonly valueColor?: string;
}

export interface SalesMetrics {
  readonly totalUnitsSold: number;
  readonly salesRevenue: number;
}

export interface AfterSalesMetrics {
  readonly totalTransactions: number;
  readonly afterSalesRevenue: number;
}

export interface FinancialMetrics {
  readonly totalRevenue: number;
  readonly totalExpenditure: number;
  readonly netProfitLoss: number;
}

export interface PerformanceMetrics {
  readonly topPerformingBranch: {
    readonly branchId: string;
    readonly branchName: string;
    readonly revenue: number;
  };
}

export interface FilterInfo {
  readonly companyId: string;
  readonly companyName: string;
  readonly branchId: string | null;
  readonly branchName: string;
  readonly category: string;
  readonly year: number;
}

export interface DashboardKpi {
  readonly salesMetrics: SalesMetrics;
  readonly afterSalesMetrics: AfterSalesMetrics;
  readonly financialMetrics: FinancialMetrics;
  readonly performanceMetrics: PerformanceMetrics;
}

export interface DashboardData {
  readonly filterInfo: FilterInfo;
  readonly kpi: DashboardKpi;
}

export interface ApiResponse<T> {
  readonly status: string;
  readonly message: string;
  readonly data: T;
}

export type DashboardApiResponse = ApiResponse<DashboardData>;

// ===== CACHE INTERFACE =====
export interface CacheEntry<T> {
  readonly data: T;
  readonly timestamp: number;
  readonly expiresAt: number;
}

export interface CacheStatus {
  readonly hasData: boolean;
  readonly lastFetch: string | null;
  readonly isValid: boolean;
  readonly expiresIn: string | null;
}