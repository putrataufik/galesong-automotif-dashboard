export type CategoryFilter = 'all-category' | 'sales' | 'after-sales';

export interface AppFilter {
  company: string;      
  category: CategoryFilter;
  period: string;      
  month: string; 
}
export interface FilterInfo {
  year: string;
  category: 'SALES' | 'AFTER_SALES' | 'ALL';
  companyName: string;
}
