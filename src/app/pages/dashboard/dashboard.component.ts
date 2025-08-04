import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { FilterComponent } from '../../shared/components/filter/filter.component';
import { DashboardService } from '../../shared/services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, KpiCardComponent, FilterComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  kpiData: any[] = [];
  chartData: any[] = [];
  loading = false;

  constructor(
    private dashboardService: DashboardService,
    @Inject(PLATFORM_ID) private platformId: object // <-- Inject platform
  ) {}

  ngOnInit() {
    // Hanya jalan di browser
    if (isPlatformBrowser(this.platformId)) {
      const savedFilter = localStorage.getItem('dashboardFilter');

      if (savedFilter) {
        const filter = JSON.parse(savedFilter);

        // Ambil data dari cache atau API dengan filter terakhir
        this.dashboardService.getKpiData(filter, false).subscribe((data) => {
          if (data && data.length > 0) {
            this.kpiData = data;
          }
        });

        // Untuk chart (nanti kita aktifkan lagi kalau endpoint ada)
        // this.dashboardService.getChartData(filter, false).subscribe((data) => {
        //   if (data && data.length > 0) {
        //     this.chartData = data;
        //   }
        // });
      }
    }
  }

  onSearch(filters: any) {
    this.loading = true;

    this.dashboardService.getKpiData(filters, true).subscribe({
      next: (data) => {
        console.log('KPI Data:', data);
        this.kpiData = data;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });

    // Untuk chart (nanti)
    this.dashboardService.getChartData(filters, true).subscribe({
      next: (data) => {
        this.chartData = data;
      },
    });
  }
}
