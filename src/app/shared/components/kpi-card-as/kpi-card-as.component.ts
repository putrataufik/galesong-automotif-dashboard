// src/app/shared/components/kpi-card-as/kpi-card-as.component.ts
import {
  Component,
  Input,
  ChangeDetectionStrategy,
  HostListener,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { formatCompactNumber } from '../../utils/formatCurrency';
import { TooltipDirective } from '../../directive/tooltip.directive';

let __kpiCardAsUid = 0;

@Component({
  selector: 'app-kpi-card-as',
  standalone: true,
  imports: [CommonModule, TooltipDirective],
  templateUrl: './kpi-card-as.component.html',
  styleUrl: './kpi-card-as.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpiCardAsComponent {
  // ===== Main (selected period) =====
  @Input() title: string = '';
  @Input() headerProgress: string = '';
  @Input() headerColor: string =
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  @Input() realisasi: number = 0;
  @Input() target: number = 0;

  /** Untuk perhitungan rata-rata:
   *  - isUnit=false (uang): denom = unitEntry
   *  - isUnit=true  (unit): denom = mekanik */
  @Input() unitEntry?: number;
  @Input() mekanik?: number;

  /** Harapan target (gap / sisa hari) */
  @Input() sisaHariKerja?: number;
  @Input() isHarapanTarget: boolean = false;

  /** Mode tampilan */
  @Input() isUnit: boolean = false; // true = unit; false = currency
  @Input() loading: boolean = false;

  /** Compare toggle */
  @Input() compare: boolean = false;

  // ===== Compare - Prev Month =====
  @Input() prevMPeriod: string = ''; // contoh: "2025 Jul"
  @Input() prevMRealisasi: number = 0;
  @Input() prevMTarget: number = 0;
  /** Opsional override denom rata-rata di prevM. Jika tidak ada, pakai mekanik/unitEntry utama */
  @Input() prevMDenomForAvg?: number;

  // ===== Compare - Prev Year =====
  @Input() prevYPeriod: string = ''; // contoh: "2024 Aug"
  @Input() prevYRealisasi: number = 0;
  @Input() prevYTarget: number = 0;
  @Input() prevYDenomForAvg?: number;

  /** State & utils */
  showInfo = false;
  formatCompactNumber = formatCompactNumber;
  componentId = `kpi-as-${++__kpiCardAsUid}`;

  constructor(private cdr: ChangeDetectorRef) {}

  // ===== Derived (selected) =====
  get percentage(): number {
    if (!this.target) return 0;
    return (this.realisasi / this.target) * 100;
  }
  get clampedPercent(): number {
    return Math.min(Math.max(this.percentage, 0), 100);
  }
  get grandTotal(): number {
    return (this.realisasi ?? 0) - (this.target ?? 0);
  }
  get rataRata(): number {
    const denom = this.isUnit ? this.mekanik ?? 0 : this.unitEntry ?? 0;
    if (!denom) return 0;
    return (this.realisasi ?? 0) / denom;
  }
  get showHarapanTarget(): boolean {
    return this.isHarapanTarget && (this.sisaHariKerja ?? 0) > 0;
  }
  get harapanTarget(): number {
    const sisa = this.sisaHariKerja ?? 0;
    if (sisa <= 0) return 0;
    const gap = (this.target ?? 0) - (this.realisasi ?? 0);
    return Math.max(0, gap / sisa);
  }

  // ===== Formatters =====
  formatUnit(value: number): string {
    if (!value) return '0 Unit';
    return `${value.toLocaleString('id-ID')} Unit`;
  }
  formatRataRataDisplay(value: number): string {
    const v = Number.isFinite(value) ? value : 0;
    const n = Math.round(v);
    const safe = Object.is(n, -0) ? 0 : n; // hindari "-0"

    return this.isUnit
      ? `${safe.toLocaleString('id-ID')} unit / mekanik`
      : `${this.formatCompactNumber(safe)} / unit`;
  }

  formatValue(value: number): string {
    return this.isUnit
      ? this.formatUnit(value)
      : this.formatCompactNumber(value);
  }
  formatPercentage(value: number): string {
    if (!Number.isFinite(value)) return '0%';
    const v = Math.max(value, 0); // ← tidak ada Math.min(..., 100)
    return `${v.toFixed(1)}%`;
  }

  // ===== UI helpers =====
  getValueColor(value: number): string {
    if (value > 0) return 'text-success';
    if (value < 0) return 'text-danger';
    return 'text-muted';
  }
  getProgressBarStyle(): { [k: string]: string } {
    return this.getProgressBarStyleForPercent(this.clampedPercent);
  }
  getProgressBarStyleForPercent(p: number): { [k: string]: string } {
    const percent = Math.max(0, Math.min(100, Number(p) || 0));
    const color =
      percent >= 100
        ? '#00A00D'
        : percent >= 75
        ? '#0048A0'
        : percent >= 50
        ? '#DA8001'
        : '#D00000';
    return { backgroundColor: color };
  }
  getUnitSuffix(): string {
    return '';
  }

  // ===== Compare helpers =====
  private defaultDenom(): number {
    return this.isUnit ? this.mekanik ?? 0 : this.unitEntry ?? 0;
  }

  // Prev Month
  get prevMPercentage(): number {
    return this.prevMTarget
      ? (this.prevMRealisasi / this.prevMTarget) * 100
      : 0;
  }
  get prevMDeviation(): number {
    return (this.prevMRealisasi ?? 0) - (this.prevMTarget ?? 0);
  }
  get prevMRataRata(): number {
    const denom = this.prevMDenomForAvg ?? 0;
    if (!denom) return 0;
    return (this.prevMRealisasi ?? 0) / denom;
  }

  // Prev Year
  get prevYPercentage(): number {
    return this.prevYTarget
      ? (this.prevYRealisasi / this.prevYTarget) * 100
      : 0;
  }
  get prevYDeviation(): number {
    return (this.prevYRealisasi ?? 0) - (this.prevYTarget ?? 0);
  }
  get prevYRataRata(): number {
    const denom = this.prevYDenomForAvg ?? 0;
    if (!denom) return 0;
    return (this.prevYRealisasi ?? 0) / denom;
  }

  // ===== Popover =====
  toggleInfo(evt: MouseEvent) {
    evt.stopPropagation();
    this.showInfo = !this.showInfo;
    this.cdr.markForCheck();
  }
  @HostListener('document:click')
  onDocumentClick() {
    if (this.showInfo) {
      this.showInfo = false;
      this.cdr.markForCheck();
    }
  }
  @HostListener('document:keydown.escape')
  onEsc() {
    if (this.showInfo) {
      this.showInfo = false;
      this.cdr.markForCheck();
    }
  }

  // ======== TOOLTIP TEXTS ========
  get titleTooltip(): string {
    return `${
      this.title
    }\nRingkasan performa periode berjalan. Lihat progress, deviasi dari target, rata-rata per ${
      this.isUnit ? 'mekanik' : 'unit'
    }, dan estimasi kebutuhan harian (Harapan Target).`;
  }

  get progressTooltip(): string {
    const pct = this.formatPercentage(this.percentage);
    return `Progress ${pct}\nRealisasi dibanding Target.\n${this.formatValue(
      this.realisasi
    )} tercapai dari ${this.formatValue(this.target)}.`;
  }

  get deviationTooltip(): string {
    const dev = this.grandTotal;
    const arah = dev >= 0 ? 'di atas' : 'di bawah';
    return `Deviasi Target: ${this.formatValue(
      dev
    )}\nSelisih Realisasi terhadap Target (positif = ${arah} target).`;
  }

  get rataRataTooltip(): string {
    const basis = this.isUnit ? 'mekanik' : 'unit';
    return `Rata-rata: ${this.formatRataRataDisplay(
      this.rataRata
    )}\nRealisasi dibagi jumlah ${basis} (indikasi produktivitas).`;
  }

  get harapanTooltip(): string {
    if (!this.showHarapanTarget) {
      return 'Harapan Target ditampilkan saat mode aktif & masih ada sisa hari kerja.';
    }
    const sisa = this.sisaHariKerja ?? 0;
    return `Harapan Target: ${this.formatValue(
      this.harapanTarget
    )}${this.getUnitSuffix()} / hari\nKebutuhan rata-rata per hari selama ${sisa} hari kerja tersisa agar target tercapai.`;
  }

  // Compare blocks
  getPrevMProgressTip(): string {
    const pct = this.formatPercentage(this.prevMPercentage);
    return `${this.prevMPeriod}\nProgress ${pct} = ${this.formatValue(
      this.prevMRealisasi
    )} / ${this.formatValue(this.prevMTarget)}.`;
  }
  getPrevMDeviationTip(): string {
    return `${this.prevMPeriod}\nDeviasi: ${this.formatValue(
      this.prevMDeviation
    )} (Realisasi - Target).`;
  }
  getPrevMRataTip(): string {
    const basis = this.isUnit ? 'mekanik' : 'unit';
    return `${this.prevMPeriod}\nRata-rata: ${this.formatRataRataDisplay(
      this.prevMRataRata
    )} (dibagi ${basis}).`;
  }

  getPrevYProgressTip(): string {
    const pct = this.formatPercentage(this.prevYPercentage);
    return `${this.prevYPeriod}\nProgress ${pct} = ${this.formatValue(
      this.prevYRealisasi
    )} / ${this.formatValue(this.prevYTarget)}.`;
  }
  getPrevYDeviationTip(): string {
    return `${this.prevYPeriod}\nDeviasi: ${this.formatValue(
      this.prevYDeviation
    )} (Realisasi - Target).`;
  }
  getPrevYRataTip(): string {
    const basis = this.isUnit ? 'mekanik' : 'unit';
    return `${this.prevYPeriod}\nRata-rata: ${this.formatRataRataDisplay(
      this.prevYRataRata
    )} (dibagi ${basis}).`;
  }
}
