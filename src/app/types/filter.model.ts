export type CategoryFilter = 'all-category' | 'sales' | 'after-sales';

export interface AppFilter {
  company: string;      // contoh: 'sinar-galesong-mobilindo'
  category: CategoryFilter;
  period: string;       // tahun, contoh: '2025'
}
