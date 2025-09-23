// src/app/pages/sales-dashboard/sales.utils.ts
import { UiKpis } from '../../core/services/sales-api.service';
import { AppFilter } from '../../types/filter.model';
import { SalesFilter } from '../../core/models/sales.models';



// ====== Cek KPI kosong (untuk empty state) ======
export function isUiKpisEmpty(k: UiKpis | null | undefined): boolean {
  if (!k) return true;
  const pick = (p?: { selected?: { value?: number } }) => (p?.selected?.value ?? 0);
  const sum =
    pick(k.totalUnitSales) +
    pick(k.totalSPK) +
    pick(k.totalDO) +
    (k.topBranch?.selected ? 1 : 0) +
    (k.topModel?.selected ? 1 : 0);
  return sum === 0;
}



// ====== Display name helpers ======
export function getCompanyDisplayName(company: string): string {
  const companyMap: Record<string, string> = {
    'sinar-galesong-mobilindo': 'Sinar Galesong Mobilindo',
    'pt-galesong-otomotif': 'PT Galesong Otomotif',
    'all-company': 'Semua Perusahaan',
  };
  return companyMap[company] || company;
}

export function getCategoryDisplayName(category: string): string {
  const categoryMap: Record<string, string> = {
    'all-category': 'Semua Kategori',
    sales: 'Sales',
  };
  return categoryMap[category] || category;
}

export function getBranchDisplayName(branch: string): string {
  const branchMap: Record<string, string> = {
    'all-branch': 'Semua Cabang',
    '0050': 'Pettarani',
    '0053': 'Gorontalo',
    '0052': 'Kendari',
    '0051': 'Palu',
    '0054': 'Palopo',
  };
  return branchMap[branch] || branch;
}


export function getTrendYear(ui: AppFilter): string {
  if (ui.useCustomDate && ui.selectedDate) return ui.selectedDate.slice(0, 4);
  return ui.year?.trim() ? ui.year : String(new Date().getFullYear());
}
// utils: ambil bulan (MM) sesuai UI (custom date > month > current)
export function getTrendMonth(ui: AppFilter): string {
  // Jika pakai custom date (YYYY-MM-DD), ambil MM langsung
  if (ui.useCustomDate && ui.selectedDate) {
    const mm = ui.selectedDate.slice(5, 7);
    if (/^\d{2}$/.test(mm)) return mm;
  }

  // Jika ada ui.month, normalisasi ke 2 digit dan validasi 1-12
  if (ui.month != null && String(ui.month).trim() !== '') {
    const n = parseInt(String(ui.month), 10);
    if (Number.isFinite(n) && n >= 1 && n <= 12) {
      return String(n).padStart(2, '0');
    }
  }

  // Fallback: bulan saat ini (local)
  return String(new Date().getMonth() + 1).padStart(2, '0');
}


export function toSalesFilter(ui: AppFilter): SalesFilter {
  if (ui.useCustomDate) {
    return {
      companyId: ui.company,
      branchId: ui.branch ?? 'all-branch',
      useCustomDate: true,
      compare: !!ui.compare,
      year: null,
      month: null,
      selectedDate: ui.selectedDate ?? null,
    };
  }
  const monthVal =
    ui.month && ui.month !== 'all-month'
      ? String(ui.month).padStart(2, '0')
      : null;

  return {
    companyId: ui.company,
    branchId: ui.branch ?? 'all-branch',
    useCustomDate: false,
    compare: !!ui.compare,
    year: ui.year?.trim() ? ui.year : null,
    month: monthVal,
    selectedDate: null,
  };
}

export function toAppFilter(f: SalesFilter): AppFilter {
  if (f.useCustomDate) {
    const today = new Date();
    const sd = f.selectedDate ?? '';
    const y = sd ? sd.slice(0, 4) : String(today.getFullYear());
    const m = sd ? sd.slice(5, 7) : String(today.getMonth() + 1).padStart(2, '0');
    return {
      company: f.companyId,
      category: 'sales',
      year: y,
      month: m,
      branch: f.branchId ?? 'all-branch',
      compare: f.compare ?? true,
      useCustomDate: true,
      selectedDate: f.selectedDate ?? today.toISOString().slice(0, 10),
    };
  }
  return {
    company: f.companyId,
    category: 'sales',
    year: f.year ?? String(new Date().getFullYear()),
    month: f.month ?? String(new Date().getMonth() + 1).padStart(2, '0'),
    branch: f.branchId ?? 'all-branch',
    compare: f.compare ?? true,
    useCustomDate: false,
    selectedDate: '',
  };
}