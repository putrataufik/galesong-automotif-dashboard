// src/app/core/services/dashboard.service.ts
import { Injectable, inject } from '@angular/core';
import { forkJoin, map, Observable, of } from 'rxjs';

import { SalesService } from './sales.service';
import { AfterSalesService } from './aftersales.service';

import {
  SalesMonthlyResponse,
  SalesUnitsResponse,
  SalesBranchResponse,
  ChartData,
} from '../../types/sales.model';
import { AfterSalesResponse } from '../../types/aftersales.model';
import { AfterSalesKpiData } from '../../shared/utils/dashboard-aftersales-kpi.utils';
import { CompanyKey } from '../../types/company.model';

import {
  processLineChartData,
  processBarChartData,
  processPieChartData,
  processAfterSalesRealisasiVsTargetData,
  processAfterSalesProfitByBranchData,
} from '../../shared/utils/dashboard-chart.utils';
import {
  calculateTotalUnitSales,
  findTopModel,
  findTopBranch,
} from '../../shared/utils/dashboard-kpi.utils';
import { calculateAfterSalesKpi } from '../../shared/utils/dashboard-aftersales-kpi.utils';

export type Maybe<T> = T | null;
export type Category = 'sales' | 'after-sales' | 'all-category';

export interface DashboardOverviewDTO {
  // Sales
  salesTrend: Maybe<ChartData>;
  salesByModel: Maybe<ChartData>;
  salesByBranch: Maybe<ChartData>;
  totalUnitSales: number;
  topModel: { name: string; unit: number } | null;
  topBranch: { code: string; unit: number } | null;
  // After Sales
  afterSalesKpi: Maybe<AfterSalesKpiData>;
  afterSalesRealisasiVsTarget: Maybe<ChartData>;
  afterSalesProfitByBranch: Maybe<ChartData>;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private sales = inject(SalesService);
  private after = inject(AfterSalesService);

  // ------- Endpoint-level (kompatibel dgn komponen lama) -------
  getSalesMonthly(company: CompanyKey, year: string): Observable<SalesMonthlyResponse> {
    return this.sales.getSalesMonthly(company, year);
  }
  getSalesUnits(company: CompanyKey, year: string): Observable<SalesUnitsResponse> {
    return this.sales.getSalesUnits(company, year);
  }
  getSalesBranch(company: CompanyKey, year: string): Observable<SalesBranchResponse> {
    return this.sales.getSalesBranch(company, year);
  }
  getAfterSalesMonthly(company: CompanyKey, year: string): Observable<AfterSalesResponse> {
    return this.after.getAfterSalesMonthly(company, year);
  }

  // Helpers cabang
  getCabangNameMap() {
    return this.sales.getCabangNameMap();
  }
  getCabangName(id: string) {
    return this.sales.getCabangName(id);
  }

  // ------- Facade: gabung Sales + After Sales untuk Main Dashboard -------
  getDashboardOverview(company: CompanyKey, year: string, category: Category): Observable<DashboardOverviewDTO> {
    const wantSales = category === 'sales' || category === 'all-category';
    const wantAS    = category === 'after-sales' || category === 'all-category';

    // Bangun sources TANPA nilai undefined:
    const sources: {
      monthly?: Observable<SalesMonthlyResponse | null>;
      units?: Observable<SalesUnitsResponse | null>;
      branch?: Observable<SalesBranchResponse | null>;
      aftersales?: Observable<AfterSalesResponse | null>;
    } = {};

    if (wantSales) {
      sources.monthly = this.getSalesMonthly(company, year);
      sources.units   = this.getSalesUnits(company, year);
      sources.branch  = this.getSalesBranch(company, year);
    } else {
      // Placeholder null agar destructuring aman
      sources.monthly = of(null);
      sources.units   = of(null);
      sources.branch  = of(null);
    }

    if (wantAS) {
      sources.aftersales = this.getAfterSalesMonthly(company, year);
    } else {
      sources.aftersales = of(null);
    }

    const cabangMap = this.getCabangNameMap();

    return forkJoin(sources).pipe(
      map(({ monthly, units, branch, aftersales }) => {
        // ===== SALES =====
        const salesTrend     = monthly ? processLineChartData(monthly) : null;
        const salesByModel   = units ? processPieChartData(units) : null;
        const salesByBranch  = branch ? processBarChartData(branch, cabangMap) : null;

        const salesRaw       = units?.sales ?? [];
        const branchesRaw    = branch?.sales ?? [];
        const totalUnitSales = calculateTotalUnitSales(salesRaw) || 0;
        const topModel       = findTopModel(salesRaw);
        const topBranch      = findTopBranch(branchesRaw, this.getCabangName.bind(this));

        // ===== AFTER SALES =====
        const list = aftersales?.aftersales ?? [];
        const asKpi             = aftersales ? calculateAfterSalesKpi(list) : null;
        const asRvT             = aftersales ? (processAfterSalesRealisasiVsTargetData(aftersales) ?? null) : null;
        const asProfitByBranch  = aftersales ? (processAfterSalesProfitByBranchData(aftersales, cabangMap) ?? null) : null;

        const dto: DashboardOverviewDTO = {
          salesTrend,
          salesByModel,
          salesByBranch,
          totalUnitSales,
          topModel,
          topBranch,
          afterSalesKpi: asKpi,
          afterSalesRealisasiVsTarget: asRvT,
          afterSalesProfitByBranch: asProfitByBranch,
        };
        return dto;
      })
    );
  }
}
