// =============================
// src/app/core/services/dashboard.service.ts
// =============================
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import {
  ApiResponse,
  SalesBranchResponse,
  SalesMonthlyResponse,
  SalesUnitsResponse,
} from '../../types/sales.model';
import { AfterSalesResponse } from '../../types/aftersales.model';

interface CompanyApiConfig {
  baseUrl: string;
  headers?: HttpHeaders;
  endpoints: Partial<Record<EndpointKey, EndpointDef>>;
  params?: Partial<Record<EndpointKey, ParamsBuilder>>;
}
type EndpointKey = 'salesMonthly' | 'salesUnits' | 'salesBranch' | 'afterSalesMonthly';

type EndpointDef = string | ((args: { year: string }) => string);

type ParamsBuilder = (args: { year: string }) => Record<string, string>;

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);

  // Mapping cabang statis dipakai lintas KPI/Chart
  private cabangNameMap: Record<string, string> = {
    '0050': 'PETTARANI',
    '0051': 'PALU',
    '0052': 'KENDARI',
    '0053': 'GORONTALO',
    '0054': 'PALOPO',
    '0055': 'SUNGGUMINASA',
  };

  getCabangName(id: string): string {
    return this.cabangNameMap[id] || id;
  }

  getCabangNameMap(): Record<string, string> {
    // Kembalikan salinan ringan untuk menghindari mutasi eksternal
    return { ...this.cabangNameMap };
  }

  // === Konfigurasi per perusahaan (base URL, path, params, headers) ===
  private companyApiConfig: Record<string, CompanyApiConfig> = {
    // Mobilindo (Hyundai) — sesuai API yang sudah ada
    'sinar-galesong-mobilindo': {
      baseUrl: 'https://webservice.sinargalesong.net/SUMMARY/hyundai',
      headers: new HttpHeaders({ authentication: 'rifqymuskar' }),
      endpoints: {
        salesMonthly: 'getSalesSummaryReportMonthly',
        salesUnits: 'getSalesSummaryReportUnits',
        salesBranch: 'getSalesSummaryReportBranch',
        afterSalesMonthly: 'getAfterSalesSummaryReportMonthly',
      },
      params: {
        salesMonthly: ({ year }) => ({ periode: year }),
        salesUnits: ({ year }) => ({ periode: year }),
        salesBranch: ({ year }) => ({ periode: year }),
        afterSalesMonthly: ({year}) => ({periode: year})
      },
    },
    // Contoh perusahaan lain (ganti sesuai backend nyata jika tersedia)
    'sinar-galesong-mandiri': {
      baseUrl: 'https://webservice.sinargalesong.net/SUMMARY/toyota',
      headers: new HttpHeaders({ authentication: 'rifqymuskar' }),
      endpoints: {
        salesMonthly: (a) => `reports/monthly/${a.year}`,
        salesUnits: 'reports/units',
        salesBranch: 'reports/branch',
      },
      params: {
        salesMonthly: () => ({}),
        salesUnits: ({ year }) => ({ year }),
        salesBranch: ({ year }) => ({ year }),
      },
    },

    'sinar-galesong-prima': {
      baseUrl: 'https://webservice.sinargalesong.net/SUMMARY/mitsubishi',
      headers: new HttpHeaders({ authentication: 'rifqymuskar' }),
      endpoints: {
        salesMonthly: 'summary/monthly',
        salesUnits: 'summary/units',
        salesBranch: 'summary/branches',
      },
      params: {
        salesMonthly: ({ year }) => ({ periode: year }),
        salesUnits: ({ year }) => ({ periode: year }),
        salesBranch: ({ year }) => ({ periode: year }),
      },
    },

    'sinar-galesong-automobil': {
      baseUrl: 'https://webservice.sinargalesong.net/SUMMARY/honda',
      headers: new HttpHeaders({ authentication: 'rifqymuskar' }),
      endpoints: {
        salesMonthly: 'getSalesMonthly',
        salesUnits: 'getSalesByUnits',
        salesBranch: 'getSalesByBranch',
      },
      params: {
        salesMonthly: ({ year }) => ({ y: year }),
        salesUnits: ({ year }) => ({ y: year }),
        salesBranch: ({ year }) => ({ y: year }),
      },
    },
  };

  private getConfig(company: string): CompanyApiConfig {
    const cfg = this.companyApiConfig[company];
    if (!cfg) throw new Error(`Config perusahaan tidak ditemukan: ${company}`);
    return cfg;
  }

  private buildUrl(
    company: string,
    key: EndpointKey,
    year: string
  ): { url: string; params: Record<string, string>; headers?: HttpHeaders } {
    const cfg = this.getConfig(company);
    const def = cfg.endpoints[key];
    if (!def)
      throw new Error(
        `Endpoint '${key}' belum dikonfigurasi untuk perusahaan '${company}'`
      );
    const path = typeof def === 'function' ? def({ year }) : def;
    const url = `${cfg.baseUrl}/${path}`;
    const paramsBuilder = cfg.params?.[key];
    const params = paramsBuilder ? paramsBuilder({ year }) : {};
    return { url, params, headers: cfg.headers };
  }

  getSalesMonthly(
    company: string,
    year: string
  ): Observable<SalesMonthlyResponse> {
    const { url, params, headers } = this.buildUrl(
      company,
      'salesMonthly',
      year
    );
    return this.http
      .get<ApiResponse<SalesMonthlyResponse>>(url, { params, headers })
      .pipe(map((r) => r.data));
  }

  getSalesUnits(company: string, year: string): Observable<SalesUnitsResponse> {
    const { url, params, headers } = this.buildUrl(company, 'salesUnits', year);
    return this.http
      .get<ApiResponse<SalesUnitsResponse>>(url, { params, headers })
      .pipe(map((r) => r.data));
  }

  getSalesBranch(
    company: string,
    year: string
  ): Observable<SalesBranchResponse> {
    const { url, params, headers } = this.buildUrl(
      company,
      'salesBranch',
      year
    );
    return this.http
      .get<ApiResponse<SalesBranchResponse>>(url, { params, headers })
      .pipe(map((r) => r.data));
  }
  
  getAfterSalesMonthly(
    company: string,
    year: string
  ): Observable<AfterSalesResponse> {
    const { url, params, headers } = this.buildUrl(
      company,
      'afterSalesMonthly',
      year
    );
    return this.http
      .get<ApiResponse<AfterSalesResponse>>(url, { params, headers })
      .pipe(map((r) => r.data));
  }
}
