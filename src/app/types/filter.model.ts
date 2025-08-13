// src/app/types/filter.model.ts
export type CategoryFilter = 'all-category' | 'sales' | 'after-sales';

// Dashboard Utama: Company → Category → Year → Month (NO Branch)
export interface AppFilter {
  company: string;      
  category: CategoryFilter;  // Ada kategori
  period: string;      
  month: string; 
}

// After Sales Dashboard: Company → Branch → Year → Month (NO Category)
export interface AfterSalesFilter {
  company: string;
  branch: string;      // Ada cabang (bisa kosong = semua cabang)
  period: string;
  month: string;
}

export interface FilterInfo {
  year: string;
  category: 'SALES' | 'AFTER_SALES' | 'ALL';
  companyName: string;
}