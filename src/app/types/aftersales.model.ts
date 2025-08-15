// src/app/types/aftersales.model.ts

import { FilterInfo } from "./filter.model";

// After Sales Interfaces
export interface AfterSalesItem {
    month: string;
    cabang_id: string;
    mekanik: string;
    hari_kerja: string;
    biaya_usaha: string;
    profit: string;
    after_sales_realisasi: string;
    after_sales_target: string;
    unit_entry_realisasi: string;
    unit_entry_target: string;
    part_tunai_realisasi: string;
    part_tunai_target: string;
    total_revenue_realisasi: string;
    total_revenue_target: string;
  }
  
  export interface AfterSalesResponse {
    filterInfo: FilterInfo[];
    aftersales: AfterSalesItem[];
  }