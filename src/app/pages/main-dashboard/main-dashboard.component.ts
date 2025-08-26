// src/app/pages/main-dashboard/main-dashboard.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { LineChartCardComponent } from '../../shared/components/line-chart-card/line-chart-card.component';
import { PieChartCardComponent } from '../../shared/components/pie-chart-card/pie-chart-card.component';
import { BarChartCardComponent } from '../../shared/components/bar-chart-card/bar-chart-card.component';
import { FilterMainDashboardComponent } from '../../shared/components/filter-main-dashboard/filter-main-dashboard.component';
import { AppFilter } from '../../types/filter.model';

interface SingleChartData {
  labels: string[];
  data: number[];
}

interface MultiChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
    borderWidth?: number;
  }>;
}

type ChartData = SingleChartData | MultiChartData;

interface TopItem {
  name: string;
  unit: number;
}

interface TopBranch {
  code: string;
  unit: number;
}

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
  ],
  templateUrl: './main-dashboard.component.html',
  styleUrl: './main-dashboard.component.css',
})
export class MainDashboardComponent implements OnInit {
  // UI state
  loading = signal(false);
  error = signal<string | null>(null);

  // KPI signals with dummy data
  kpiTotalUnitSales = signal<number>(1250);
  kpiTopModel = signal<TopItem | null>({ name: 'Tipe A', unit: 85 });
  kpiTopBranch = signal<TopBranch | null>({ code: 'Pettarani', unit: 120 });

  // After Sales KPI dummy data
  afterSalesKpi = signal<any | null>({
    totalBiayaUsaha: 150000000,
    totalProfit: 75000000,
    totalRevenueRealisasi: 225000000,
    afterSalesRealisasi: 180000000,
    unitEntryRealisasi: 450,
    sparepartTunaiRealisasi: 45000000,
    sparepartBengkelRealisasi: 38000000,
  });

  // Charts dummy data
  currYear = 2025;
  prevYear = this.currYear - 1;

  // Data tahun ini (punya kamu)
  dataTY = [85, 92, 78, 105, 118, 95, 132, 88, 110, 125, 98, 140];

  // Contoh data tahun lalu (silakan ganti sesuai sumbermu)
  dataLY = [80, 88, 74, 98, 110, 90, 120, 84, 104, 118, 93, 130];

  lineMonthly = signal<MultiChartData | null>({
    labels: [
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
    ],
    datasets: [
      {
        label: `Tahun ${this.currYear}`,
        data: this.dataTY,
        backgroundColor: 'rgba(13,110,253,0.20)', // biru transparan
        borderColor: '#0d6efd',
        borderWidth: 2,
      },
      {
        label: `Tahun ${this.prevYear}`,
        data: this.dataLY,
        backgroundColor: 'rgba(148,163,184,0.20)', // abu2 transparan
        borderColor: '#94a3b8',
        borderWidth: 1,
      },
    ],
  });

  branchPerformance = signal<ChartData | null>({
    labels: ['PETTARANI', 'PALU', 'KENDARI', 'GORONTALO', 'PALOPO'],
    data: [120, 85, 95, 70, 80],
  });

  modelDistribution = signal<ChartData | null>({
    labels: ['Tipe A', 'Tipe B', 'Tipe C', 'Tipe D', 'Tipe E', 'Tipe F'],
    data: [285, 220, 180, 165, 145, 125],
  });

  afterSalesRealisasiVsTarget = signal<MultiChartData | null>({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'],
    datasets: [
      {
        label: 'Realisasi',
        data: [18500000, 19200000, 17800000, 20100000, 21500000, 19800000],
        backgroundColor: '#5191ffff',
        borderColor: '#5191ffff',
        borderWidth: 1,
      },
      {
        label: 'Target',
        data: [20000000, 20000000, 20000000, 20000000, 20000000, 20000000],
        backgroundColor: '#000262ff',
        borderColor: '#000262ff',
        borderWidth: 1,
      },
    ],
  });

  afterSalesProfitByBranch = signal<ChartData | null>({
    labels: ['PETTARANI', 'PALU', 'KENDARI', 'GORONTALO', 'PALOPO'],
    data: [25000000, 18500000, 15200000, 12800000, 14500000],
  });

  afterSalesDistribution = signal<ChartData | null>({
    labels: ['Jasa Service', 'Part Tunai', 'Part Bengkel', 'Oli'],
    data: [85000000, 45000000, 38000000, 22000000],
  });

  prefilledFilter: AppFilter = {
    company: 'sinar-galesong-mobilindo',
    category: 'all-category',
    period: '2025',
    month: 'all-month',
  };

  // Computed
  hasData = signal(true); // Always true for dummy data
  isDataEmpty = signal(false);

  // Helper methods for template
  isSingleDataset(chart: ChartData | null): chart is SingleChartData {
    return chart !== null && 'data' in chart;
  }

  isMultiDataset(chart: ChartData | null): chart is MultiChartData {
    return chart !== null && 'datasets' in chart;
  }

  getChartData(chart: ChartData | null): number[] {
    if (this.isSingleDataset(chart)) {
      return chart.data;
    }
    return [];
  }

  getChartDatasets(chart: ChartData | null): any[] {
    if (this.isMultiDataset(chart)) {
      return chart.datasets;
    }
    return [];
  }

  // Formatter for compact numbers
  formatCompactNumber(value: number): string {
    if (value >= 1_000_000_000) {
      return `Rp ${(value / 1_000_000_000).toFixed(1)}B`;
    }
    if (value >= 1_000_000) {
      return `Rp ${(value / 1_000_000).toFixed(1)}M`;
    }
    if (value >= 1_000) {
      return `Rp ${(value / 1_000).toFixed(0)}K`;
    }
    return `Rp ${value.toLocaleString('id-ID')}`;
  }

  ngOnInit(): void {
    // No API calls needed for dummy data
    console.log('Main Dashboard loaded with dummy data');
  }

  // Mock search handler (does nothing with dummy data)
  onSearch(filter: any): void {
    console.log('Search clicked with filter:', filter);
    console.log(this.prefilledFilter);
  }
}
