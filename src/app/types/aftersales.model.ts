// src/app/types/aftersales.model.ts

import { FilterInfo } from './filter.model';

// After Sales Interfaces
export interface AfterSalesItem {
  // Identitas & periode
  month: string;
  cabang_id: string;

  // Tenaga kerja & hari kerja
  mekanik: string;
  hari_kerja: string;

  // Ringkasan revenue & laba
  total_revenue_realisasi: string;
  total_revenue_target: string;
  biaya_usaha: string;
  profit: string;

  // Agregat after sales
  after_sales_realisasi: string;
  after_sales_target: string;

  // Unit Entry (agregat)
  unit_entry_realisasi: string;
  unit_entry_target: string;

  // ============================
  // Unit Entry (breakdown) - BARU
  // ============================
  unit_entry_oli_realisasi: string;
  unit_entry_express_realisasi: string;
  unit_entry_rutin_realisasi: string;
  unit_entry_sedang_realisasi: string;
  unit_entry_berat_realisasi: string;
  unit_entry_overhoul_realisasi: string;
  unit_entry_claim_realisasi: string;
  unit_entry_kelistrikan_realisasi: string;
  unit_entry_kupon_realisasi: string;
  unit_entry_over_size_realisasi: string;
  unit_entry_pdc_realisasi: string;
  unit_entry_cvt_realisasi: string;
  unit_entry_body_repair_realisasi: string;

  // Sparepart tunai
  part_tunai_realisasi: string;
  part_tunai_target: string;

  // Part bengkel (agregat)
  part_bengkel_realisasi: string;
  part_bengkel_target: string;

  // Part bengkel (breakdown)
  part_bengkel_oli_realisasi: string;
  part_bengkel_express_realisasi: string;
  part_bengkel_rutin_realisasi: string;
  part_bengkel_sedang_realisasi: string;
  part_bengkel_berat_realisasi: string;
  part_bengkel_overhoul_realisasi: string;

  // Jasa service (agregat)
  jasa_service_realisasi: string;
  jasa_service_target: string;

  // Jasa service (breakdown)
  jasa_service_oli_realisasi: string;
  jasa_service_express_realisasi: string;
  jasa_service_rutin_realisasi: string;
  jasa_service_sedang_realisasi: string;
  jasa_service_berat_realisasi: string;
  jasa_service_overhoul_realisasi: string;
  jasa_service_claim_realisasi: string;
  jasa_service_kelistrikan_realisasi: string;
  jasa_service_kupon_realisasi: string;
  jasa_service_over_size_realisasi: string;
  jasa_service_pdc_realisasi: string;
  jasa_service_cvt_realisasi: string;
  jasa_service_body_repair_realisasi: string;
}

export interface KpiGroup {
  realisasi: number;
  target: number;
}

export interface KpiResult {
  afterSales: KpiGroup;
  serviceCabang: KpiGroup;
  jasaService: KpiGroup;
  unitEntry: KpiGroup;
  sparepartTunai: KpiGroup;
  oli: KpiGroup;
  totalUnitEntry: number;
  profit: number;
  profitRealisasi: number;
  sparepartBengkel: KpiGroup;
  // CPUS Service
  jasaServiceBerat: KpiGroup;
  jasaServiceBodyRepair: KpiGroup;
  jasaServiceCvt: KpiGroup;
  jasaServiceExpress: KpiGroup;
  jasaServiceKelistrikan: KpiGroup;
  jasaServiceOli: KpiGroup;
  jasaServiceOverSize: KpiGroup;
  jasaServiceOverhoul: KpiGroup;
  jasaServiceRutin: KpiGroup;
  jasaServiceSedang: KpiGroup;

  //Non CPUS Service
  jasaServiceClaim: KpiGroup;
  jasaServicePdc: KpiGroup;
  jasaServiceKupon: KpiGroup;

  partBengkelExpress: KpiGroup;
  partBengkelBerat: KpiGroup;
  partBengkelOli: KpiGroup;
  partBengkelOverhoul: KpiGroup;
  partBengkelRutin: KpiGroup;
  partBengkelSedang: KpiGroup;

  unitEntryExpressRealisasi: KpiGroup;
  unitEntryRutinRealisasi: KpiGroup;
  unitEntrySedangRealisasi: KpiGroup;
  unitEntryBeratRealisasi: KpiGroup;
  unitEntryOverhoulRealisasi: KpiGroup;
  unitEntryClaimRealisasi: KpiGroup;
  unitEntryKelistrikanRealisasi: KpiGroup;
  unitEntryKuponRealisasi: KpiGroup;
  unitEntryOverSizeRealisasi: KpiGroup;
  unitEntryPdcRealisasi: KpiGroup;
  unitEntryCvtRealisasi: KpiGroup;
  unitEntryBodyRepairRealisasi: KpiGroup;
  unitEntryOliRealisasi: KpiGroup;
}
export interface KpiData {
  afterSales: { realisasi: number; target: number };
  serviceCabang: { realisasi: number; target: number };
  jasaService: { realisasi: number; target: number };
  unitEntry: { realisasi: number; target: number };
  sparepartTunai: { realisasi: number; target: number };
  sparepartBengkel: { realisasi: number; target: number };
  oli: { realisasi: number; target: number };

  // CPUS SERVICE
  jasaServiceBerat: { realisasi: number; target: number };
  jasaServiceBodyRepair: { realisasi: number; target: number };
  jasaServiceExpress: { realisasi: number; target: number };
  jasaServiceKelistrikan: { realisasi: number; target: number };
  jasaServiceOli: { realisasi: number; target: number };
  jasaServiceOverSize: { realisasi: number; target: number };
  jasaServiceOverhoul: { realisasi: number; target: number };
  jasaServicePdc: { realisasi: number; target: number };
  jasaServiceRutin: { realisasi: number; target: number };
  jasaServiceSedang: { realisasi: number; target: number };

  // Non CPUS Service
  jasaServiceClaim: { realisasi: number; target: number };
  jasaServiceKupon: { realisasi: number; target: number };
  jasaServiceCvt: { realisasi: number; target: number };

  totalUnitEntry: number;
  profit: number;

  //CPUS SPAREPART BENGKEL #1
  partBengkelExpress: { realisasi: number; target: number };
  partBengkelOli: { realisasi: number; target: number };
  partBengkelOverhoul: { realisasi: number; target: number };
  partBengkelRutin: { realisasi: number; target: number };
  partBengkelSedang: { realisasi: number; target: number };
  partBengkelBerat: { realisasi: number; target: number };

  unitEntryExpressRealisasi: { realisasi: number; target: number };
  unitEntryRutinRealisasi: { realisasi: number; target: number };
  unitEntrySedangRealisasi: { realisasi: number; target: number };
  unitEntryBeratRealisasi: { realisasi: number; target: number };
  unitEntryOverhoulRealisasi: { realisasi: number; target: number };
  unitEntryClaimRealisasi: { realisasi: number; target: number };
  unitEntryKelistrikanRealisasi: { realisasi: number; target: number };
  unitEntryKuponRealisasi: { realisasi: number; target: number };
  unitEntryOverSizeRealisasi: { realisasi: number; target: number };
  unitEntryPdcRealisasi: { realisasi: number; target: number };
  unitEntryCvtRealisasi: { realisasi: number; target: number };
  unitEntryBodyRepairRealisasi: { realisasi: number; target: number };
  unitEntryOliRealisasi: { realisasi: number; target: number };
}

// Interface untuk KPI tambahan
export interface AdditionalKpiData {
  jumlahMekanik: number;
  jumlahHariKerja: number;
  totalBiayaUsaha: number;
  totalProfit: number;
  totalRevenueRealisasi: number;
  totalProfitRealisasi: number;
}

export interface SisaHariOption {
  value: string;
  name: string;
}

export interface AfterSalesResponse {
  filterInfo: FilterInfo[];
  aftersales: AfterSalesItem[];
}
