// src/app/core/services/dashboard.service.ts - FIXED VERSION
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

type ParamsBuilder = (args: { year: string; month?: string; branch?: string }) => Record<string, string>;

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
        salesMonthly: ({ year, month, branch }) => {
          const params: Record<string, string> = { periode: year };
          // ✅ FIX: Use bracket notation instead of dot notation
          if (month && month !== 'all-month') params['month'] = month;
          if (branch) params['cabang_id'] = branch;
          return params;
        },
        salesUnits: ({ year, month, branch }) => {
          const params: Record<string, string> = { periode: year };
          if (month && month !== 'all-month') params['month'] = month;
          if (branch) params['cabang_id'] = branch;
          return params;
        },
        salesBranch: ({ year, month, branch }) => {
          const params: Record<string, string> = { periode: year };
          if (month && month !== 'all-month') params['month'] = month;
          if (branch) params['cabang_id'] = branch;
          return params;
        },
        afterSalesMonthly: ({ year, month, branch }) => {
          const params: Record<string, string> = { periode: year };
          if (month && month !== 'all-month') params['month'] = month;
          if (branch) params['cabang_id'] = branch;
          return params;
        }
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
        afterSalesMonthly: 'aftersales/monthly',
      },
      params: {
        salesMonthly: ({ month, branch }) => {
          const params: Record<string, string> = {};
          if (month && month !== 'all-month') params['month'] = month;
          if (branch) params['branch_code'] = branch;
          return params;
        },
        salesUnits: ({ year, month, branch }) => {
          const params: Record<string, string> = { year };
          if (month && month !== 'all-month') params['month'] = month;
          if (branch) params['branch_code'] = branch;
          return params;
        },
        salesBranch: ({ year, month, branch }) => {
          const params: Record<string, string> = { year };
          if (month && month !== 'all-month') params['month'] = month;
          if (branch) params['branch_code'] = branch;
          return params;
        },
        afterSalesMonthly: ({ year, month, branch }) => {
          const params: Record<string, string> = { year };
          if (month && month !== 'all-month') params['month'] = month;
          if (branch) params['branch_code'] = branch;
          return params;
        }
      },
    },

    'sinar-galesong-prima': {
      baseUrl: 'https://webservice.sinargalesong.net/SUMMARY/mitsubishi',
      headers: new HttpHeaders({ authentication: 'rifqymuskar' }),
      endpoints: {
        salesMonthly: 'summary/monthly',
        salesUnits: 'summary/units',
        salesBranch: 'summary/branches',
        afterSalesMonthly: 'summary/aftersales',
      },
      params: {
        salesMonthly: ({ year, month, branch }) => {
          const params: Record<string, string> = { periode: year };
          if (month && month !== 'all-month') params['month'] = month;
          if (branch) params['cabang_id'] = branch;
          return params;
        },
        salesUnits: ({ year, month, branch }) => {
          const params: Record<string, string> = { periode: year };
          if (month && month !== 'all-month') params['month'] = month;
          if (branch) params['cabang_id'] = branch;
          return params;
        },
        salesBranch: ({ year, month, branch }) => {
          const params: Record<string, string> = { periode: year };
          if (month && month !== 'all-month') params['month'] = month;
          if (branch) params['cabang_id'] = branch;
          return params;
        },
        afterSalesMonthly: ({ year, month, branch }) => {
          const params: Record<string, string> = { periode: year };
          if (month && month !== 'all-month') params['month'] = month;
          if (branch) params['cabang_id'] = branch;
          return params;
        }
      },
    },

    'sinar-galesong-automobil': {
      baseUrl: 'https://webservice.sinargalesong.net/SUMMARY/honda',
      headers: new HttpHeaders({ authentication: 'rifqymuskar' }),
      endpoints: {
        salesMonthly: 'getSalesMonthly',
        salesUnits: 'getSalesByUnits',
        salesBranch: 'getSalesByBranch',
        afterSalesMonthly: 'getAfterSalesMonthly',
      },
      params: {
        salesMonthly: ({ year, month, branch }) => {
          const params: Record<string, string> = { y: year };
          if (month && month !== 'all-month') params['m'] = month;
          if (branch) params['b'] = branch;
          return params;
        },
        salesUnits: ({ year, month, branch }) => {
          const params: Record<string, string> = { y: year };
          if (month && month !== 'all-month') params['m'] = month;
          if (branch) params['b'] = branch;
          return params;
        },
        salesBranch: ({ year, month, branch }) => {
          const params: Record<string, string> = { y: year };
          if (month && month !== 'all-month') params['m'] = month;
          if (branch) params['b'] = branch;
          return params;
        },
        afterSalesMonthly: ({ year, month, branch }) => {
          const params: Record<string, string> = { y: year };
          if (month && month !== 'all-month') params['m'] = month;
          if (branch) params['b'] = branch;
          return params;
        }
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
    args: { year: string; month?: string; branch?: string }
  ): { url: string; params: Record<string, string>; headers?: HttpHeaders } {
    const cfg = this.getConfig(company);
    const def = cfg.endpoints[key];
    if (!def)
      throw new Error(
        `Endpoint '${key}' belum dikonfigurasi untuk perusahaan '${company}'`
      );
    const path = typeof def === 'function' ? def({ year: args.year }) : def;
    const url = `${cfg.baseUrl}/${path}`;
    const paramsBuilder = cfg.params?.[key];
    const params = paramsBuilder ? paramsBuilder(args) : {};
    return { url, params, headers: cfg.headers };
  }

  // ✅ SIMPLE: Keep original methods for backward compatibility
  getSalesMonthly(
    company: string,
    year: string
  ): Observable<SalesMonthlyResponse> {
    const { url, params, headers } = this.buildUrl(
      company,
      'salesMonthly',
      { year }
    );
    return this.http
      .get<ApiResponse<SalesMonthlyResponse>>(url, { params, headers })
      .pipe(map((r) => r.data));
  }

  getSalesUnits(company: string, year: string): Observable<SalesUnitsResponse> {
    const { url, params, headers } = this.buildUrl(company, 'salesUnits', { year });
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
      { year }
    );
    return this.http
      .get<ApiResponse<SalesBranchResponse>>(url, { params, headers })
      .pipe(map((r) => r.data));
  }
  
  // ✅ ENHANCED: After Sales dengan optional branch parameter  
  getAfterSalesMonthly(
    company: string,
    year: string,
    branch?: string
  ): Observable<AfterSalesResponse> {
    const { url, params, headers } = this.buildUrl(
      company,
      'afterSalesMonthly',
      { year, branch }
    );
    return this.http
      .get<ApiResponse<AfterSalesResponse>>(url, { params, headers })
      .pipe(
        map((r) => r.data),
        // ✅ SIMPLE: Client-side filtering jika backend belum support branch
        map((data) => branch ? this.filterByBranch(data, branch) : data)
      );
  }

  // ✅ SIMPLE: Helper method untuk filter di client-side
  private filterByBranch(data: AfterSalesResponse, branchId: string): AfterSalesResponse {
    return {
      ...data,
      aftersales: data.aftersales.filter(item => item.cabang_id === branchId)
    };
  }
}