import { Injectable } from '@angular/core';
import { BaseApiService } from './base-api.service';
import {
  SalesMonthlyResponse,
  SalesUnitsResponse,
  SalesBranchResponse,
} from '../../types/sales.model';
import { CompanyKey } from '../../types/company.model';

/**
 * Catatan:
 * - Tiap perusahaan bisa beda pola endpoint & nama param (periode/year/y).
 * - Di bawah ini kita definisikan builder per perusahaan agar rapi.
 */ // Honda

interface SalesEndpointBuilders {
  monthlyPath: (year: string) => string;           // path (boleh embed year)
  unitsPath: () => string;
  branchPath: () => string;
  // param key untuk query (?periode= / ?year= / ?y=)
  monthlyParams: (year: string) => Record<string, string>;
  unitsParams: (year: string) => Record<string, string>;
  branchParams: (year: string) => Record<string, string>;
}

@Injectable({ providedIn: 'root' })
export class SalesService extends BaseApiService {

  private readonly cfg: Record<CompanyKey, SalesEndpointBuilders> = {
    // HYUNDAI
    'sinar-galesong-mobilindo': {
      monthlyPath: () => 'getSalesSummaryReportMonthly',
      unitsPath:   () => 'getSalesSummaryReportUnits',
      branchPath:  () => 'getSalesSummaryReportBranch',
      monthlyParams: (year) => ({ periode: year }),
      unitsParams:   (year) => ({ periode: year }),
      branchParams:  (year) => ({ periode: year }),
    },
    // TOYOTA
    'sinar-galesong-mandiri': {
      monthlyPath: (year) => `reports/monthly/${year}`, // year di path
      unitsPath:   () => 'reports/units',
      branchPath:  () => 'reports/branch',
      monthlyParams: () => ({}),                 // tidak perlu query
      unitsParams:   (year) => ({ year }),
      branchParams:  (year) => ({ year }),
    },
    // MITSUBISHI
    'sinar-galesong-prima': {
      monthlyPath: () => 'summary/monthly',
      unitsPath:   () => 'summary/units',
      branchPath:  () => 'summary/branches',
      monthlyParams: (year) => ({ periode: year }),
      unitsParams:   (year) => ({ periode: year }),
      branchParams:  (year) => ({ periode: year }),
    },
    // HONDA
    'sinar-galesong-automobil': {
      monthlyPath: () => 'getSalesMonthly',
      unitsPath:   () => 'getSalesByUnits',
      branchPath:  () => 'getSalesByBranch',
      monthlyParams: (year) => ({ y: year }),
      unitsParams:   (year) => ({ y: year }),
      branchParams:  (year) => ({ y: year }),
    },
  };

  private use(company: string): SalesEndpointBuilders {
    const key = company as CompanyKey;
    const conf = this.cfg[key];
    if (!conf) throw new Error(`Config sales untuk company '${company}' belum diset`);
    return conf;
  }

  // === Public API (dipakai komponen) ===
  getSalesMonthly(company: string, year: string) {
    const c = this.use(company);
    return this.get<SalesMonthlyResponse>(company, c.monthlyPath(year), c.monthlyParams(year));
  }

  getSalesUnits(company: string, year: string) {
    const c = this.use(company);
    return this.get<SalesUnitsResponse>(company, c.unitsPath(), c.unitsParams(year));
  }

  getSalesBranch(company: string, year: string) {
    const c = this.use(company);
    return this.get<SalesBranchResponse>(company, c.branchPath(), c.branchParams(year));
  }
}
