// src/app/shared/components/kpi-card-as/kpi-card-as.component.ts
import { CommonModule } from '@angular/common';
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-kpi-card-as',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kpi-card-as.component.html',
  styleUrls: ['./kpi-card-as.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KpiCardAsComponent {
  @Input() title = 'AFTER SALES REALISASI vs TARGET';
  @Input() percentage: number | null = null;
  @Input() realisasi: number | null = null;
  @Input() target: number | null = null;
  @Input() grandTotal: number | null = null;
  @Input() rataRata: number | null = null;
  @Input() harapanTarget: number | null = null;
  @Input() headerColor = '#4285f4'; // Default blue color
  @Input() loading = false;

  // Format currency untuk tampilan
  formatCurrency(value: number | null): string {
    if (value === null || value === undefined) return '—';

    // Format ke Rupiah dengan pembulatan
    const absValue = Math.abs(value);
    if (absValue >= 1_000_000_000) {
      return `Rp. ${(value / 1_000_000_000).toFixed(1)}M`;
    } else if (absValue >= 1_000_000) {
      return `Rp. ${(value / 1_000_000).toFixed(1)}Jt`;
    } else if (absValue >= 1_000) {
      return `Rp. ${(value / 1_000).toFixed(0)}K`;
    }
    return `Rp. ${value.toLocaleString('id-ID')}`;
  }

  // Format number dengan tanda + atau -
  formatNumber(value: number | null): string {
    if (value === null || value === undefined) return '—';

    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toLocaleString('id-ID')}`;
  }
  // kpi-card-as.component.ts (tambahkan di dalam class)
  get clampedPercent(): number {
    const v = this.percentage ?? 0;
    return Math.max(0, Math.min(100, v));
  }


  // Get text color berdasarkan nilai positif/negatif
  getValueColor(value: number | null): string {
    if (value === null || value === undefined) return 'text-muted';
    return value >= 0 ? 'text-success' : 'text-danger';
  }

  // Format percentage
  formatPercentage(value: number | null): string {
    if (value === null || value === undefined) return '—';
    return `${value}%`;
  }
}