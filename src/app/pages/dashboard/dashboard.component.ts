import { Component, OnInit } from '@angular/core';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { FilterComponent } from '../../shared/components/filter/filter.component';
import { DashboardService } from '../../shared/services/dashboard.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, KpiCardComponent, FilterComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  kpiData: any[] = [];
  chartData: any[] = [];
  loading = false;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit() {
    // Restore cache kalau ada
    this.dashboardService.getKpiData({}, false).subscribe((data) => {
      if (data && data.length > 0) {
        this.kpiData = data;
      }
    });

    this.dashboardService.getChartData({}, false).subscribe((data) => {
      if (data && data.length > 0) {
        this.chartData = data;
      }
    });
  }

  onSearch(filters: any) {
    this.loading = true;

    this.dashboardService.getKpiData(filters, true).subscribe({
      next: (data) => {
        this.kpiData = data;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });

    this.dashboardService.getChartData(filters, true).subscribe({
      next: (data) => {
        this.chartData = data;
      },
    });
  }
}
