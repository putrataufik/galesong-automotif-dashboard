// src/app/pages/sales-dashboard/sales-dashboard.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { LineChartCardComponent } from '../../shared/components/line-chart-card/line-chart-card.component';
import { BarChartCardComponent } from '../../shared/components/bar-chart-card/bar-chart-card.component';
import { YoyProgressListComponent } from '../../shared/components/yoy-progress-list/yoy-progress-list.component';
import { FilterSalesDashboardComponent } from '../../shared/components/filter-sales-dashboard/filter-sales-dashboard.component';

import { AppFilter } from '../../types/filter.model';
import { formatCompactCurrency as fmtCurrency } from '../../shared/utils/number-format.utils';

// Types
import { ChartData, SingleChartData, MultiChartData, ModelYoY } from '../../types/charts.model';

// Dummy (sales-only)
import {
  CURR_YEAR,
  PREV_YEAR,
  DATA_TY,
  DATA_LY,
  SALES_KPI_DUMMY,
  MODEL_DISTRIBUTION_YOY,
  BRANCH_PERFORMANCE_DUMMY,
  DATA_LM,
  DATA_DO,
  DATA_SPK,
} from '../main-dashboard/dummy';

const MONTH_ABBR = [
  'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec',
] as const;

type ModelDistDummy = {
  name: string;
  curr: number;
  prevY: number;
  prevM: number;
};

// Utils
import {
  monthNameToNumber,
  stringifyUnit as stringifyUnitFn,
  getSeriesCurrent as getSeriesCurrentUtil,
  getCurrentName as getCurrentNameUtil,
  buildPrevLabels as buildPrevLabelsUtil,
} from '../../shared/utils/sales.utils';

@Component({
  selector: 'app-sales-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    KpiCardComponent,
    LineChartCardComponent,
    BarChartCardComponent,
    YoyProgressListComponent,
    FilterSalesDashboardComponent,
  ],
  templateUrl: './sales-dashboard.component.html',
  styleUrl: './sales-dashboard.component.css',
})
export class SalesDashboardComponent implements OnInit {
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
    category: 'sales',           // ← set khusus sales
    year: '2025',
    month: 'all-month',
    branch: 'all-branch',
    compare: false,
  };

  // ==== SALES KPI ====
  salesKpi = signal<any | null>(SALES_KPI_DUMMY);

  // ==== Charts (sales) ====
  currYear = CURR_YEAR;
  prevYear = PREV_YEAR;
  dataTY = DATA_TY.slice();
  dataLY = DATA_LY.slice();
  dataLM = DATA_LM.slice();

  private readonly MONTH_LABELS = Array.from({ length: 12 }, (_, i) => `${i + 1}`);
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
    const period = this.periodForCards;

    const dataTY = this.dataTY;
    const dataLY = this.dataLY;
    const dataLM = this.dataLM;

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

    const { prevM, prevY } = this.getModelDistributionPrevLabels();

    return {
      labels,
      datasets: [
        {
          label: this.getCurrentPeriodLabel(),
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
    const base: ModelDistDummy[] = [...MODEL_DISTRIBUTION_YOY];
    const compare = this.compare;
    const period = this.periodForCards;

    if (!compare) {
      return base.map(({ name, curr }) => ({
        name,
        curr,
        prevY: null,
        prevM: null,
      }));
    }

    if (!period?.month) {
      return base.map(({ name, curr, prevY }) => ({
        name,
        curr,
        prevY,
        prevM: null,
      }));
    }

    return base.map(({ name, curr, prevY, prevM }) => ({
      name,
      curr,
      prevY,
      prevM,
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

  // ==== Helpers filter/series ====
  get periodForCards(): { year: number; month?: number } | null {
    const f: any = this.currentFilter;

    const periodRaw = f?.period ?? null;
    if (typeof periodRaw === 'string' && /^\d{4}-\d{2}$/.test(periodRaw)) {
      const [yStr, mStr] = periodRaw.split('-');
      const y = Number(yStr);
      const m = Number(mStr);
      if (Number.isFinite(y) && Number.isFinite(m)) {
        return { year: y, month: m };
      }
    }

    const yearNum = Number(f?.year);
    if (!Number.isFinite(yearNum)) return null;

    const monthRaw = f?.month ?? 'all-month';
    const monthNum = monthNameToNumber(monthRaw);

    if (monthNum == null) return { year: yearNum };
    return { year: yearNum, month: monthNum };
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
      const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return `${monthNames[period.month - 1]} ${period.year}`;
    } else {
      return period.year.toString();
    }
  }

  getModelDistributionPrevLabels(): { prevY?: string; prevM?: string } {
    const period = this.periodForCards;
    if (!period) return {};

    const out: { prevY?: string; prevM?: string } = {};
    out.prevY = period.month
      ? `${MONTH_ABBR[period.month - 1]} ${period.year - 1}`
      : String(period.year - 1);

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

  getCategoryDisplayName(category: string): string {
    const categoryMap: Record<string, string> = {
      'all-category': 'Semua Kategori',
      sales: 'Sales',
      // (hapus 'after-sales')
    };
    return categoryMap[category] || category;
  }

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

  getPeriodDisplayName(): string {
    const year = this.currentFilter.year;
    const month = this.currentFilter.month;

    const monthMap: Record<string, string> = {
      'all-month': 'Semua Bulan',
      '01': 'Januari','02': 'Februari','03': 'Maret','04': 'April','05': 'Mei','06': 'Juni',
      '07': 'Juli','08': 'Agustus','09': 'September','10': 'Oktober','11': 'November','12': 'Desember',
    };

    const yearDisplay = year || 'Semua Tahun';
    const monthDisplay = monthMap[month || 'all-month'] || month;

    if (month === 'all-month' || !month) {
      return yearDisplay;
    }
    return `${monthDisplay} ${yearDisplay}`;
  }

  ngOnInit(): void {
    this.branchPerformance.set(this.buildBranchPerformance());
    this.modelDistributionYoY.set(this.buildModelDistribution());
    this.lineMonthly.set(this.buildLineMonthly());
    this.doVsSpk.set(this.buildDoVsSpk());
  }

  onSearch(filter: AppFilter): void {
    this.currentFilter = { ...filter, category: 'sales' }; // kunci ke sales
    this.branchPerformance.set(this.buildBranchPerformance());
    this.modelDistributionYoY.set(this.buildModelDistribution());
    this.lineMonthly.set(this.buildLineMonthly());
    this.doVsSpk.set(this.buildDoVsSpk());

    console.group('[Sales Dashboard] Filter applied');
    console.table(this.currentFilter);
    console.log('As JSON:', JSON.stringify(this.currentFilter, null, 2));
    console.log('Resolved periodForCards:', this.periodForCards);
    console.groupEnd();
  }

  clearFilters(): void {
    this.currentFilter = {
      company: 'sinar-galesong-mobilindo',
      category: 'sales',
      year: '2025',
      month: 'all-month',
      branch: 'all-branch',
      compare: false,
    };
  }

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
