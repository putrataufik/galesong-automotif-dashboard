import { Injectable } from '@angular/core';
import { BaseApiService } from './base-api.service';
import { AfterSalesResponse } from '../../types/aftersales.model';
import { CompanyKey } from '../../types/company.model';
import { tap } from 'rxjs/operators';

/**
 * Pola sama: beberapa company beda path/param.
 */ // Honda

interface AfterSalesEndpointBuilders {
  monthlyPath: (year: string) => string;
  monthlyParams: (year: string) => Record<string, string>;
}

@Injectable({ providedIn: 'root' })
export class AfterSalesService extends BaseApiService {
  private readonly cfg: Record<CompanyKey, AfterSalesEndpointBuilders> = {
    // HYUNDAI
    'sinar-galesong-mobilindo': {
      monthlyPath: () => 'getAfterSalesSummaryReportMonthly',
      monthlyParams: (year) => ({ periode: year }),
    },
    // TOYOTA
    'sinar-galesong-mandiri': {
      monthlyPath: () => 'aftersales/monthly',
      monthlyParams: (year) => ({ year }),
    },
    // MITSUBISHI
    'sinar-galesong-prima': {
      monthlyPath: () => 'aftersales/monthly',
      monthlyParams: (year) => ({ periode: year }),
    },
    // HONDA
    'sinar-galesong-automobil': {
      monthlyPath: () => 'getAfterSalesMonthly',
      monthlyParams: (year) => ({ y: year }),
    },
  };

  private use(company: string): AfterSalesEndpointBuilders {
    const key = company as CompanyKey;
    const conf = this.cfg[key];
    if (!conf)
      throw new Error(
        `Config aftersales untuk company '${company}' belum diset`
      );
    return conf;
  }

  getAfterSalesMonthly(company: string, year: string) {
    const c = this.use(company);
    return this.get<AfterSalesResponse>(
      company,
      c.monthlyPath(year),
      c.monthlyParams(year)
    );
  }
}
