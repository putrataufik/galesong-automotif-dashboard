import { Component, OnInit, inject, signal } from '@angular/core';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { FilterComponent } from '../../shared/components/filter/filter.component';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardStateService } from '../../core/state/dashboard-state.service';
import { forkJoin } from 'rxjs';
import { LineChartCardComponent } from '../../shared/components/line-chart-card/line-chart-card.component';

export interface AppFilter {
  company: string;
  category: 'all-category' | 'sales' | 'after-sales';
  period: string; // contoh: "2025"
}
const MONTH_LABELS = [
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
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [KpiCardComponent, FilterComponent, LineChartCardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  private api = inject(DashboardService);
  private state = inject(DashboardStateService);

  loading = signal(false);

  // KPI signals
  kpiTotalUnitSales = signal<number>(0);
  kpiTopModel = signal<{ name: string; unit: number } | null>(null);
  kpiTopBranch = signal<{ code: string; unit: number } | null>(null);

  // Line Chart Signals
  lineMonthly = signal<{ labels: string[]; data: number[] } | null>(null);
  unitProportion = this.state.unitProportion;
  branchPerformance = this.state.branchPerformance;

  // Untuk prefill FilterComponent
  prefilledFilter: AppFilter | null = null;

  ngOnInit() {
    const savedFilter = this.state.getFilter();
    if (savedFilter) {
      this.prefilledFilter = savedFilter;
    }

    const savedLine = this.state.getLineMonthly();
    if (savedLine) {
      this.lineMonthly.set(savedLine);
    }

    const savedKpi = this.state.getKpi();
    if (this.state.hasKpi()) {
      this.kpiTotalUnitSales.set(savedKpi.totalUnitSales ?? 0);
      this.kpiTopModel.set(savedKpi.topModel);
      this.kpiTopBranch.set(savedKpi.topBranch);
    }

    const savedDonut = this.state.getUnitProportion();
    if (savedDonut) {
      this.unitProportion.set(savedDonut);
    }

    const savedBar = this.state.getBranchPerformance();
    if (savedBar) {
      this.branchPerformance.set(savedBar);
    }
  }

  onSearch(filter: AppFilter) {
    const useSalesApi =
      filter.category === 'sales' || filter.category === 'all-category';

    // Simpan filter ke state (agar persist)
    this.state.saveFilter(filter);
    this.prefilledFilter = filter;

    // Reset KPI sebelum load data baru
    this.kpiTotalUnitSales.set(0);
    this.kpiTopModel.set(null);
    this.kpiTopBranch.set(null);

    if (!useSalesApi) {
      // TODO: Implementasi kategori after-sales saat API tersedia
      return;
    }

    this.loading.set(true);

    forkJoin({
      monthly: this.api.getSalesMonthly(filter.company, filter.period),
      units: this.api.getSalesUnits(filter.company, filter.period),
      branch: this.api.getSalesBranch(filter.company, filter.period),
    }).subscribe({
      next: ({ monthly, units, branch }) => {
        // === LINE CHART ===
        const sortedMonths = (monthly?.sales ?? [])
          .slice()
          .sort((a, b) => Number(a.month) - Number(b.month));

        const labels = sortedMonths.map((m) => {
          const idx = Math.max(1, Math.min(12, Number(m.month))) - 1;
          return MONTH_LABELS[idx];
        });

        const lineData = sortedMonths.map((m) => Number(m.unit_sold));
        const lineChart = { labels, data: lineData };
        this.lineMonthly.set(lineChart);
        this.state.saveLineMonthly(lineChart); // ← Simpan ke state

        // === KPI: Total Unit Sales ===
        const totalUnit = (units?.sales ?? [])
          .map((u) => Number(u.unit_sold))
          .reduce((a, b) => a + b, 0);
        this.kpiTotalUnitSales.set(totalUnit);

        // === KPI: Model Favorit ===
        const topModel = (units?.sales ?? []).reduce(
          (acc, cur) =>
            Number(cur.unit_sold) > acc.unit
              ? { name: cur.unit_name, unit: Number(cur.unit_sold) }
              : acc,
          { name: '', unit: -1 }
        );
        const topModelFinal = topModel.unit >= 0 ? topModel : null;
        this.kpiTopModel.set(topModelFinal);

        // === KPI: Cabang Penjualan Tertinggi ===
        const topBranch = (branch?.sales ?? []).reduce(
          (acc, cur) =>
            Number(cur.unit_sold) > acc.unit
              ? { code: cur.branch, unit: Number(cur.unit_sold) }
              : acc,
          { code: '', unit: -1 }
        );
        const topBranchFinal =
          topBranch.unit >= 0
            ? {
                code: this.api.getCabangName(topBranch.code),
                unit: topBranch.unit,
              }
            : null;
        this.kpiTopBranch.set(topBranchFinal);

        // === Persist KPI ke state ===
        this.state.saveKpi({
          totalUnitSales: totalUnit,
          topModel: topModelFinal,
          topBranch: topBranchFinal,
        });

        // === DONUT CHART: Proporsi Model Unit Terjual ===
        const unitChart = {
          labels: units?.sales?.map((u) => u.unit_name) ?? [],
          data: units?.sales?.map((u) => Number(u.unit_sold)) ?? [],
        };
        this.unitProportion.set(unitChart);
        this.state.saveUnitProportion(unitChart);

        // === BAR CHART: Performa Cabang ===
        const cabangMap = this.api.getCabangNameMap();
        const branchChart = {
          labels:
            branch?.sales?.map((b) => cabangMap[b.branch] || b.branch) ?? [],
          data: branch?.sales?.map((b) => Number(b.unit_sold)) ?? [],
        };
        this.branchPerformance.set(branchChart);
        this.state.saveBranchPerformance(branchChart);
      },
      error: () => {
        // TODO: tampilkan error alert ke user
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }
}
