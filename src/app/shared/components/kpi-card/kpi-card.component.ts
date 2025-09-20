// src/app/shared/components/kpi-card/kpi-card.component.ts
import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  ChangeDetectionStrategy,
  signal,
  OnChanges,
  HostListener,
} from '@angular/core';
import { formatCompactNumber as fmtCurrency } from '../../utils/formatCurrency';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kpi-card.component.html',
  styleUrl: './kpi-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpiCardComponent implements OnChanges {
  @Input() title = 'KPI';
  @Input() value: string | number | null = null;

  @Input() subtitle?: string;

  @Input() prevYearValue: string | number | null = null;
  @Input() prevYearSubtitle?: string;
  @Input() prevYearLabel?: string;
  @Input() prevYearName?: string | number | null; 

  @Input() prevMonthValue: string | number | null = null;
  @Input() prevMonthSubtitle?: string;
  @Input() prevMonthLabel?: string; 
  @Input() prevMonthName?: string; 
  @Input() dataType: 'unit' | 'currency' | null = null;
  @Input() unitLabel: string | null = null;

  @Input() info?: string;
  @Input() loading = false;

  @Input() period?: string;

  compare = signal(false);
  @Input() set compareMode(v: boolean | null | undefined) {
    this.compare.set(!!v);
  }

  showInfo = signal(false);
  readonly formatCompactCurrency = fmtCurrency;

  ngOnChanges(): void {}

  toggleInfo(ev: MouseEvent) {
    ev.stopPropagation();
    this.showInfo.update((v) => !v);
  }
  @HostListener('document:click')
  onDocClick() {
    this.showInfo.set(false);
  }

  // ================== Numerik vs Teks ==================
  /** Hanya 'unit' & 'currency' yang dianggap numerik */
  private get isNumberCard(): boolean {
    return this.dataType === 'unit' || this.dataType === 'currency';
  }

  // ===== Number parsing / formatting =====
  private toNum(v: string | number | null): number | null {
    if (v === null || v === undefined || v === '') return null;
    if (typeof v === 'number') return Number.isFinite(v) ? v : null;

    let s = v.trim();
    if (!s) return null;

    let multiplier = 1;
    const lower = s.toLowerCase();
    if (/(rb|ribu|k)\b/.test(lower)) multiplier = 1e3;
    else if (/(Jt|juta|m)\b/.test(lower)) multiplier = 1e6;
    else if (/(M|miliar|billion)\b/.test(lower)) multiplier = 1e9;
    else if (/(T|triliun|trillion)\b/.test(lower)) multiplier = 1e12;

    s = s.replace(/[^0-9,.\-+]/g, '').replace(/\s+/g, '');

    // 🔧 Tambahkan guard ini:
    if (!s || !/\d/.test(s)) return null; // tidak ada digit → bukan angka

    const hasComma = s.includes(',');
    const hasDot = s.includes('.');
    if (hasComma && hasDot) {
      if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
        s = s.replace(/\./g, '').replace(',', '.');
      } else {
        s = s.replace(/,/g, '');
      }
    } else if (hasComma && !hasDot) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      const parts = s.split('.');
      if (parts.length > 2) s = s.replace(/\./g, '');
    }

    const n = Number(s);
    if (!Number.isFinite(n)) return null;
    return n * multiplier;
  }

  private isStringValue(v: string | number | null): boolean {
    if (v === null || v === undefined) return false;
    if (typeof v === 'number') return false;
    return this.toNum(v) === null;
  }

  // ===== Display formatter utama =====
  formatValue(v: string | number | null): string {
    if (v === null || v === undefined) return '—';

    // Jika kartu teks → tampilkan apa adanya
    if (!this.isNumberCard) return String(v);

    // Kartu numerik → format angka
    if (typeof v === 'number') {
      return this.dataType === 'currency'
        ? this.formatCompactCurrency(v)
        : v.toLocaleString('id-ID');
    }

    // v string → coba parse; gagal → tampilkan apa adanya
    const n = this.toNum(v);
    if (n === null) return v;
    return this.dataType === 'currency'
      ? this.formatCompactCurrency(n)
      : n.toLocaleString('id-ID');
  }

  formatValueWithUnit(v: string | number | null): string {
    const base = this.formatValue(v);

    // Hanya kartu numerik yang boleh menambahkan unit
    if (!this.isNumberCard || !this.unitLabel) return base;

    const n = typeof v === 'number' ? v : this.toNum(String(v));
    return n === null ? base : `${base} ${this.unitLabel}`;
  }

  // ===== Comparison (YoY/MoM) =====
  get yoy() {
    // Kartu teks → tampil netral bila ada nilai pembanding
    if (
      !this.isNumberCard ||
      this.isStringValue(this.value) ||
      this.isStringValue(this.prevYearValue)
    ) {
      return this.hasYoY ? { abs: 0, dir: 'flat' as const } : null;
    }
    const c = this.toNum(this.value);
    const p = this.toNum(this.prevYearValue);
    if (c === null || p === null) return null;
    const abs = c - p;
    const dir: 'up' | 'down' | 'flat' =
      abs > 0 ? 'up' : abs < 0 ? 'down' : 'flat';
    return { abs, dir };
  }

  get mom() {
    if (
      !this.isNumberCard ||
      this.isStringValue(this.value) ||
      this.isStringValue(this.prevMonthValue)
    ) {
      return this.hasMoM ? { abs: 0, dir: 'flat' as const } : null;
    }
    const c = this.toNum(this.value);
    const p = this.toNum(this.prevMonthValue);
    if (c === null || p === null) return null;
    const abs = c - p;
    const dir: 'up' | 'down' | 'flat' =
      abs > 0 ? 'up' : abs < 0 ? 'down' : 'flat';
    return { abs, dir };
  }

  get hasYoY(): boolean {
    return this.prevYearValue !== null && this.prevYearValue !== undefined;
  }
  get hasMoM(): boolean {
    return this.prevMonthValue !== null && this.prevMonthValue !== undefined;
  }
}
