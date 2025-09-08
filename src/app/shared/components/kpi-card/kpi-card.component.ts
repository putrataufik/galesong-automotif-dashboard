import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  ChangeDetectionStrategy,
  signal,
  OnChanges,
  HostListener,
} from '@angular/core';
import { formatCompactCurrency as fmtCurrency } from '../../utils/number-format.utils';

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

  /** Subtitle untuk nilai utama (ditampilkan di sebelah value: contoh "Tipe A (56)") */
  @Input() subtitle?: string;

  /** Nilai pembanding + subtitle/label */
  @Input() prevYearValue: string | number | null = null;
  @Input() prevYearSubtitle?: string;         // e.g. "Agu 2024 (YoY)" atau "2024 (YoY)"
  @Input() prevYearLabel?: string;            // e.g. "Tipe B – 88 unit"

  @Input() prevMonthValue: string | number | null = null;
  @Input() prevMonthSubtitle?: string;        // e.g. "Jul 2025 (MoM)"
  @Input() prevMonthLabel?: string;           // e.g. "Tipe C – 92 unit"

  /** Jenis data utama: 'unit' atau 'currency' (untuk format compact currency) */
  @Input() dataType: 'unit' | 'currency' | null = null;

  /** Satuan angka pembanding (misal 'unit'); dipakai untuk fallback format comparison */
  @Input() unitLabel: string | null = null;

  /** Info bubble */
  @Input() info?: string;

  @Input() loading = false;

  /** Untuk auto-comparison dari series */
  @Input() period: { year: number; month?: number } | null = null;
  @Input() series: Record<string, number> | null = null;

  /** Toggle tampilan compare */
  compare = signal(false);
  @Input() set compareMode(v: boolean | null | undefined) {
    this.compare.set(!!v);
  }

  /** Info bubble state */
  showInfo = signal(false);

  readonly formatCompactCurrency = fmtCurrency;

  // ===== Lifecycle =====
  ngOnChanges(): void {
    if (this.period && this.series) {
      this.applyAutoFromSeries();
    }
  }

  // ===== Info bubble control =====
  toggleInfo(ev: MouseEvent) {
    ev.stopPropagation();
    this.showInfo.update(v => !v);
  }

  @HostListener('document:click')
  onDocClick() {
    this.showInfo.set(false);
  }

  // ===== Helpers for period/keys =====
  private pad2(n: number) { return n < 10 ? `0${n}` : String(n); }
  private keyOfMonth(y: number, m: number) { return `${y}-${this.pad2(m)}`; }
  private keyOfYear(y: number) { return `${y}`; }
  private prevMonth(y: number, m: number) { return m === 1 ? { y: y - 1, m: 12 } : { y, m: m - 1 }; }
  private monthNameId(m: number): string {
    const arr = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    return arr[(m - 1 + 12) % 12];
  }

  private applyAutoFromSeries() {
    const p = this.period!;
    const s = this.series!;
    const pick = (k: string) => (s[k] ?? null) as number | null;

    if (p.month) {
      // === MODE BULANAN ===
      const nowKey = this.keyOfMonth(p.year, p.month);
      const yoyKey = this.keyOfMonth(p.year - 1, p.month);
      const pm = this.prevMonth(p.year, p.month);
      const momKey = this.keyOfMonth(pm.y, pm.m);

      const now = pick(nowKey);
      const yoy = pick(yoyKey);
      const mom = pick(momKey);

      // value current tidak dipaksa dari series (biarkan parent suplai),
      // di sini hanya set pembanding & label
      this.prevYearValue = yoy;
      this.prevMonthValue = mom;

      this.prevYearSubtitle = `${this.monthNameId(p.month)} ${p.year - 1}`;
      this.prevMonthSubtitle = `${this.monthNameId(pm.m)} ${pm.y}`;
    } else {
      // === MODE TAHUNAN ===
      const nowKey = this.keyOfYear(p.year);
      const yoyKey = this.keyOfYear(p.year - 1);
      const now = pick(nowKey);
      const yoy = pick(yoyKey);

      this.prevYearValue = yoy;
      this.prevMonthValue = null; // tidak ada MoM untuk tahunan
      this.prevYearSubtitle = `${p.year - 1} `;
      this.prevMonthSubtitle = undefined;
    }
  }

  // ===== Number parsing / formatting =====

  /** Parse angka dari string (mendukung "Rp 900 M", "1,2B", "1.234,56", dll.) */
  private toNum(v: string | number | null): number | null {
    if (v === null || v === undefined || v === '') return null;
    if (typeof v === 'number') return Number.isFinite(v) ? v : null;

    // v string
    let s = v.trim();
    if (!s) return null;

    // multiplier: ribu/juta/miliar/triliun (ID & EN)
    let multiplier = 1;
    const lower = s.toLowerCase();

    // cari sufiks multiplier umum
    if (/(rb|ribu|k)\b/.test(lower)) multiplier = 1e3;
    else if (/(jt|juta|m)\b/.test(lower)) multiplier = 1e6;
    else if (/(b|miliar|billion)\b/.test(lower)) multiplier = 1e9;
    else if (/(t|triliun|trillion)\b/.test(lower)) multiplier = 1e12;

    // hilangkan currency / huruf, sisakan angka, . , - +
    s = s
      .replace(/[^0-9,.\-+]/g, '')
      .replace(/\s+/g, '');

    if (!s) return null;

    // normalisasi sederhana
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
      if (parts.length > 2) {
        s = s.replace(/\./g, '');
      }
    }

    const n = Number(s);
    if (!Number.isFinite(n)) return null;
    return n * multiplier;
  }

  // string murni non-numeric → true
  private isStringValue(v: string | number | null): boolean {
    if (v === null || v === undefined) return false;
    if (typeof v === 'number') return false;
    return this.toNum(v) === null;
  }

  formatValue(v: string | number | null): string {
    if (v === null || v === undefined) return '—';

    if (typeof v === 'string') {
      const n = this.toNum(v);
      if (n === null) return v; // string non-numeric → tampilkan apa adanya
      return this.dataType === 'currency'
        ? this.formatCompactCurrency(n)
        : n.toLocaleString('id-ID');
    }

    if (typeof v === 'number') {
      return this.dataType === 'currency'
        ? this.formatCompactCurrency(v)
        : v.toLocaleString('id-ID');
    }

    return String(v);
  }

  /** Untuk comparison: angka + satuan jika ada */
  formatValueWithUnit(v: string | number | null): string {
    const base = this.formatValue(v);
    if (!this.unitLabel) return base;
    const numLike = v !== null && (typeof v === 'number' || this.toNum(String(v)) !== null);
    return numLike ? `${base} ${this.unitLabel}` : base;
  }

  // ===== Comparison logic =====
  get yoy() {
    if (this.isStringValue(this.value) || this.isStringValue(this.prevYearValue)) {
      return this.hasYoY ? { abs: 0, dir: 'flat' as const } : null;
    }
    const c = this.toNum(this.value);
    const p = this.toNum(this.prevYearValue);
    if (c === null || p === null) return null;
    const abs = c - p;
    const dir: 'up' | 'down' | 'flat' = abs > 0 ? 'up' : abs < 0 ? 'down' : 'flat';
    return { abs, dir };
  }

  get mom() {
    if (this.isStringValue(this.value) || this.isStringValue(this.prevMonthValue)) {
      return this.hasMoM ? { abs: 0, dir: 'flat' as const } : null;
    }
    const c = this.toNum(this.value);
    const p = this.toNum(this.prevMonthValue);
    if (c === null || p === null) return null;
    const abs = c - p;
    const dir: 'up' | 'down' | 'flat' = abs > 0 ? 'up' : abs < 0 ? 'down' : 'flat';
    return { abs, dir };
  }

  // Warna nilai utama (prioritas MoM > YoY) — TIDAK dipakai di view netral current, tetap disediakan jika perlu
  get selectedDir(): 'up' | 'down' | 'flat' {
    if (this.mom) return this.mom.dir;
    if (this.yoy) return this.yoy.dir;
    return 'flat';
  }

  // helper flags
  get hasYoY(): boolean {
    return this.prevYearValue !== null && this.prevYearValue !== undefined;
  }
  get hasMoM(): boolean {
    return this.prevMonthValue !== null && this.prevMonthValue !== undefined;
  }
}
