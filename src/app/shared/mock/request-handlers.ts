// src/app/shared/mock/request-handlers.ts
import { RequestInfo } from 'angular-in-memory-web-api';
import {
  KpiCard,
  KpiDataItem,
  ChartDataItem,
  MonthlyData,
  MonthlyTargetData,
  MonthlySalesData,
  BranchPerformanceData,
} from './interfaces';

export class RequestHandlers {
  // --------------------
  // Constants
  // --------------------
  private static readonly MONTHS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
  ];

  // --------------------
  // Utilities
  // --------------------

  /**
   * Filter berdasarkan query string: company, branch, category.
   * - branch:
   *    * jika 'all-branch' → tidak dipersempit
   *    * jika spesifik → dipersempit
   * - category:
   *    * jika spesifik ('sales' / 'after-sales') → filter spesifik
   *    * jika 'all-category' ATAU tidak ada → gunakan data 'all-category'
   */
  private static filterByQuery<TData>(
    reqInfo: RequestInfo,
    data: ChartDataItem<TData>[]
  ): ChartDataItem<TData>[] {
    const company = reqInfo.query.get('company')?.[0];
    const branch = reqInfo.query.get('branch')?.[0];
    const category = reqInfo.query.get('category')?.[0];

    let result = data.filter((item) => item.company === company);

    if (branch && branch !== 'all-branch') {
      result = result.filter((item) => item.branch === branch);
    }

    if (category && category !== 'all-category') {
      result = result.filter((item) => item.category === category);
    } else {
      result = result.filter((item) => item.category === 'all-category');
    }

    return result;
  }

  /**
   * Agregasi bulanan untuk field numerik yang diberikan.
   * Contoh:
   *   aggregateMonthly(filtered, ['revenue','expense'] as const)
   *   aggregateMonthly(filtered, ['target','realization'] as const)
   */
  private static aggregateMonthly<
    T extends { month: string },
    U extends keyof T & string
  >(
    items: ChartDataItem<T>[],
    fields: readonly U[],
  ): Array<{ month: string } & Record<U, number>> {
    return this.MONTHS.map((month) => {
      const rows = items
        .flatMap((it) => it.data) // T[]
        .filter((d) => d.month === month);

      const out = { month } as { month: string } & Record<U, number>;
      for (const f of fields) {
        // @ts-expect-error: T[f] dipastikan number oleh kontrak pemanggil
        out[f] = rows.reduce((sum, d) => sum + (Number(d[f]) || 0), 0);
      }
      return out;
    });
  }

  // --------------------
  // Handlers
  // --------------------

  /** KPI Cards */
  static handleKpiRequest(reqInfo: RequestInfo, kpiData: KpiDataItem[]) {
    const company = reqInfo.query.get('company')?.[0];
    const branch = reqInfo.query.get('branch')?.[0];
    const category = reqInfo.query.get('category')?.[0];

    let data = kpiData.filter((item) => item.company === company);

    if (branch && branch !== 'all-branch') {
      data = data.filter((item) => item.branch === branch);
    }
    if (category && category !== 'all-category') {
      data = data.filter((item) => item.category === category);
    }

    const combinedKpi = {
      totalSales: data.reduce((sum, d) => sum + d.kpis.totalSales, 0),
      totalAfterSales: data.reduce((sum, d) => sum + d.kpis.totalAfterSales, 0),
      totalPendapatan: data.reduce((sum, d) => sum + d.kpis.totalPendapatan, 0),
      totalPengeluaran: data.reduce((sum, d) => sum + d.kpis.totalPengeluaran, 0),
      topSalesBranch: data.find((d) => d.kpis.topSalesBranch)?.kpis.topSalesBranch || '',
      topAfterSalesBranch: data.find((d) => d.kpis.topAfterSalesBranch)?.kpis.topAfterSalesBranch || '',
      totalOmzetSales: data.reduce((sum, d) => sum + d.kpis.totalOmzetSales, 0),
      totalOmzetAfterSales: data.reduce((sum, d) => sum + d.kpis.totalOmzetAfterSales, 0),
    };

    const kpiCards: KpiCard[] = [];

    if (category !== 'after-sales') {
      kpiCards.push(
        {
          title: 'Total Sales',
          value: combinedKpi.totalSales,
          unit: 'unit',
          icon: 'icons/car.png',
          bgColor: '#BFE8FF',
        },
        {
          title: 'Total Omzet Sales',
          value: `Rp. ${(combinedKpi.totalOmzetSales / 1_000_000_000).toFixed(1)} M`,
          unit: '',
          icon: 'icons/increase.png',
          bgColor: '#C3FFBF',
        },
      );
    }

    if (category !== 'sales') {
      kpiCards.push(
        {
          title: 'Total After Sales',
          value: combinedKpi.totalAfterSales,
          unit: '',
          icon: 'icons/wrench.png',
          bgColor: '#BFD1FF',
        },
        {
          title: 'Total Omzet After Sales',
          value: `Rp. ${(combinedKpi.totalOmzetAfterSales / 1_000_000_000).toFixed(1)} M`,
          unit: '',
          icon: 'icons/increase.png',
          bgColor: '#C3FFBF',
        },
      );
    }

    if (branch === 'all-branch') {
      if (category !== 'after-sales') {
        kpiCards.push({
          title: 'Cabang dengan Sales Tertinggi',
          value: combinedKpi.topSalesBranch,
          unit: '',
          icon: 'icons/winner.png',
          bgColor: '#F4E9BF',
        });
      }
      if (category !== 'sales') {
        kpiCards.push({
          title: 'Cabang dengan After Sales Terbaik',
          value: combinedKpi.topAfterSalesBranch,
          unit: '',
          icon: 'icons/winner.png',
          bgColor: '#F4E9BF',
        });
      }
    }

    kpiCards.push(
      {
        title: 'Total Pendapatan',
        value: `Rp. ${(combinedKpi.totalPendapatan / 1_000_000_000).toFixed(1)} M`,
        unit: '',
        icon: 'icons/uptrend.png',
        bgColor: '#C3FFBF',
      },
      {
        title: 'Total Pengeluaran',
        value: `Rp. ${(combinedKpi.totalPengeluaran / 1_000_000_000).toFixed(1)} M`,
        unit: '',
        icon: 'icons/downtrend.png',
        bgColor: '#FFBFBF',
      },
    );

    return reqInfo.utils.createResponse$(() => ({
      body: kpiCards,
      status: 200,
    }));
  }

  /** Bulanan: Revenue vs Expense */
  static handleRevenueExpenseRequest(
    reqInfo: RequestInfo,
    revenueExpenseData: ChartDataItem<MonthlyData>[]
  ) {
    const filtered = this.filterByQuery(reqInfo, revenueExpenseData);
    const aggregated = this.aggregateMonthly(filtered, ['revenue', 'expense'] as const);
    return reqInfo.utils.createResponse$(() => ({ body: aggregated, status: 200 }));
  }

  /** Bulanan: Target vs Realization (after-sales) */
  static handleTargetRealizationRequest(
    reqInfo: RequestInfo,
    targetRealizationData: ChartDataItem<MonthlyTargetData>[]
  ) {
    const filtered = this.filterByQuery(reqInfo, targetRealizationData);
    const aggregated = this.aggregateMonthly(filtered, ['target', 'realization'] as const);
    return reqInfo.utils.createResponse$(() => ({ body: aggregated, status: 200 }));
  }

  /** Non-bulanan: Sales vs After Sales (ambil entry all-branch + all-category) */
  static handleSalesAfterSalesRequest(
    reqInfo: RequestInfo,
    salesAfterSalesData: ChartDataItem<MonthlySalesData>[] // tipe data sesuai dataset Anda
  ) {
    const company = reqInfo.query.get('company')?.[0];
    const result = salesAfterSalesData.find(
      (i) =>
        i.company === company &&
        i.branch === 'all-branch' &&
        i.category === 'all-category'
    )?.data ?? [];
    console.log('Sales After Sales Result:', result);
    return reqInfo.utils.createResponse$(() => ({ body: result, status: 200 }));
  }

  static handleSalesOnlyRequest(
    reqInfo: RequestInfo,
    salesData: ChartDataItem<MonthlySalesData>[]
  ) {
    const company = reqInfo.query.get('company')?.[0];
    const salesItems = salesData.filter(
      (i) => i.company === company && i.category === 'sales'
    );

    const monthlyData: { [key: string]: { month: string; salesOmzet: number; afterSalesOmzet: number } } = {};
    salesItems.forEach(item => {
      item.data.forEach(d => {
        if (!monthlyData[d.month]) {
          monthlyData[d.month] = { month: d.month, salesOmzet: 0, afterSalesOmzet: 0 };
        }
        monthlyData[d.month].salesOmzet += d.salesOmzet;
      });
    });

    const result = Object.values(monthlyData);
    return reqInfo.utils.createResponse$(() => ({ body: result, status: 200 }));
  }

  static handleAfterSalesOnlyRequest(
    reqInfo: RequestInfo,
    afterSalesData: ChartDataItem<MonthlySalesData>[]
  ) {
    const company = reqInfo.query.get('company')?.[0];
    const afterSalesItems = afterSalesData.filter(
      (i) => i.company === company && i.category === 'after-sales'
    );

    const monthlyData: { [key: string]: { month: string; salesOmzet: number; afterSalesOmzet: number } } = {};
    afterSalesItems.forEach(item => {
      item.data.forEach(d => {
        if (!monthlyData[d.month]) {
          monthlyData[d.month] = { month: d.month, salesOmzet: 0, afterSalesOmzet: 0 };
        }
        monthlyData[d.month].afterSalesOmzet += d.afterSalesOmzet;
      });
    });

    const result = Object.values(monthlyData);
    return reqInfo.utils.createResponse$(() => ({ body: result, status: 200 }));
  }


  /** Non-bulanan: Branch Performance (list cabang per company) */
  static handleBranchPerformanceRequest(
    reqInfo: RequestInfo,
    branchPerformanceData: ChartDataItem<BranchPerformanceData>[]
  ) {
    const company = reqInfo.query.get('company')?.[0];
    const result = branchPerformanceData.find((i) => i.company === company)?.data ?? [];
    return reqInfo.utils.createResponse$(() => ({ body: result, status: 200 }));
  }
}
