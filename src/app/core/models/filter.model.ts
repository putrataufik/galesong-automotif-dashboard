// ===== FILTER INTERFACES =====

export interface FilterOption {
  readonly id: string | null;
  readonly name: string;
}

export interface DashboardFilter {
  readonly companyId: string;
  readonly branchId: string | null;
  readonly category: string;
  readonly year: number;
}

export interface FilterState {
  readonly selectedCompany: string;
  readonly selectedBranch: string | null;
  readonly selectedCategory: string;
  readonly selectedYear: number;
  readonly isLoading: boolean;
}