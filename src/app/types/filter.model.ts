  // src/app/types/filter.model.ts

  /** 
   * Pilihan kategori utama untuk dashboard.
   * - all-category → gabungan sales & after-sales
   * - sales        → hanya KPI sales
   * - after-sales  → hanya KPI after-sales
   */
  export type CategoryFilter = 'all-category' | 'sales' | 'after-sales';

  /**
   * Pilihan branch (cabang).
   * - all-branch → gabungan semua cabang
   * - selain itu → kode unik/id/slug cabang (mis. "pettarani", "kendari", dll.)
   */
  export type BranchFilter = 'all-branch' | string;

  /**
   * Filter utama yang dikirim dari komponen filter ke dashboard.
   */
  export interface AppFilter {
    company: string;
    category: 'all-category' | 'sales' | 'after-sales';
    year: string;            // "2025"
    month: string;           // "all-month" | "01".."12"
    period?: string;         // "2025-08" (opsional)
    branch: string;
    compare?: boolean;
    useCustomDate?: boolean;
    selectedDate?: string;
  }

  /**
   * Informasi filter yang sudah terformat untuk ditampilkan ke UI.
   */
  export interface FilterInfo {
    year: string;                      // YYYY
    month: string | null;                     // "01".."12" atau "all-month"
    category: 'SALES' | 'AFTER_SALES' | 'ALL';
    companyName: string;
    branchName: string;
  }

  export interface FilterInfoUI extends FilterInfo {
    /** Jika month = 'all-month' → null */
    month: string | null;
    /** “Periode data 2025–Agustus” atau “Periode data 2025” */
    periodLabel: string;
    /** Compare flag dari filter */
    compareActive: boolean;
    /** “Aktif” | “Tidak Aktif” */
    compareLabel: 'Aktif' | 'Tidak Aktif';
  }
