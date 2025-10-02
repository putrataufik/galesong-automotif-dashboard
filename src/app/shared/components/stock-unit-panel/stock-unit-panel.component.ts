import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  computed,
  effect,
  signal,
  HostListener,
  ElementRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/** === RAW TYPES (selaras dengan service/state) === */
export interface RawStockUnitDetail {
  tglsjln: string; // "YYYY-MM-DD"
  kgudang: string; // "0001"
  thnprod: string; // "2025" | "0" | "202"
  warna: string; // "WHT  "
  hargabeli: string; // "342068188.00"
  ngudang: string; // "SHOWROOM UNIT PETTARANI"
  tymotor: string; // "CRT N LINE 2TR      "
  notes: string;
}

export interface RawStockUnitGroup {
  kgudang: string;
  ngudang: string;
  count: number;
  detail: RawStockUnitDetail[];
}

/** === VIEW MODELS === */
type AgingBucket = '0-30' | '31-60' | '61-90' | '>90' | 'unknown';

interface ViewUnit {
  id: string;
  model: string;
  warna: string;
  thnprod: string; // "Unknown" bila invalid
  tglsjln: string; // raw (bisa kosong)
  harga: number;
  age: number | null; // hari sejak tglsjln; null jika invalid/future
  ageText: string; // "—" atau "12 hari"
  bucket: AgingBucket;
  notes: string;
}

interface ViewGroup {
  code: string;
  name: string;
  count: number;
  bucketCounts: Record<AgingBucket, number>;
  units: ViewUnit[];
}

/** === UTILS === */
function trimPad(s: unknown): string {
  return String(s ?? '').trim();
}
function parseMoney(s: unknown): number {
  const n = Number(
    String(s ?? '')
      .replace(/,/g, '')
      .trim()
  );
  return Number.isFinite(n) ? n : 0;
}
function toLocalMidnight(dateStr: string): Date | null {
  if (!dateStr) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!m) return null;
  const y = +m[1],
    mo = +m[2] - 1,
    d = +m[3];
  const dt = new Date(y, mo, d, 0, 0, 0, 0);
  return isNaN(dt.getTime()) ? null : dt;
}
function diffDaysFromToday(dateStr: string): number | null {
  const d = toLocalMidnight(dateStr);
  if (!d) return null;
  const today = new Date();
  const td = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const days = Math.floor((td.getTime() - d.getTime()) / 86400000);
  return days >= 0 ? days : null; // masa depan -> null
}
function bucketOf(days: number | null): AgingBucket {
  if (days == null) return 'unknown';
  if (days <= 30) return '0-30';
  if (days <= 60) return '31-60';
  if (days <= 90) return '61-90';
  return '>90';
}
function ageText(days: number | null): string {
  return days == null ? '—' : `${days} hari`;
}
function normalizeModelName(raw: string): string {
  return trimPad(raw).replace(/\s+/g, ' ');
}

/** === COMPONENT === */
@Component({
  selector: 'app-stock-unit-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stock-unit-panel.component.html',
  styleUrls: ['./stock-unit-panel.component.css'],
})
export class StockUnitPanelComponent implements OnChanges {
  /** INPUT dari parent */
  @Input() groups: RawStockUnitGroup[] | null = null;
  @Input() loading: boolean | null = false;
  @Input() error: string | null = null;

  /** ===== Accordion state (tanpa Bootstrap JS) ===== */
  public singleOpen = true; // satu panel terbuka saja
  private _expanded = signal<Set<string>>(new Set());

  public safeId(raw: string): string {
    return String(raw ?? '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  public isExpanded(g: ViewGroup): boolean {
    return this._expanded().has(this.safeId(g.code));
  }
  public toggleGroup(g: ViewGroup) {
    const id = this.safeId(g.code);
    this._expanded.update((prev) => {
      const next = new Set(prev);
      if (this.singleOpen) next.clear();
      if (prev.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  /** VM yang dirender */
  private rawVm = signal<ViewGroup[]>([]);
  viewGroups = computed(() => this.rawVm());

  /** Header card: total unit + popover info */
  totalUnits = computed(() =>
    this.viewGroups().reduce((s, g) => s + (g.count || 0), 0)
  );

  infoOpen = signal(false);
  toggleInfo() {
    this.infoOpen.update((v) => !v);
  }

  openNoteId = signal<string | null>(null);

  toggleNote(rowId: string) {
    this.openNoteId.update((cur) => (cur === rowId ? null : rowId));
  }

  closeNotes() {
    this.openNoteId.set(null);
  }

  /** Inject host element untuk deteksi klik di luar (tutup popover) */
  private host: ElementRef<HTMLElement> = inject(ElementRef);

  @HostListener('document:click', ['$event'])
  closeOnOutside(ev: MouseEvent) {
    if (!this.host.nativeElement.contains(ev.target as Node)) {
      this.infoOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  escClose() {
    this.infoOpen.set(false);
  }

  /** Sinkronisasi expanded saat daftar groups berubah */
  constructor() {
    effect(
      () => {
        const visible = new Set(
          this.viewGroups().map((g) => this.safeId(g.code))
        );
        this._expanded.update((prev) => {
          const next = new Set<string>();
          for (const id of prev) if (visible.has(id)) next.add(id);
          return next;
        });
      },
      { allowSignalWrites: true }
    );
  }

  onNoteClick(u: { id: string; notes?: string | null }, ev: MouseEvent) {
    // blokir bubbling selalu supaya klik ikon tidak mengakibatkan toggle accordion
    ev.stopPropagation();

    if (!u.notes) {
      // tidak ada catatan: jangan apa-apa
      return;
    }

    // ada catatan → toggle popover
    this.toggleNote(u.id);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['groups']) {
      this.rebuildViewModel(this.groups ?? []);
    }
  }

  /** Build VM sederhana: tanpa flags/filter/export/KPI */
  private rebuildViewModel(groups: RawStockUnitGroup[]) {
    const out: ViewGroup[] = [];

    for (const g of groups ?? []) {
      const code = trimPad(g.kgudang);
      const name = trimPad(g.ngudang);
      const bucketCounts: Record<AgingBucket, number> = {
        '0-30': 0,
        '31-60': 0,
        '61-90': 0,
        '>90': 0,
        unknown: 0,
      };

      const units: ViewUnit[] = (g.detail ?? []).map((d, idx) => {
        const model = normalizeModelName(d.tymotor);
        const warna = trimPad(d.warna);
        const thnRaw = trimPad(d.thnprod);
        const thnprod =
          /^\d{4}$/.test(thnRaw) && thnRaw !== '0000' && thnRaw !== '0'
            ? thnRaw
            : 'Unknown';

        const tglsjln = trimPad(d.tglsjln);
        const harga = parseMoney(d.hargabeli);
        const age = diffDaysFromToday(tglsjln);
        const bucket = bucketOf(age);
        const notes = trimPad(d.notes);

        bucketCounts[bucket]++;

        return {
          id: `${code}-${idx}-${model}-${warna}-${tglsjln}`,
          model,
          warna,
          thnprod,
          tglsjln,
          harga,
          age,
          ageText: ageText(age),
          bucket,
          notes, // <— sertakan
        };
      });

      out.push({ code, name, count: units.length, bucketCounts, units });
    }

    out.sort((a, b) => a.name.localeCompare(b.name));
    this.rawVm.set(out);
  }

  /** Trackers */
  trackGroup = (i: number, g: ViewGroup) => `${g.code}__${i}`;
  trackUnit = (_: number, u: ViewUnit) => u.id;
}
