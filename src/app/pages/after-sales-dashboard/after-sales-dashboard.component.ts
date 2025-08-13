// src/app/pages/after-sales-dashboard/after-sales-dashboard.component.ts
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterComponent } from '../../shared/components/filter/filter.component';
import { AppFilter } from '../../types/filter.model';
import { KpiCardAsComponent } from '../../shared/components/kpi-card-as/kpi-card-as.component';

@Component({
  selector: 'app-after-sales-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, FilterComponent, KpiCardAsComponent],
  templateUrl: './after-sales-dashboard.component.html',
  styleUrls: ['./after-sales-dashboard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AfterSalesDashboardComponent {

  // State management dengan Angular signals
  loading = signal(false);
  hasData = signal(false);
  error = signal<string | null>(null);
  currentFilter = signal<AppFilter | null>(null);
  // Property untuk generate options 1-31
  dayOptions: number[] = Array.from({ length: 31 }, (_, i) => i + 1);
  selectedDay = signal<number | null>(null);

  afterSalesData = {
    percentage: 33,
    realisasi: 100000000,  // Rp. 100 Juta
    target: 300000000,     // Rp. 300 Juta
    grandTotal: -306658819,
    rataRata: 2294248,
    harapanTarget: -12777451
  };
  serviceCabangData = {
    percentage: 75,
    realisasi: 225000000,  // Rp. 100 Juta
    target: 300000000,     // Rp. 300 Juta
    grandTotal: 306658819,
    rataRata: 55354435,
    harapanTarget: -1232312
  };

  // Method untuk handle selection
  onDayChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const value = target.value === '' ? null : Number(target.value);
    this.selectedDay.set(value);
  }

  onSearch(filter: AppFilter): void {

    // Reset error state
    this.error.set(null);

    // Validasi kategori filter
    if (filter.category !== 'after-sales' && filter.category !== 'all-category') {
      this.error.set('Silakan pilih kategori "After Sales" atau "Semua Kategori" untuk halaman ini');
      return;
    }

    // Set loading state
    this.loading.set(true);
    this.currentFilter.set(filter);
  }
  // Method untuk reset dashboard
  resetDashboard(): void {
    this.hasData.set(false);
    this.error.set(null);
    this.currentFilter.set(null);
    this.selectedDay.set(null);
  }

}