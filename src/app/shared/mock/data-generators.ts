// src/app/shared/mock/data-generators.ts
import { BranchPerformanceData, MonthlyData, MonthlySalesData, MonthlyTargetData } from './interfaces';
import { COMPANIES } from './master-data';

export class DataGenerators {
  private static months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  static generateKpi(category: string, branch: string) {
    const rand = (min: number, max: number) =>
      Math.floor(Math.random() * (max - min + 1)) + min;

    return {
      totalSales: category === 'sales' ? rand(100, 2000) : 0,
      totalAfterSales: category === 'after-sales' ? rand(50, 1000) : 0,
      totalPendapatan: rand(5, 40) * 1_000_000_000,
      totalPengeluaran: rand(2, 20) * 1_000_000_000,
      topSalesBranch: category === 'sales' ? branch : '',
      topAfterSalesBranch: category === 'after-sales' ? branch : '',
      totalOmzetSales: category === 'sales' ? rand(2, 20) * 1_000_000_000 : 0,
      totalOmzetAfterSales: category === 'after-sales' ? rand(2, 10) * 1_000_000_000 : 0,
    };
  }

  static generateRevenueExpenseData(company: string, branch: string, category: string): MonthlyData[] {
    return this.months.map(month => ({
      month,
      revenue: this.randomRevenue(company, branch, category),
      expense: this.randomExpense(company, branch, category)
    }));
  }

  static generateTargetRealizationData(company: string, branch: string): MonthlyTargetData[] {
    return this.months.map(month => ({
      month,
      target: this.randomTarget(company, branch),
      realization: this.randomRealization(company, branch)
    }));
  }
  

  private static randomRevenue(company: string, branch: string, category: string): number {
    const baseRevenue = company.includes('mandiri') ? 15_000_000_000 : 
                       company.includes('prima') ? 12_000_000_000 :
                       company.includes('automobil') ? 8_000_000_000 : 10_000_000_000;
    
    const categoryMultiplier = category === 'sales' ? 1.5 : 
                              category === 'after-sales' ? 0.8 : 1.2;
    
    const randomFactor = 0.7 + Math.random() * 0.6; // 70% - 130%
    
    return Math.floor(baseRevenue * categoryMultiplier * randomFactor);
  }

  private static randomExpense(company: string, branch: string, category: string): number {
    const baseExpense = company.includes('mandiri') ? 8_000_000_000 : 
                       company.includes('prima') ? 7_000_000_000 :
                       company.includes('automobil') ? 5_000_000_000 : 6_000_000_000;
    
    const categoryMultiplier = category === 'sales' ? 1.2 : 
                              category === 'after-sales' ? 0.9 : 1.05;
    
    const randomFactor = 0.8 + Math.random() * 0.4; // 80% - 120%
    
    return Math.floor(baseExpense * categoryMultiplier * randomFactor);
  }

  private static randomTarget(company: string, branch: string): number {
    const baseTarget = company.includes('mandiri') ? 180 : 
                      company.includes('prima') ? 150 :
                      company.includes('automobil') ? 120 : 160;
    
    const randomFactor = 0.8 + Math.random() * 0.4; // 80% - 120%
    
    return Math.floor(baseTarget * randomFactor);
  }

  private static randomRealization(company: string, branch: string): number {
    const target = this.randomTarget(company, branch);
    const achievementRate = 0.7 + Math.random() * 0.5; // 70% - 120%
    
    return Math.floor(target * achievementRate);
  }

  static generateSalesAfterSalesData(company: string, branch: string): MonthlySalesData[] {
  return this.months.map(month => ({
    month,
    salesOmzet: this.randomSalesOmzet(company, branch),
    afterSalesOmzet: this.randomAfterSalesOmzet(company, branch)
  }));
}

static generateBranchPerformanceData(company: string): BranchPerformanceData[] {
  const companyData = COMPANIES.find(c => c.company === company);
  if (!companyData) return [];

  return companyData.branches.map((branch, index) => ({
    branchName: this.formatBranchName(branch),
    totalOmzet: this.randomBranchOmzet(company, branch),
    rank: index + 1
  }));
}

private static randomSalesOmzet(company: string, branch: string): number {
  const base = company.includes('mandiri') ? 12_000_000_000 : 8_000_000_000;
  return Math.floor(base * (0.8 + Math.random() * 0.4));
}

private static randomAfterSalesOmzet(company: string, branch: string): number {
  const base = company.includes('mandiri') ? 6_000_000_000 : 4_000_000_000;
  return Math.floor(base * (0.7 + Math.random() * 0.6));
}

private static randomBranchOmzet(company: string, branch: string): number {
  const base = company.includes('mandiri') ? 20_000_000_000 : 15_000_000_000;
  return Math.floor(base * (0.6 + Math.random() * 0.8));
}

private static formatBranchName(branch: string): string {
  return branch.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}
}

