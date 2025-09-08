// src/app/pages/main-dashboard/main-dashboard.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { LineChartCardComponent } from '../../shared/components/line-chart-card/line-chart-card.component';
import { PieChartCardComponent } from '../../shared/components/pie-chart-card/pie-chart-card.component';
import { BarChartCardComponent } from '../../shared/components/bar-chart-card/bar-chart-card.component';
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
  DATA_LM,
  DATA_DO,
  DATA_SPK,
} from './dummy';

// Import utils
import {
  monthNameToNumber,
  stringifyUnit as stringifyUnitFn,
  getSeriesCurrent as getSeriesCurrentUtil,
  getCurrentName as getCurrentNameUtil,
  buildPrevLabels as buildPrevLabelsUtil,
} from '../../shared/utils/sales.utils';
import { FilterMainDashboardComponent } from '../../shared/components/filter-main-dashboard/filter-main-dashboard.component';
const MONTH_ABBR = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

type ModelDistDummy = {
  name: string;
  curr: number;
  prevY: number;
  prevM: number;
};

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
    FilterMainDashboardComponent,
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
  dataLM = DATA_LM.slice();
  private readonly MONTH_LABELS = Array.from(
    { length: 12 },
    (_, i) => `${i + 1}`
  );
  lineMonthly = signal<MultiChartData | undefined>(undefined);
  private readonly LINE_COLORS = {
    currBg: 'rgba(13,110,253,0.20)',
    currBorder: '#0d6efd',
    prevYBg: 'rgba(148,163,184,0.20)',
    prevYBorder: '#94a3b8',
    prevMBg: 'rgba(0, 192, 32, 0.47)',
    prevMBorder: '#00d800ff',
  };

  private buildLineMonthly(): MultiChartData {
    const labels = this.MONTH_LABELS;
    const compare = this.compare;
    const period = this.periodForCards; // { year, month? }

    const dataTY = this.dataTY; // 12 angka tahun ini
    const dataLY = this.dataLY; // 12 angka tahun lalu
    const dataLM = this.dataLM; // 12 angka bulan lalu (LY shifted)

    // === compare = false → 1 dataset: Curr (12 bulan) ===
    if (!compare) {
      return {
        labels,
        datasets: [
          {
            label: `Tahun ${this.currYear}`,
            data: dataTY,
            backgroundColor: this.LINE_COLORS.currBg,
            borderColor: this.LINE_COLORS.currBorder,
            borderWidth: 2,
          },
        ],
      };
    }

    // === compare = true & all-month → 2 dataset: Curr vs Prev Y (dua-duanya 12 bulan) ===
    if (!period?.month) {
      return {
        labels,
        datasets: [
          {
            label: `Tahun ${this.currYear}`,
            data: dataTY,
            backgroundColor: this.LINE_COLORS.currBg,
            borderColor: this.LINE_COLORS.currBorder,
            borderWidth: 2,
          },
          {
            label: `Tahun ${this.prevYear}`,
            data: dataLY,
            backgroundColor: this.LINE_COLORS.prevYBg,
            borderColor: this.LINE_COLORS.prevYBorder,
            borderWidth: 1,
          },
        ],
      };
    }
    const { prevM, prevY } = this.getModelDistributionPrevLabels(); // untuk label

    return {
      labels,
      datasets: [
        {
          label: this.getCurrentPeriodLabel(), // ex: "Sep 2025"
          data: dataTY,
          backgroundColor: this.LINE_COLORS.currBg,
          borderColor: this.LINE_COLORS.currBorder,
          borderWidth: 2,
        },
        {
          label: prevM ?? 'Bulan Lalu',
          data: dataLY,
          backgroundColor: this.LINE_COLORS.prevMBg,
          borderColor: this.LINE_COLORS.prevMBorder,
          borderWidth: 1,
        },
        {
          label: prevY ?? 'Tahun Lalu',
          data: dataLM,
          backgroundColor: this.LINE_COLORS.prevYBg,
          borderColor: this.LINE_COLORS.prevYBorder,
          borderWidth: 1,
        },
      ],
    };
  }

  doVsSpk = signal<MultiChartData | undefined>(undefined);
  private readonly doVsSpk_COLORS = {
    currBg: 'rgba(48, 222, 60, 1)',
    currBorder: '#00cb0eff',
    prevYBg: 'rgba(57, 60, 238, 1)',
    prevYBorder: '#0d6efd',
  };

  dataDo = DATA_DO.slice();
  dataSpk = DATA_SPK.slice();
  private buildDoVsSpk(): MultiChartData {
    const labels = this.MONTH_LABELS;

    const dataDo = this.dataDo;
    const dataSpk = this.dataSpk;

    // === compare = true & all-month → 2 dataset: Curr vs Prev Y (dua-duanya 12 bulan) ===

    return {
      labels,
      datasets: [
        {
          label: `Delivery Order`,
          data: dataDo,
          backgroundColor: this.doVsSpk_COLORS.currBg,
          borderColor: this.doVsSpk_COLORS.currBorder,
          borderWidth: 2,
        },
        {
          label: `Surat Pemesanan Kendaraan`,
          data: dataSpk,
          backgroundColor: this.doVsSpk_COLORS.prevYBg,
          borderColor: this.doVsSpk_COLORS.prevYBorder,
          borderWidth: 2,
        },
      ],
    };
  }

  distributionModel = signal<ModelYoY[]>([...MODEL_DISTRIBUTION_YOY]);
  modelDistributionYoY = signal<ModelYoY[]>([]);

  /** Builder dinamis untuk model distribution sesuai filter */
  private buildModelDistribution(): ModelYoY[] {
    // sumber dasar dari dummy
    const base: ModelDistDummy[] = [...MODEL_DISTRIBUTION_YOY];

    const compare = this.compare;
    const period = this.periodForCards; // { year, month? }

    // 1) compare = false → hanya curr
    if (!compare) {
      return base.map(({ name, curr }) => ({
        name,
        curr,
        prevY: null,
        prevM: null,
      }));
    }

    // 2) compare = true & all-month → curr + prevY
    if (!period?.month) {
      return base.map(({ name, curr, prevY }) => ({
        name,
        curr,
        prevY,
        prevM: null,
      }));
    }

    // 3) compare = true & bulan spesifik → curr + prevM + prevY
    return base.map(({ name, curr, prevY, prevM }) => ({
      name,
      curr,
      prevY, // YoY
      prevM, // MoM
    }));
  }
  branchPerformance = signal<ChartData | null>(null);
  private buildBranchPerformance(): ChartData {
    const labels = BRANCH_PERFORMANCE_DUMMY.map((b) => b.branch);

    const currLabel = this.getCurrentPeriodLabel();
    const { prevM, prevY } = this.getModelDistributionPrevLabels();

    const dataCurr = BRANCH_PERFORMANCE_DUMMY.map((b) => b.curr);
    const dataPrevM = BRANCH_PERFORMANCE_DUMMY.map((b) => b.prevM);
    const dataPrevY = BRANCH_PERFORMANCE_DUMMY.map((b) => b.prevY);

    if (!this.compare) {
      return {
        labels,
        datasets: [
          {
            label: currLabel || 'Periode',
            data: dataCurr,
            backgroundColor: 'rgba(13,110,253)',
            borderColor: '#0d6efd',
            borderWidth: 1,
          },
        ],
      };
    }

    const period = this.periodForCards;

    if (!period?.month) {
      // compare = true & all-month -> 2 dataset (Curr vs Prev Y)
      return {
        labels,
        datasets: [
          {
            label: currLabel || 'Tahun Ini',
            data: dataCurr,
            backgroundColor: 'rgba(13,110,253)',
            borderColor: '#0d6efd',
            borderWidth: 1,
          },
          {
            label: prevY || 'Tahun Lalu',
            data: dataPrevY,
            backgroundColor: 'rgba(148,163,184)',
            borderColor: '#94a3b8',
            borderWidth: 1,
          },
        ],
      };
    }

    // compare = true & bulan spesifik -> 3 dataset (Curr, Prev M, Prev Y)
    return {
      labels,
      datasets: [
        {
          label: currLabel || 'Periode',
          data: dataCurr,
          backgroundColor: 'rgba(13,110,253)',
          borderColor: '#0d6efd',
          borderWidth: 1,
        },
        {
          label: prevM || 'Bulan Lalu',
          data: dataPrevM,
          backgroundColor: 'rgba(0,23,87)',
          borderColor: '#001757ff',
          borderWidth: 1,
        },
        {
          label: prevY || 'Tahun Lalu',
          data: dataPrevY,
          backgroundColor: 'rgba(148,163,184)',
          borderColor: '#94a3b8',
          borderWidth: 1,
        },
      ],
    };
  }

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
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
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

    const out: { prevY?: string; prevM?: string } = {};

    // Prev Y: jika ada bulan → "Mon YYYY-1", kalau tidak → "YYYY-1"
    out.prevY = period.month
      ? `${MONTH_ABBR[period.month - 1]} ${period.year - 1}`
      : String(period.year - 1);

    // Prev M: hanya jika period.month ada
    if (period.month) {
      let pm = period.month - 1;
      let py = period.year;
      if (pm === 0) {
        pm = 12;
        py = period.year - 1;
      }
      out.prevM = `${MONTH_ABBR[pm - 1]} ${py}`;
    }

    return out;
  }

  isSingleDataset(chart: ChartData | null): chart is SingleChartData {
    return chart !== null && 'data' in chart;
  }
  getChartData(chart: ChartData | null): number[] {
    if (this.isSingleDataset(chart)) return chart.data;
    return [];
  }

  getCompanyDisplayName(company: string): string {
    const companyMap: Record<string, string> = {
      'sinar-galesong-mobilindo': 'Sinar Galesong Mobilindo',
      'pt-galesong-otomotif': 'PT Galesong Otomotif',
      'all-company': 'Semua Perusahaan',
    };
    return companyMap[company] || company;
  }

  /**
   * Get display name for category filter
   */
  getCategoryDisplayName(category: string): string {
    const categoryMap: Record<string, string> = {
      'all-category': 'Semua Kategori',
      sales: 'Sales',
      'after-sales': 'After Sales',
    };
    return categoryMap[category] || category;
  }

  /**
   * Get display name for branch filter
   */
  getBranchDisplayName(branch: string): string {
    const branchMap: Record<string, string> = {
      'all-branch': 'Semua Cabang',
      pettarani: 'Pettarani',
      palopo: 'Palopo',
      kendari: 'Kendari',
      palu: 'Palu',
      manado: 'Manado',
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
      '12': 'Desember',
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
  ngOnInit(): void {
    this.branchPerformance.set(this.buildBranchPerformance());
    this.modelDistributionYoY.set(this.buildModelDistribution());
    this.lineMonthly.set(this.buildLineMonthly());
    this.doVsSpk.set(this.buildDoVsSpk());
  }
  onSearch(filter: AppFilter): void {
    this.currentFilter = { ...filter };
    // rebuild semua dependent state
    this.branchPerformance.set(this.buildBranchPerformance());
    this.modelDistributionYoY.set(this.buildModelDistribution());
    this.lineMonthly.set(this.buildLineMonthly());
    this.doVsSpk.set(this.buildDoVsSpk());
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
