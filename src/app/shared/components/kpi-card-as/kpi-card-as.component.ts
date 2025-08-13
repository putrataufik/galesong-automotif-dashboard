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
  @Input() headerColor = '#4285f4';
  @Input() loading = false;
  @Input() isRupiah = true; // ← NEW: Flag untuk menentukan format currency atau unit

  // ✅ FIXED: Format currency untuk tampilan dengan type checking
  formatCurrency(value: number | null): string {
    if (value === null || value === undefined) return '—';

    if (this.isRupiah) {
      // Format as currency
      const absValue = Math.abs(value);
      if (absValue >= 1_000_000_000) {
        return `Rp. ${(value / 1_000_000_000).toFixed(1)}M`;
      } else if (absValue >= 1_000_000) {
        return `Rp. ${(value / 1_000_000).toFixed(1)}Jt`;
      } else if (absValue >= 1_000) {
        return `Rp. ${(value / 1_000).toFixed(0)}K`;
      }
      return `Rp. ${value.toLocaleString('id-ID')}`;
    } else {
      // Format as unit (number only)
      return value.toLocaleString('id-ID');
    }
  }

  // ✅ FIXED: Format number dengan tanda + atau - (hanya untuk number values)
  formatNumber(value: number | null): string {
    if (value === null || value === undefined) return '—';
    
    const sign = value >= 0 ? '+' : '';
    if (this.isRupiah) {
      return `${sign}${this.formatCurrency(Math.abs(value))}`;
    } else {
      return `${sign}${value.toLocaleString('id-ID')} unit`;
    }
  }

  // Clamp percentage
  get clampedPercent(): number {
    const v = this.percentage ?? 0;
    return Math.max(0, Math.min(100, v));
  }

  // ✅ FIXED: Get text color berdasarkan nilai positif/negatif (untuk number values)
  getValueColor(value: number | null): string {
    if (value === null || value === undefined) return 'text-muted';
    return value >= 0 ? 'text-success' : 'text-danger';
  }

  // Format percentage
  formatPercentage(value: number | null): string {
    if (value === null || value === undefined) return '—';
    return `${value}%`;
  }

  // ✅ NEW: Format unit suffix
  getUnitSuffix(): string {
    return this.isRupiah ? '' : ' unit';
  }
}