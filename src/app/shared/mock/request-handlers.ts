// src/app/shared/mock/request-handlers.ts
import { RequestInfo } from 'angular-in-memory-web-api';
import {
  KpiCard,
  KpiDataItem,
  ChartDataItem,
  MonthlyData,
  MonthlyTargetData,
} from './interfaces';

export class RequestHandlers {
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

    // Gabungkan data KPI
    const combinedKpi = {
      totalSales: data.reduce((sum, d) => sum + d.kpis.totalSales, 0),
      totalAfterSales: data.reduce((sum, d) => sum + d.kpis.totalAfterSales, 0),
      totalPendapatan: data.reduce((sum, d) => sum + d.kpis.totalPendapatan, 0),
      totalPengeluaran: data.reduce(
        (sum, d) => sum + d.kpis.totalPengeluaran,
        0
      ),
      topSalesBranch:
        data.find((d) => d.kpis.topSalesBranch)?.kpis.topSalesBranch || '',
      topAfterSalesBranch:
        data.find((d) => d.kpis.topAfterSalesBranch)?.kpis
          .topAfterSalesBranch || '',
      totalOmzetSales: data.reduce((sum, d) => sum + d.kpis.totalOmzetSales, 0),
      totalOmzetAfterSales: data.reduce(
        (sum, d) => sum + d.kpis.totalOmzetAfterSales,
        0
      ),
    };

    // Buat array KPI Cards sesuai filter
    const kpiCards: KpiCard[] = [];

    if (category !== 'after-sales') {
      kpiCards.push({
        title: 'Total Sales',
        value: combinedKpi.totalSales,
        unit: 'unit',
        icon: 'icons/car.png',
        bgColor: '#BFE8FF',
      });
      kpiCards.push({
        title: 'Total Omzet Sales',
        value: `Rp. ${(combinedKpi.totalOmzetSales / 1_000_000_000).toFixed(
          1
        )} M`,
        unit: '',
        icon: 'icons/increase.png',
        bgColor: '#C3FFBF',
      });
    }

    if (category !== 'sales') {
      kpiCards.push({
        title: 'Total After Sales',
        value: combinedKpi.totalAfterSales,
        unit: '',
        icon: 'icons/wrench.png',
        bgColor: '#BFD1FF',
      });
      kpiCards.push({
        title: 'Total Omzet After Sales',
        value: `Rp. ${(
          combinedKpi.totalOmzetAfterSales / 1_000_000_000
        ).toFixed(1)} M`,
        unit: '',
        icon: 'icons/increase.png',
        bgColor: '#C3FFBF',
      });
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

    // KPI umum (Pendapatan & Pengeluaran)
    kpiCards.push({
      title: 'Total Pendapatan',
      value: `Rp. ${(combinedKpi.totalPendapatan / 1_000_000_000).toFixed(
        1
      )} M`,
      unit: '',
      icon: 'icons/uptrend.png',
      bgColor: '#C3FFBF',
    });
    kpiCards.push({
      title: 'Total Pengeluaran',
      value: `Rp. ${(combinedKpi.totalPengeluaran / 1_000_000_000).toFixed(
        1
      )} M`,
      unit: '',
      icon: 'icons/downtrend.png',
      bgColor: '#FFBFBF',
    });

    return reqInfo.utils.createResponse$(() => ({
      body: kpiCards,
      status: 200,
    }));
  }

  static handleRevenueExpenseRequest(
    reqInfo: RequestInfo,
    revenueExpenseData: ChartDataItem[]
  ) {
    console.log('=== REVENUE EXPENSE HANDLER ===');
    const company = reqInfo.query.get('company')?.[0];
    const branch = reqInfo.query.get('branch')?.[0];
    const category = reqInfo.query.get('category')?.[0];

    console.log('Filter params:', { company, branch, category });
    console.log('Total revenue expense data:', revenueExpenseData.length);

    let filteredData = revenueExpenseData.filter(
      (item) => item.company === company
    );
    console.log('After company filter:', filteredData.length);

    if (branch && branch !== 'all-branch') {
      filteredData = filteredData.filter((item) => item.branch === branch);
      console.log('After branch filter:', filteredData.length);
    }

    // Filter by category
    if (category && category !== 'all-category') {
      filteredData = filteredData.filter((item) => item.category === category);
      console.log('After category filter (specific):', filteredData.length);
    } else {
      // If all-category, use the all-category data
      filteredData = filteredData.filter(
        (item) => item.category === 'all-category'
      );
      console.log('After category filter (all-category):', filteredData.length);
    }

    // Aggregate data if multiple branches
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'Mei',
      'Jun',
      'Jul',
      'Agu',
      'Sep',
      'Okt',
      'Nov',
      'Des',
    ];
    const aggregatedData: MonthlyData[] = months.map((month) => {
      const monthData = filteredData
        .map((item) => item.data as MonthlyData[])
        .flat()
        .filter((data) => data.month === month);

      return {
        month,
        revenue: monthData.reduce((sum, data) => sum + data.revenue, 0),
        expense: monthData.reduce((sum, data) => sum + data.expense, 0),
      };
    });

    console.log('Final aggregated data:', aggregatedData);

    return reqInfo.utils.createResponse$(() => ({
      body: aggregatedData,
      status: 200,
    }));
  }

  static handleTargetRealizationRequest(
    reqInfo: RequestInfo,
    targetRealizationData: ChartDataItem[]
  ) {
    console.log('=== TARGET REALIZATION HANDLER ===');
    const company = reqInfo.query.get('company')?.[0];
    const branch = reqInfo.query.get('branch')?.[0];

    console.log('Filter params:', { company, branch });
    console.log('Total target realization data:', targetRealizationData.length);

    let filteredData = targetRealizationData.filter(
      (item) => item.company === company
    );
    console.log('After company filter:', filteredData.length);

    if (branch && branch !== 'all-branch') {
      filteredData = filteredData.filter((item) => item.branch === branch);
      console.log('After branch filter:', filteredData.length);
    }

    // Aggregate data if multiple branches
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'Mei',
      'Jun',
      'Jul',
      'Agu',
      'Sep',
      'Okt',
      'Nov',
      'Des',
    ];
    const aggregatedData: MonthlyTargetData[] = months.map((month) => {
      const monthData = filteredData
        .map((item) => item.data as MonthlyTargetData[])
        .flat()
        .filter((data) => data.month === month);

      return {
        month,
        target: monthData.reduce((sum, data) => sum + data.target, 0),
        realization: monthData.reduce((sum, data) => sum + data.realization, 0),
      };
    });

    console.log('Final aggregated data:', aggregatedData);

    return reqInfo.utils.createResponse$(() => ({
      body: aggregatedData,
      status: 200,
    }));
  }

  static handleSalesAfterSalesRequest(
    reqInfo: RequestInfo,
    salesAfterSalesData: ChartDataItem[]
  ) {
    const company = reqInfo.query.get('company')?.[0];

    const filteredData = salesAfterSalesData.filter(
      (item) =>
        item.company === company &&
        item.branch === 'all-branch' &&
        item.category === 'all-category'
    );

    const result = filteredData.length > 0 ? filteredData[0].data : [];

    return reqInfo.utils.createResponse$(() => ({
      body: result,
      status: 200,
    }));
  }

  static handleBranchPerformanceRequest(
    reqInfo: RequestInfo,
    branchPerformanceData: any[]
  ) {
    const company = reqInfo.query.get('company')?.[0];

    const filteredData = branchPerformanceData.filter(
      (item) => item.company === company
    );

    const result = filteredData.length > 0 ? filteredData[0].data : [];

    return reqInfo.utils.createResponse$(() => ({
      body: result,
      status: 200,
    }));
  }
}
