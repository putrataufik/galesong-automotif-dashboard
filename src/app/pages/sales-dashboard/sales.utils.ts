// src/app/pages/sales-dashboard/sales.utils.ts
import { UiKpis } from '../../core/services/sales-api.service';



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
