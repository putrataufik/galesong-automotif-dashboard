import {
  Component,
  Input,
  ChangeDetectionStrategy,
  HostListener,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { formatCompactNumber } from '../../utils/dashboard-aftersales-kpi.utils';

let __kpiCardAsUid = 0;

@Component({
  selector: 'app-kpi-card-as',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kpi-card-as.component.html',
  styleUrl: './kpi-card-as.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpiCardAsComponent {
  @Input() title: string = '';
  @Input() headerColor: string =
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  @Input() realisasi: number = 0;
  @Input() target: number = 0;
  @Input() unitEntry?: number; // For rata-rata calculation
  @Input() sisaHariKerja?: number; // For harapan target calculation
  @Input() loading: boolean = false;
  @Input() isUnit: boolean = false; // Flag: unit atau currency
  @Input() isHarapanTarget: boolean = false;
  @Input() mekanik?: number;

  /** State popover */
  showInfo = false;
   formatCompactNumber = formatCompactNumber;
  /** ID unik untuk ARIA */
  componentId = `kpi-as-${++__kpiCardAsUid}`;

  constructor(private cdr: ChangeDetectorRef) {}

  // --- Derived values ---
  get percentage(): number {
    if (!this.target) return 0;
    return (this.realisasi / this.target) * 100;
  }

  get clampedPercent(): number {
    return Math.min(Math.max(this.percentage, 0), 100);
  }

  get grandTotal(): number {
    return this.realisasi - this.target;
  }

  get rataRata(): number {
    // Denominator tergantung isUnit:
    // - isUnit true  -> mekanik
    // - isUnit false -> unitEntry
    const denom = this.isUnit ? this.mekanik ?? 0 : this.unitEntry ?? 0;
    if (!denom) return 0;
    return this.realisasi / denom;
  }

  // TAMPILKAN hanya bila flag true & sisa hari > 0
  get showHarapanTarget(): boolean {
    return this.isHarapanTarget && (this.sisaHariKerja ?? 0) > 0;
  }

  // Kebutuhan per hari untuk mengejar target (tidak boleh negatif)
  get harapanTarget(): number {
    const sisa = this.sisaHariKerja ?? 0;
    if (sisa <= 0) return 0;
    const gap = (this.target ?? 0) - (this.realisasi ?? 0);
    return Math.max(0, gap / sisa);
  }


  formatUnit(value: number): string {
    if (value === 0) return '0 unit';
    return `${value.toLocaleString('id-ID')} Unit`;
  }

  /** Format khusus untuk baris "Rata - Rata" */
  formatRataRataDisplay(value: number): string {
    const v = isFinite(value) ? value : 0;
    return this.isUnit
      ? `${v.toLocaleString('id-ID', {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })} unit / mekanik`
      : `${this.formatCompactNumber(v)} / unit`;
  }

  formatValue(value: number): string {
    return this.isUnit ? this.formatUnit(value) : this.formatCompactNumber(value);
  }

  formatPercentage(value: number): string {
    if (!isFinite(value)) return '0%';
    return `${value.toFixed(1)}%`;
  }

  // --- UI helpers ---
  getValueColor(value: number): string {
    if (value > 0) return 'text-success';
    if (value < 0) return 'text-danger';
    return 'text-muted';
  }

  getProgressBarStyle(): { [k: string]: string } {
    const p = Math.max(
      0,
      Math.min(100, Number(this.clampedPercent ?? this.percentage) || 0)
    );
    const color =
      p >= 100
        ? '#00A00D'
        : p >= 75
        ? '#0048A0'
        : p >= 50
        ? '#DA8001'
        : '#D00000';
    return { backgroundColor: color };
  }

  getUnitSuffix(): string {
    return '';
  }

  // --- Popover handlers ---
  toggleInfo(evt: MouseEvent) {
    evt.stopPropagation();
    this.showInfo = !this.showInfo;
    this.cdr.markForCheck();
  }

  /** Tutup saat klik di luar */
  @HostListener('document:click')
  onDocumentClick() {
    if (this.showInfo) {
      this.showInfo = false;
      this.cdr.markForCheck();
    }
  }

  /** Tutup saat tekan Escape */
  @HostListener('document:keydown.escape')
  onEsc() {
    if (this.showInfo) {
      this.showInfo = false;
      this.cdr.markForCheck();
    }
  }
}
