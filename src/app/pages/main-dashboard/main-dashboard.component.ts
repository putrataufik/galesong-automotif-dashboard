// src/app/pages/main-dashboard/main-dashboard.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { LineChartCardComponent } from '../../shared/components/line-chart-card/line-chart-card.component';
import { PieChartCardComponent } from '../../shared/components/pie-chart-card/pie-chart-card.component';
import { BarChartCardComponent } from '../../shared/components/bar-chart-card/bar-chart-card.component';
import { FilterMainDashboardComponent } from '../../shared/components/filter-main-dashboard/filter-main-dashboard.component';
import { YoyProgressListComponent } from '../../shared/components/yoy-progress-list/yoy-progress-list.component';

import { AppFilter } from '../../types/filter.model';
import { formatCompactCurrency as fmtCurrency } from '../../shared/utils/number-format.utils';

// Import model chart
import {
  ChartData,
  SingleChartData,
  MultiChartData,
  ModelYoY,
} from '../../types/charts.model';

// Import dummy
import {
  CURR_YEAR,
  PREV_YEAR,
  DATA_TY,
  DATA_LY,
  SALES_KPI_DUMMY,
  AFTER_SALES_KPI_DUMMY,
  MODEL_DISTRIBUTION_YOY,
  BRANCH_PERFORMANCE_DUMMY,
  AFTERSALES_REALISASI_VS_TARGET_DUMMY,
  AFTERSALES_PROFIT_BY_BRANCH_DUMMY,
  AFTERSALES_DISTRIBUTION_DUMMY,
} from './dummy';

// Import utils
import {
  monthNameToNumber,
  stringifyUnit as stringifyUnitFn,
  getSeriesCurrent as getSeriesCurrentUtil,
  getCurrentName as getCurrentNameUtil,
  buildPrevLabels as buildPrevLabelsUtil,
} from '../../shared/utils/sales.utils';

@Component({
  selector: 'app-main-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    KpiCardComponent,
    LineChartCardComponent,
    PieChartCardComponent,
    BarChartCardComponent,
    FilterMainDashboardComponent,
    YoyProgressListComponent,
  ],
  templateUrl: './main-dashboard.component.html',
  styleUrl: './main-dashboard.component.css',
})
export class MainDashboardComponent implements OnInit {
  // ==== UI state ====
  loading = signal(false);
  error = signal<string | null>(null);
  hasData = signal(true);
  isDataEmpty = signal(false);
  readonly formatCompactCurrency = fmtCurrency;
  readonly stringifyUnit = stringifyUnitFn;

  // ==== FILTER ====
  currentFilter: AppFilter = {
    company: 'sinar-galesong-mobilindo',
    category: 'all-category',
    year: '2025',
    month: 'all-month',
    branch: 'all-branch',
    compare: false,
  };
  // ==== SALES KPI ====
  salesKpi = signal<any | null>(SALES_KPI_DUMMY);

  // ==== AFTER SALES KPI ====
  afterSalesKpi = signal<any | null>(AFTER_SALES_KPI_DUMMY);

  // ==== Charts ====
  currYear = CURR_YEAR;
  prevYear = PREV_YEAR;
  dataTY = DATA_TY.slice();
  dataLY = DATA_LY.slice();

  lineMonthly = signal<MultiChartData | null>({
    labels: [...Array(12).keys()].map((m) => `${m + 1}`),
    datasets: [
      {
        label: `Tahun ${this.currYear}`,
        data: this.dataTY,
        backgroundColor: 'rgba(13,110,253,0.20)',
        borderColor: '#0d6efd',
        borderWidth: 2,
      },
      {
        label: `Tahun ${this.prevYear}`,
        data: this.dataLY,
        backgroundColor: 'rgba(148,163,184,0.20)',
        borderColor: '#94a3b8',
        borderWidth: 1,
      },
    ],
  });

  modelDistributionYoY = signal<ModelYoY[]>([...MODEL_DISTRIBUTION_YOY]);

  branchPerformance = signal<ChartData | null>({
    labels: [...BRANCH_PERFORMANCE_DUMMY.labels],
    data: [...BRANCH_PERFORMANCE_DUMMY.data],
  });

  afterSalesRealisasiVsTarget = signal<MultiChartData | null>({
    labels: [...AFTERSALES_REALISASI_VS_TARGET_DUMMY.labels],
    datasets: [
      {
        label: 'Realisasi',
        data: [...AFTERSALES_REALISASI_VS_TARGET_DUMMY.realisasi],
        backgroundColor: '#5191ffff',
        borderColor: '#5191ffff',
        borderWidth: 1,
      },
      {
        label: 'Target',
        data: [...AFTERSALES_REALISASI_VS_TARGET_DUMMY.target],
        backgroundColor: '#000262ff',
        borderColor: '#000262ff',
        borderWidth: 1,
      },
    ],
  });

  afterSalesProfitByBranch = signal<ChartData | null>({
    labels: [...AFTERSALES_PROFIT_BY_BRANCH_DUMMY.labels],
    data: [...AFTERSALES_PROFIT_BY_BRANCH_DUMMY.data],
  });

  afterSalesDistribution = signal<ChartData | null>({
    labels: [...AFTERSALES_DISTRIBUTION_DUMMY.labels],
    data: [...AFTERSALES_DISTRIBUTION_DUMMY.data],
  });

  // ==== Helpers filter/series ====
  get periodForCards(): { year: number; month?: number } | null {
    const f: any = this.currentFilter;

    // Prioritas 1: jika period langsung ada (format "YYYY-MM")
    const periodRaw = f?.period ?? null;
    if (typeof periodRaw === 'string' && /^\d{4}-\d{2}$/.test(periodRaw)) {
      const [yStr, mStr] = periodRaw.split('-');
      const y = Number(yStr);
      const m = Number(mStr);
      if (Number.isFinite(y) && Number.isFinite(m)) {
        return { year: y, month: m };
      }
    }

    // Prioritas 2: year + month
    const yearNum = Number(f?.year);
    if (!Number.isFinite(yearNum)) return null;

    const monthRaw = f?.month ?? 'all-month';
    const monthNum = monthNameToNumber(monthRaw);

    if (monthNum == null) return { year: yearNum }; // hanya tahun
    return { year: yearNum, month: monthNum }; // tahun + bulan
  }

  getSeriesCurrent(series?: Record<string, number> | null): number | null {
    return getSeriesCurrentUtil(this.periodForCards, series);
  }
  get compare(): boolean {
    return this.currentFilter.compare ?? false;
  }
  getCurrentName(nameSeries?: Record<string, string> | null): string | null {
    return getCurrentNameUtil(this.periodForCards, nameSeries);
  }

  buildPrevLabels(
    unitsSeries?: Record<string, number> | null,
    nameSeries?: Record<string, string> | null
  ): { prevY?: string; prevM?: string } {
    return buildPrevLabelsUtil(this.periodForCards, unitsSeries, nameSeries);
  }

  getCurrentPeriodLabel(): string {
  const period = this.periodForCards;
  if (!period) return 'Current';
  
  if (period.month) {
    // Format: "Jan 2025"
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return `${monthNames[period.month - 1]} ${period.year}`;
  } else {
    // Format: "2025"
    return period.year.toString();
  }
}

/**
 * Generate labels untuk periode sebelumnya khusus model distribution
 */
getModelDistributionPrevLabels(): { prevY?: string; prevM?: string } {
  const period = this.periodForCards;
  if (!period) return {};

  const result: { prevY?: string; prevM?: string } = {};

  // Previous Year
  if (period.month) {
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    result.prevY = `${monthNames[period.month - 1]} ${period.year - 1}`;
  } else {
    result.prevY = (period.year - 1).toString();
  }

  // Previous Month (only if current period has month)
  if (period.month) {
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    let prevMonth = period.month - 1;
    let prevYear = period.year;
    
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear = period.year - 1;
    }
    
    result.prevM = `${monthNames[prevMonth - 1]} ${prevYear}`;
  }

  return result;
}

  isSingleDataset(chart: ChartData | null): chart is SingleChartData {
    return chart !== null && 'data' in chart;
  }
  getChartData(chart: ChartData | null): number[] {
    if (this.isSingleDataset(chart)) return chart.data;
    return [];
  }

  ngOnInit(): void {}

  getCompanyDisplayName(company: string): string {
    const companyMap: Record<string, string> = {
      'sinar-galesong-mobilindo': 'Sinar Galesong Mobilindo',
      'pt-galesong-otomotif': 'PT Galesong Otomotif',
      'all-company': 'Semua Perusahaan'
    };
    return companyMap[company] || company;
  }

  /**
   * Get display name for category filter
   */
  getCategoryDisplayName(category: string): string {
    const categoryMap: Record<string, string> = {
      'all-category': 'Semua Kategori',
      'sales': 'Sales',
      'after-sales': 'After Sales'
    };
    return categoryMap[category] || category;
  }

  /**
   * Get display name for branch filter
   */
  getBranchDisplayName(branch: string): string {
    const branchMap: Record<string, string> = {
      'all-branch': 'Semua Cabang',
      'pettarani': 'Pettarani',
      'palopo': 'Palopo',
      'kendari': 'Kendari',
      'palu': 'Palu',
      'manado': 'Manado'
    };
    return branchMap[branch] || branch;
  }

  /**
   * Get display name for period (year + month)
   */
  getPeriodDisplayName(): string {
    const year = this.currentFilter.year;
    const month = this.currentFilter.month;

    const monthMap: Record<string, string> = {
      'all-month': 'Semua Bulan',
      '01': 'Januari',
      '02': 'Februari',
      '03': 'Maret',
      '04': 'April',
      '05': 'Mei',
      '06': 'Juni',
      '07': 'Juli',
      '08': 'Agustus',
      '09': 'September',
      '10': 'Oktober',
      '11': 'November',
      '12': 'Desember'
    };

    const yearDisplay = year || 'Semua Tahun';
    const monthDisplay = monthMap[month || 'all-month'] || month;

    if (month === 'all-month' || !month) {
      return yearDisplay;
    }

    return `${monthDisplay} ${yearDisplay}`;
  }

  /**
   * Override the onSearch method to include timestamp
   */
  onSearch(filter: AppFilter): void {
    this.currentFilter = { ...filter };
  
    
    // ---- DEBUG LOGS ----
    console.group('[Dashboard] Filter applied');
    console.table(filter);
    console.log('As JSON:', JSON.stringify(filter, null, 2));
    console.log('Resolved periodForCards:', this.periodForCards);
    console.groupEnd();
  }

  /**
   * Clear all filters (optional method for reset functionality)
   */
  clearFilters(): void {
    this.currentFilter = {
      company: 'sinar-galesong-mobilindo',
      category: 'all-category',
      year: '2025',
      month: 'all-month',
      branch: 'all-branch',
      compare: false,
    };
  }

  /**
   * Get filter summary for display
   */
  getFilterSummary(): string {
    const parts: string[] = [];
    
    if (this.currentFilter.category !== 'all-category') {
      parts.push(this.getCategoryDisplayName(this.currentFilter.category));
    }
    
    if (this.currentFilter.branch !== 'all-branch') {
      parts.push(this.getBranchDisplayName(this.currentFilter.branch));
    }
    
    parts.push(this.getPeriodDisplayName());
    
    return parts.join(' • ');
  }
}
