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
    const harapanTarget = (this.realisasi-this.target) / this.sisaHariKerja;
    if (harapanTarget > 0){
      return 0;
    }else{
      return harapanTarget;
    }
  }

  // Formatting methods
  formatCurrency(value: number): string {
    if (value === 0) return 'Rp 0';
    
    const abs = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    
    if (abs >= 1_000_000_000) {
      return `${sign}Rp ${(abs / 1_000_000_000).toFixed(3)}M`;
    } else if (abs >= 1_000_000) {
      return `${sign}Rp ${(abs / 1_000_000).toFixed(3)}Juta`;
    } else if (abs >= 1_000) {
      return `${sign}Rp ${(abs / 1_000).toFixed(3)}Ribu`;
    } else {
      return `${sign}Rp ${abs.toLocaleString('id-ID', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`;
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

  getProgressBarStyle(): {[k: string]: string} {
    const p = Math.max(0, Math.min(100, Number(this.clampedPercent ?? this.percentage) || 0));
    const color =
      p >= 100 ? '#00A00D' :
      p >= 75  ? '#0048A0' :
      p >= 50  ? '#DA8001' :
                 '#D00000';
    return { backgroundColor: color };
  }
  

  getUnitSuffix(): string {
    return this.isUnit ? '' : '';
  }
}