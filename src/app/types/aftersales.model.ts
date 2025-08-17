// src/app/types/aftersales.model.ts

import { FilterInfo } from "./filter.model";

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

  // Unit entry
  unit_entry_realisasi: string;
  unit_entry_target: string;

  // Sparepart tunai
  part_tunai_realisasi: string;
  part_tunai_target: string;

  // Part bengkel (breakdown + agregat)
  part_bengkel_realisasi: string;
  part_bengkel_target: string;
  //cpus sparepart bengkel
  part_bengkel_berat_realisasi: string;
  part_bengkel_express_realisasi: string;
  part_bengkel_oli_realisasi: string;
  part_bengkel_overhoul_realisasi: string;
  part_bengkel_rutin_realisasi: string;
  part_bengkel_sedang_realisasi: string;

  // Jasa service (breakdown + agregat)
  jasa_service_realisasi: string;
  jasa_service_target: string;
  // cpus jasa service
  jasa_service_berat_realisasi: string;
  jasa_service_body_repair_realisasi: string;
  jasa_service_claim_realisasi: string;
  jasa_service_cvt_realisasi: string;
  jasa_service_express_realisasi: string;
  jasa_service_kelistrikan_realisasi: string;
  jasa_service_kupon_realisasi: string;
  jasa_service_oli_realisasi: string;
  jasa_service_over_size_realisasi: string;
  jasa_service_overhoul_realisasi: string;
  jasa_service_pdc_realisasi: string;
  jasa_service_rutin_realisasi: string;
  jasa_service_sedang_realisasi: string;
}

export interface KpiGroup { realisasi: number; target: number; }

export interface KpiResult {
  afterSales: KpiGroup;
  serviceCabang: KpiGroup;
  unitEntry: KpiGroup;
  sparepartTunai: KpiGroup;
  oli: KpiGroup;
  totalUnitEntry: number;
  profit: number;
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
}

  
  export interface AfterSalesResponse {
    filterInfo: FilterInfo[];
    aftersales: AfterSalesItem[];
  }