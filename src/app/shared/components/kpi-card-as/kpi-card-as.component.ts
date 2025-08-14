import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-kpi-card-as',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kpi-card-as.component.html',
  styleUrl: './kpi-card-as.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KpiCardAsComponent {
  @Input() title: string = '';
  @Input() headerColor: string = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  @Input() realisasi: number = 0;
  @Input() target: number = 0;
  @Input() unitEntry?: number; // For rata-rata calculation
  @Input() sisaHariKerja?: number; // For harapan target calculation
  @Input() loading: boolean = false;
  @Input() isUnit: boolean = false; // Flag untuk menentukan apakah ini unit atau currency

  // Computed properties
  get percentage(): number {
    if (this.target === 0) return 0;
    return (this.realisasi / this.target) * 100;
  }

  get clampedPercent(): number {
    return Math.min(Math.max(this.percentage, 0), 100);
  }

  get grandTotal(): number {
    return this.realisasi - this.target;
  }

  get rataRata(): number {
    if (!this.unitEntry || this.unitEntry === 0) return 0;
    return this.realisasi / this.unitEntry;
  }

  get harapanTarget(): number {
    if (!this.sisaHariKerja || this.sisaHariKerja === 0) return 0;
    return this.target / this.sisaHariKerja;
  }

  // Formatting methods
  formatCurrency(value: number): string {
    if (value === 0) return 'Rp 0';
    
    // Format dengan K, M, B untuk readability
    const abs = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    
    if (abs >= 1_000_000_000) {
      return `${sign}Rp ${(abs / 1_000_000_000).toFixed(1)}M`;
    } else if (abs >= 1_000_000) {
      return `${sign}Rp ${(abs / 1_000_000).toFixed(1)}Juta`;
    } else if (abs >= 1_000) {
      return `${sign}Rp ${(abs / 1_000).toFixed(1)}Ribu`;
    } else {
      return `${sign}Rp ${abs.toLocaleString('id-ID')}`;
    } 
  }

  formatUnit(value: number): string {
    if (value === 0) return '0 unit';
    return `${value.toLocaleString('id-ID')} unit`;
  }

  formatValue(value: number): string {
    return this.isUnit ? this.formatUnit(value) : this.formatCurrency(value);
  }

  formatPercentage(value: number): string {
    if (!isFinite(value)) return '0%';
    return `${value.toFixed(1)}%`;
  }

  // Color determination methods
  getValueColor(value: number): string {
    if (value > 0) return 'text-success';
    if (value < 0) return 'text-danger';
    return 'text-muted';
  }

  getProgressBarColor(): string {
    if (this.percentage >= 100) return 'bg-success';
    if (this.percentage >= 75) return 'bg-info';
    if (this.percentage >= 50) return 'bg-warning';
    return 'bg-danger';
  }

  getUnitSuffix(): string {
    return this.isUnit ? '' : '';
  }
}