// src/app/shared/mock/in-memory-data.service.ts
import { Injectable } from '@angular/core';
import { InMemoryDbService, RequestInfo } from 'angular-in-memory-web-api';
import { COMPANIES, CATEGORIES } from './master-data';
import { DataGenerators } from './data-generators';
import { RequestHandlers } from './request-handlers';
import {
  KpiDataItem,
  ChartDataItem,
  MonthlyData,
  MonthlyTargetData,
  MonthlySalesData,
  BranchPerformanceData,
} from './interfaces';

@Injectable({
  providedIn: 'root',
})
export class InMemoryDataService implements InMemoryDbService {
  private kpiData: KpiDataItem[] = [];

  // ✅ Beri type argument untuk generic ChartDataItem<TData>
  private revenueExpenseData: ChartDataItem<MonthlyData>[] = [];
  private targetRealizationData: ChartDataItem<MonthlyTargetData>[] = [];
  private salesAfterSalesData: ChartDataItem<MonthlySalesData>[] = [];
  private branchPerformanceData: ChartDataItem<BranchPerformanceData>[] = [];

  private salesOnlyData: ChartDataItem<MonthlySalesData>[] = [];
  private afterSalesOnlyData: ChartDataItem<MonthlySalesData>[] = [];

  constructor() {
    this.generateAllData();
  }

  createDb() {
    return {
      kpi: this.kpiData,
      revenueExpense: this.revenueExpenseData,
      targetRealization: this.targetRealizationData,
      salesAfterSales: this.salesAfterSalesData,
      branchPerformance: this.branchPerformanceData,
      salesOnly: this.salesOnlyData,
      afterSalesOnly: this.afterSalesOnlyData,
    };
  }

  private generateAllData() {
    this.generateKpiData();
    this.generateChartData();
  }

  private generateKpiData() {
    COMPANIES.forEach((comp) => {
      comp.branches.forEach((branch) => {
        CATEGORIES.forEach((cat) => {
          this.kpiData.push({
            company: comp.company,
            branch: branch,
            category: cat,
            kpis: DataGenerators.generateKpi(cat, branch),
          });
        });
      });
    });
  }

  private generateChartData() {
    // Revenue vs Expense (bulanan) untuk semua kombinasi
    COMPANIES.forEach((comp) => {
      comp.branches.forEach((branch) => {
        (['sales', 'after-sales', 'all-category'] as const).forEach((category) => {
          this.revenueExpenseData.push({
            company: comp.company,
            branch,
            category,
            // Pastikan fungsi generator mengembalikan MonthlyData[]
            data: DataGenerators.generateRevenueExpenseData(
              comp.company,
              branch,
              category
            ) as MonthlyData[],
          });
        });
      });
    });

    // Sales vs After Sales (non-agregasi per bulan tapi tetap bentuk bulanan sesuai interface Anda)
    COMPANIES.forEach((comp) => {
      this.salesAfterSalesData.push({
        company: comp.company,
        branch: 'all-branch',
        category: 'all-category',
        // Pastikan fungsi generator mengembalikan MonthlySalesData[]
        data: DataGenerators.generateSalesAfterSalesData(
          comp.company,
          'all-branch'
        ) as MonthlySalesData[],
      });
    });
    // Line Chart Sales Only
    COMPANIES.forEach((comp) => {
      comp.branches.forEach((branch) => {
        this.salesOnlyData.push({
          company: comp.company,
          branch: branch,
          category: 'sales',
          data: DataGenerators.generateSalesAfterSalesData(comp.company, branch)
            .map(item => ({ month: item.month, salesOmzet: item.salesOmzet, afterSalesOmzet: 0 })),
        });
      });
    });
    //Line Chart after-sales only
    COMPANIES.forEach((comp) => {
      comp.branches.forEach((branch) => {
        this.afterSalesOnlyData.push({
          company: comp.company,
          branch: branch,
          category: 'after-sales',
          data: DataGenerators.generateSalesAfterSalesData(comp.company, branch)
            .map(item => ({ month: item.month, salesOmzet: 0, afterSalesOmzet: item.afterSalesOmzet })),
        });
      });
    });

    // Branch Performance (non-bulanan, list per cabang)
    COMPANIES.forEach((comp) => {
      this.branchPerformanceData.push({
        company: comp.company,
        branch: 'all-branch',
        category: 'all-category',
        // Pastikan fungsi generator mengembalikan BranchPerformanceData[]
        data: DataGenerators.generateBranchPerformanceData(
          comp.company
        ) as BranchPerformanceData[],
      });
    });

    // Target vs Realization (bulanan, khusus after-sales)
    COMPANIES.forEach((comp) => {
      comp.branches.forEach((branch) => {
        this.targetRealizationData.push({
          company: comp.company,
          branch,
          category: 'after-sales',
          // Pastikan fungsi generator mengembalikan MonthlyTargetData[]
          data: DataGenerators.generateTargetRealizationData(
            comp.company,
            branch
          ) as MonthlyTargetData[],
        });
      });
    });
  }

  get(reqInfo: RequestInfo) {
    switch (reqInfo.collectionName) {
      case 'kpi':
        return RequestHandlers.handleKpiRequest(reqInfo, this.kpiData);

      case 'revenueExpense':
        return RequestHandlers.handleRevenueExpenseRequest(
          reqInfo,
          this.revenueExpenseData
        );

      case 'targetRealization':
        return RequestHandlers.handleTargetRealizationRequest(
          reqInfo,
          this.targetRealizationData
        );

      case 'salesAfterSales':
        return RequestHandlers.handleSalesAfterSalesRequest(
          reqInfo,
          this.salesAfterSalesData
        );

      case 'salesOnly':
        return RequestHandlers.handleSalesOnlyRequest(
          reqInfo,
          this.salesOnlyData
        );
      case 'afterSalesOnly':
        return RequestHandlers.handleAfterSalesOnlyRequest(
          reqInfo,
          this.afterSalesOnlyData
        )

      case 'branchPerformance':
        return RequestHandlers.handleBranchPerformanceRequest(
          reqInfo,
          this.branchPerformanceData
        );

      default:
        return undefined;
    }
  }
}
