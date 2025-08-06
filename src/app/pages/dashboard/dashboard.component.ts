import { Component, OnInit, inject, signal } from '@angular/core';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { FilterComponent } from '../../shared/components/filter/filter.component';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardStateService } from '../../core/state/dashboard-state.service';
import { forkJoin } from 'rxjs';

export interface AppFilter {
  company: string;
  category: 'all-category' | 'sales' | 'after-sales';
  period: string; // contoh: "2025"
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [KpiCardComponent, FilterComponent],
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

  // Untuk prefill FilterComponent
  prefilledFilter: AppFilter | null = null;

  ngOnInit(): void {
    const savedFilter = this.state.getFilter();
    if (savedFilter) {
      this.prefilledFilter = savedFilter;
      if (this.state.hasKpi()) {
        const snap = this.state.getKpi();
        this.kpiTotalUnitSales.set(snap.totalUnitSales ?? 0);
        this.kpiTopModel.set(snap.topModel);
        this.kpiTopBranch.set(snap.topBranch);
      }
    }
  }

  onSearch(filter: AppFilter) {
    const useSalesApi =
      filter.category === 'sales' || filter.category === 'all-category';

    // Simpan filter ke state segera (agar persist walau API gagal)
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
      next: ({ units, branch }) => {
        // KPI: Total Unit Sales
        const totalUnit = (units?.sales ?? [])
          .map((u) => Number(u.unit_sold))
          .reduce((a, b) => a + b, 0);
        this.kpiTotalUnitSales.set(totalUnit);

        // KPI: Model Favorit
        const topModel = (units?.sales ?? []).reduce(
          (acc, cur) =>
            Number(cur.unit_sold) > acc.unit
              ? { name: cur.unit_name, unit: Number(cur.unit_sold) }
              : acc,
          { name: '', unit: -1 }
        );
        const topModelFinal = topModel.unit >= 0 ? topModel : null;
        this.kpiTopModel.set(topModelFinal);

        // KPI: Cabang Penjualan Tertinggi (pakai mapping dari service)
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

        // Persist KPI ke state
        this.state.saveKpi({
          totalUnitSales: totalUnit,
          topModel: topModelFinal,
          topBranch: topBranchFinal,
        });
      },
      error: () => {
        // TODO: tampilkan toast/alert error ke user
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }
}
