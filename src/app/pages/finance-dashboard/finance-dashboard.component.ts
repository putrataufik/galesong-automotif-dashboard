import { Component, OnInit, signal } from '@angular/core';
import { FilterAftersalesDashboardComponent } from '../../shared/components/filter-aftersales-dashboard/filter-aftersales-dashboard.component';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { LineChartCardComponent } from '../../shared/components/line-chart-card/line-chart-card.component';
import { PieChartCardComponent } from "../../shared/components/pie-chart-card/pie-chart-card.component";
import { FinanceTransactionsTableComponent } from "../../shared/components/finance-transactions-table/finance-transactions-table.component";

@Component({
  selector: 'app-finance-dashboard',
  standalone: true,
  imports: [
    FilterAftersalesDashboardComponent,
    KpiCardComponent,
    LineChartCardComponent,
    PieChartCardComponent,
    FinanceTransactionsTableComponent
],
  templateUrl: './finance-dashboard.component.html',
  styleUrl: './finance-dashboard.component.css',
})
export class FinanceDashboardComponent implements OnInit {
  loading = signal(false);
  error = signal<string | null>(null);
  chartDatasets = signal([
    {
      label: 'Pemasukan (juta)',
      data: [120, 135, 128, 142, 150, 160, 175, 168, 172, 180, 185, 195],
      borderColor: '#0B9D00',
      backgroundColor: 'rgba(11,157,0,0.12)',
      pointBackgroundColor: '#0B9D00',
      pointBorderColor: '#0B9D00',
      fill: true,
      tension: 0.4,
      borderWidth: 3,
    },
    {
      label: 'Pengeluaran (juta)',
      data: [80, 78, 85, 90, 88, 95, 100, 98, 102, 110, 105, 112],
      borderColor: '#D00000',
      backgroundColor: 'rgba(208,0,0,0.12)',
      pointBackgroundColor: '#D00000',
      pointBorderColor: '#D00000',
      fill: true,
      tension: 0.4,
      borderWidth: 3,
    },
  ]);
  monthLabels = signal<string[]>([
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
  ]);

   // ✅ Pie chart: kontribusi pengeluaran per kategori (dalam Rupiah)
  expenseCategoryLabels = signal<string[]>([
    'Gaji Karyawan',
    'Sewa Gedung',
    'Listrik & Utilitas',
    'Marketing',
    'Maintenance',
    'Lain-lain',
  ]);
  // total = 75.000.000 (sesuai contoh KPI kamu)
  expenseCategoryData = signal<number[]>([
    30_000_000, // Gaji Karyawan
    14_000_000, // Sewa Gedung
    8_000_000,  // Listrik & Utilitas
    10_000_000, // Marketing
    7_000_000,  // Maintenance
    6_000_000,  // Lain-lain
  ]);
  ngOnInit(): void {}


}
