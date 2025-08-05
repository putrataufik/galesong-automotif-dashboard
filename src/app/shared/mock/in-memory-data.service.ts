// src/app/shared/mock/in-memory-data.service.ts
import { Injectable } from '@angular/core';
import { InMemoryDbService, RequestInfo } from 'angular-in-memory-web-api';
import { COMPANIES, CATEGORIES } from './master-data';
import { DataGenerators } from './data-generators';
import { RequestHandlers } from './request-handlers';
import { KpiDataItem, ChartDataItem } from './interfaces';

@Injectable({
  providedIn: 'root',
})
export class InMemoryDataService implements InMemoryDbService {
  private kpiData: KpiDataItem[] = [];
  private revenueExpenseData: ChartDataItem[] = [];
  private targetRealizationData: ChartDataItem[] = [];
  private salesAfterSalesData: ChartDataItem[] = [];
  private branchPerformanceData: any[] = [];

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
    // Generate Revenue vs Expense data for all combinations
    COMPANIES.forEach((comp) => {
      comp.branches.forEach((branch) => {
        ['sales', 'after-sales', 'all-category'].forEach((category) => {
          this.revenueExpenseData.push({
            company: comp.company,
            branch: branch,
            category: category,
            data: DataGenerators.generateRevenueExpenseData(
              comp.company,
              branch,
              category
            ),
          });
        });
      });
    });

    COMPANIES.forEach((comp) => {
      this.salesAfterSalesData.push({
        company: comp.company,
        branch: 'all-branch',
        category: 'all-category',
        data: DataGenerators.generateSalesAfterSalesData(
          comp.company,
          'all-branch'
        ),
      });
    });

    // Generate Branch Performance data (only for all-branch)
    COMPANIES.forEach((comp) => {
      this.branchPerformanceData.push({
        company: comp.company,
        branch: 'all-branch',
        category: 'all-category',
        data: DataGenerators.generateBranchPerformanceData(comp.company),
      });
    });

    // Generate Target vs Realization data (only for after-sales)
    COMPANIES.forEach((comp) => {
      comp.branches.forEach((branch) => {
        this.targetRealizationData.push({
          company: comp.company,
          branch: branch,
          category: 'after-sales',
          data: DataGenerators.generateTargetRealizationData(
            comp.company,
            branch
          ),
        });
      });
    });
  }

  get(reqInfo: RequestInfo) {
    console.log('=== IN-MEMORY API REQUEST ===');
    console.log('Collection:', reqInfo.collectionName);
    console.log('Query params:', reqInfo.query);
    console.log('URL:', reqInfo.url);
    console.log('Available collections:', Object.keys(this.createDb()));

    switch (reqInfo.collectionName) {
      case 'kpi':
        console.log('Handling KPI request...');
        return RequestHandlers.handleKpiRequest(reqInfo, this.kpiData);

      case 'revenueExpense':
        console.log('Handling Revenue Expense request...');
        console.log(
          'Revenue Expense Data count:',
          this.revenueExpenseData.length
        );
        return RequestHandlers.handleRevenueExpenseRequest(
          reqInfo,
          this.revenueExpenseData
        );

      case 'targetRealization':
        console.log('Handling Target Realization request...');
        console.log(
          'Target Realization Data count:',
          this.targetRealizationData.length
        );
        return RequestHandlers.handleTargetRealizationRequest(
          reqInfo,
          this.targetRealizationData
        );
      case 'salesAfterSales':
        console.log('Handling Sales After Sales request...');
        return RequestHandlers.handleSalesAfterSalesRequest(
          reqInfo,
          this.salesAfterSalesData
        );

      case 'branchPerformance':
        console.log('Handling Branch Performance request...');
        return RequestHandlers.handleBranchPerformanceRequest(
          reqInfo,
          this.branchPerformanceData
        );

      default:
        console.warn('Unknown collection:', reqInfo.collectionName);
        console.log(
          'Expected collections: kpi, revenueExpense, targetRealization'
        );
        return undefined;
    }
  }
}
