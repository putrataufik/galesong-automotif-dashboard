// src/app/shared/utils/dashboard-aftersales-kpi.utils.ts
import { AfterSalesItem } from '../../types/aftersales.model';

export interface AfterSalesKpiData {
  totalRevenueRealisasi: number;
  totalBiayaUsaha: number;
  totalProfit: number;
  totalHariKerja: number;
  serviceCabang: number;
  afterSalesRealisasi: number;
  unitEntryRealisasi: number;
  sparepartTunaiRealisasi: number;
}

export function calculateAfterSalesKpi(aftersales: AfterSalesItem[]): AfterSalesKpiData {
  if (!aftersales.length) {
    return {
      totalRevenueRealisasi: 0,
      totalBiayaUsaha: 0,
      totalProfit: 0,
      totalHariKerja: 0,
      serviceCabang: 0,
      afterSalesRealisasi: 0,
      unitEntryRealisasi: 0,
      sparepartTunaiRealisasi: 0,
    };
  }

  // Kalkulasi total untuk setiap KPI
  const totalRevenueRealisasi = aftersales
    .map(item => Number(item.total_revenue_realisasi))
    .reduce((total, current) => total + current, 0);

  const totalBiayaUsaha = aftersales
    .map(item => Number(item.biaya_usaha))
    .reduce((total, current) => total + current, 0);

  const totalProfit = aftersales
    .map(item => Number(item.profit))
    .reduce((total, current) => total + current, 0);

  const afterSalesRealisasi = aftersales
    .map(item => Number(item.after_sales_realisasi))
    .reduce((total, current) => total + current, 0);

  const sparepartTunaiRealisasi = aftersales
    .map(item => Number(item.part_tunai_realisasi))
    .reduce((total, current) => total + current, 0);

  const unitEntryRealisasi = aftersales
    .map(item => Number(item.unit_entry_realisasi))
    .reduce((total, current) => total + current, 0);

  // Service Cabang = After Sales - Sparepart Tunai
  const serviceCabang = afterSalesRealisasi - sparepartTunaiRealisasi;

  // Total Hari Kerja - total dari semua cabang
  const totalHariKerja = aftersales
    .map(item => Number(item.hari_kerja))
    .reduce((total, current) => total + current, 0);

  return {
    totalRevenueRealisasi,
    totalBiayaUsaha,
    totalProfit,
    totalHariKerja,
    serviceCabang,
    afterSalesRealisasi,
    unitEntryRealisasi,
    sparepartTunaiRealisasi,
  };
}

// Utility function untuk format currency dalam Rupiah
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
}

// Utility function untuk format number dengan separator
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value);
}

/**
 * Format angka ke bentuk ringkas dengan suffix skala:
 * - >= 1.000.000           → "X, X Juta"
 * - >= 1.000.000.000       → "X, X M" (Miliar)
 * - >= 1.000.000.000.000   → "X, X T" (Triliun)
 * < 1.000.000              → angka utuh dengan pemisah ribuan
 *
 * Contoh:
 *  - 3_359_229_108.1  → "3,4 M"
 *  - 312_761_089      → "312,8 Juta"
 *  - 12_500           → "12.500"
 */
export function formatCompactNumber(
  value: number | string | null | undefined,
  fractionDigits = 2 // default 2 angka di belakang koma
): string {
  const num = Number(value ?? 0);
  if (!isFinite(num)) return '0';

  const sign = num < 0 ? '-' : '';
  const abs = Math.abs(num);

  // ≥ 1 Triliun
  if (abs >= 1_000_000_000_000) {
    return `${sign}${(abs / 1_000_000_000_000).toLocaleString('id-ID', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    })} T`;
  }

  // ≥ 1 Miliar
  if (abs >= 1_000_000_000) {
    return `${sign}${(abs / 1_000_000_000).toLocaleString('id-ID', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    })} M`;
  }

  // ≥ 1 Juta
  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toLocaleString('id-ID', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    })} Juta`;
  }

  // < 1 Juta
  return `${sign}${abs.toLocaleString('id-ID', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}`;
}
