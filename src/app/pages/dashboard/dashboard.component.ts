import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { DashboardService } from '../../core/services/dashboard.service';
import { FilterParams } from '../../core/models/dashboard.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, KpiCardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  // ===== DEPENDENCY INJECTION =====
  private readonly dashboardService = inject(DashboardService);

  // ===== PUBLIC SIGNALS (for template) =====
  readonly kpiData = this.dashboardService.kpiData;
  readonly isLoading = this.dashboardService.isLoading;
  readonly hasData = this.dashboardService.hasData;
  readonly error = this.dashboardService.error;
  readonly cacheStatus = this.dashboardService.cacheStatus;
  readonly filterOptions = this.dashboardService.filterOptions;

  // Local, writable signal for the filter form
  readonly activeFilter = signal<FilterParams>({
    companyId: 'COMP001',
    branchId: 'ALL',
    category: 'ALL',
    year: 2025
  });

  // ===== LIFECYCLE HOOKS =====
  ngOnInit(): void {
    console.log('🏠 DashboardComponent initialized');
    this.activeFilter.set(this.dashboardService.currentFilter());
    this.loadData();
  }

  // ===== PUBLIC METHODS =====

  /**
   * Load dashboard data using the service.
   * This respects the cache by default.
   */
  loadData(): void {
    this.dashboardService.getDashboardData(this.activeFilter()).subscribe({
      next: () => console.log('📊 Dashboard data loaded or retrieved from cache'),
      error: (error) => console.error('❌ Failed to load dashboard:', error)
    });
  }

  /**
   * Apply the current filter selection and force a data refresh.
   */
  applyFilter(): void {
    console.log('🔍 Applying filter:', this.activeFilter());
    this.dashboardService.applyFilter(this.activeFilter()).subscribe({
        next: () => console.log('✅ Filter applied and data refreshed'),
        error: (err) => console.error('❌ Failed to apply filter:', err)
    });
  }
  
  /**
   * NEW: Updates a specific filter property in the signal and then applies the filter.
   * This is the correct way to handle state changes for signals from the template.
   */
  updateFilter<K extends keyof FilterParams>(key: K, value: FilterParams[K]): void {
    this.activeFilter.update(current => ({ ...current, [key]: value }));
    this.applyFilter();
  }

  /**
   * Retry loading data after an error.
   */
  retryLoad(): void {
    console.log('🔁 Retrying to load data');
    this.dashboardService.refreshData().subscribe({
        next: () => console.log('✅ Data reloaded successfully'),
        error: (err) => console.error('❌ Failed to reload data:', err)
    });
  }
}
