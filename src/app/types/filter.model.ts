export type CategoryFilter = 'all-category' | 'sales' | 'after-sales';

export interface AppFilter {
  company: string;      
  category: CategoryFilter;
  period: string;       
}
