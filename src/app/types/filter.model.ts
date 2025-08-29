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
}

/**
 * Informasi filter yang sudah terformat untuk ditampilkan ke UI.
 */
export interface FilterInfo {
  /** Tahun dalam format YYYY */
  year: string;

  /** Bulan dalam format "01".."12" atau "all-month" */
  month: string;

  /** Kategori dalam bentuk enum kapital untuk konsistensi tampilan */
  category: 'SALES' | 'AFTER_SALES' | 'ALL';

  /** Nama perusahaan yang ditampilkan di UI */
  companyName: string;

  /** Nama cabang yang ditampilkan di UI */
  branchName: string;
}
