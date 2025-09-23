import { AppFilter } from '../../types/filter.model';

export const ID_MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
] as const;

export function formatIndoDate(isoDate: string): string {
  if (!isoDate) return '';
  const [yy, mm, dd] = isoDate.split('-').map(Number);
  if (!yy || !mm || !dd || mm < 1 || mm > 12) return isoDate;
  return `${dd} ${ID_MONTHS[mm - 1]} ${yy}`;
}
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
    sales: 'Sales', 'after-sales': 'After Sales',
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

// ====== Period display name dari AppFilter ======
export function getPeriodDisplayName(
  filter: Pick<AppFilter, 'useCustomDate' | 'selectedDate' | 'year' | 'month'>
): string {
  if (filter.useCustomDate && filter.selectedDate) {
    return formatIndoDate(filter.selectedDate);
  }

  const year = filter.year;
  const month = filter.month;
  const monthMap: Record<string, string> = {
    'all-month': 'Semua Bulan',
    '01': 'Januari',
    '02': 'Februari',
    '03': 'Maret',
    '04': 'April',
    '05': 'Mei',
    '06': 'Juni',
    '07': 'Juli',
    '08': 'Agustus',
    '09': 'September',
    '10': 'Oktober',
    '11': 'November',
    '12': 'Desember',
  };

  const yearDisplay = year || 'Semua Tahun';
  const monthDisplay = monthMap[month || 'all-month'] || month || 'Semua Bulan';

  return month === 'all-month' || !month
    ? yearDisplay
    : `${monthDisplay} ${yearDisplay}`;
}
