import { Injectable, signal } from '@angular/core';
import type { AppFilter } from '../../pages/dashboard/dashboard.component';

export interface KpiSnapshot {
  totalUnitSales: number | null;
  topModel: { name: string; unit: number } | null;
  topBranch: { code: string; unit: number } | null;
}

@Injectable({ providedIn: 'root' })
export class DashboardStateService {
  // Filter & KPI yang dipertahankan selama SPA session
  readonly filter = signal<AppFilter | null>(null);
  readonly totalUnitSales = signal<number | null>(null);
  readonly topModel = signal<{ name: string; unit: number } | null>(null);
  readonly topBranch = signal<{ code: string; unit: number } | null>(null);

  saveFilter(f: AppFilter) {
    this.filter.set(f);
  }

  getFilter(): AppFilter | null {
    return this.filter();
  }

  saveKpi(snapshot: KpiSnapshot) {
    this.totalUnitSales.set(snapshot.totalUnitSales);
    this.topModel.set(snapshot.topModel);
    this.topBranch.set(snapshot.topBranch);
  }

  hasKpi(): boolean {
    return (
      this.totalUnitSales() !== null ||
      this.topModel() !== null ||
      this.topBranch() !== null
    );
  }

  getKpi(): KpiSnapshot {
    return {
      totalUnitSales: this.totalUnitSales(),
      topModel: this.topModel(),
      topBranch: this.topBranch(),
    };
  }

  clear() {
    this.filter.set(null);
    this.totalUnitSales.set(null);
    this.topModel.set(null);
    this.topBranch.set(null);
  }
}