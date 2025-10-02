import { Component, Input, ChangeDetectionStrategy, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

type Row = {
  name: string;
  curr: number;
  prevM: number | null;
  prevY: number | null;
  prevD?: number | null;
};

@Component({
  selector: 'app-leaderboard-list-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leaderboard-list-card.component.html',
  styleUrls: ['./leaderboard-list-card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeaderboardListCardComponent implements OnChanges {
  @Input() title = 'Leaderboard';
  @Input() subtitle = '';
  @Input() unit: 'Unit' | 'Rp' | string = 'Unit';
  @Input() rows: Row[] = [];
  @Input() maxRows = 50;

  // label & opsi compare (compare tidak dipakai di sini, tapi aman jika parent kirim)
  @Input() labelCurr: string = 'Current';
  @Input() labelPrevY: string = 'Prev Year';
  @Input() labelPrevM: string = 'Prev Month';
  @Input() labelPrevD: string = 'Prev Date';
  @Input() compare: boolean = true;
  @Input() height: string | number | null = null; // tinggi tetap (fixed), misal "300px" atau 300 (px)

  // hasil olahan untuk view
  displayRows: Row[] = [];
  hasPrevDate = false;     // jika ada prevD pada salah satu baris
  showPrevYD = false;      // tampilkan kolom Prev (Y/D) hanya jika ada nilai prev (≠ null)
  showPrevM = false;       // tampilkan kolom Prev Month hanya jika ada nilai prevM (≠ null)
  maxCurr = 0;

  ngOnChanges() {
    this.rebuild();
  }

  private rebuild() {
    // 1) Saring baris yang benar-benar "kosong total" (semua metrik 0/null)
    //    Catatan: 0 bisa valid; kalau Anda ingin menyembunyikan baris yang 0 semua,
    //    logika di bawah mempertahankan baris yang punya angka > 0 di salah satu kolom.
    const filtered = (this.rows ?? []).filter(r => {
      const c = Number(r.curr ?? 0);
      const pm = Number(r.prevM ?? 0);
      const py = Number(r.prevY ?? 0);
      const pd = Number(r.prevD ?? 0);
      return (c + pm + py + pd) > 0;
    });

    // 2) Urut descending by current, lalu nama
    const sorted = [...filtered].sort(
      (a, b) => (b.curr - a.curr) || a.name.localeCompare(b.name)
    );

    // 3) Batasi jumlah baris
    this.displayRows = sorted.slice(0, this.maxRows);

    // 4) Ada prevD di salah satu baris?
    this.hasPrevDate = this.displayRows.some(r => r.prevD != null);

    // 5) Tentukan visibilitas kolom prev:
    //    - Jika ada prevD di data → cek keberadaan prevD
    //    - Jika tidak ada prevD sama sekali → cek keberadaan prevY
    this.showPrevYD = this.hasPrevDate
      ? (this.displayRows.some(r => r.prevD != null))
      : (this.displayRows.some(r => r.prevY != null));

    //    - Kolom Prev Month tampil jika ada baris dengan prevM != null
    this.showPrevM = this.displayRows.some(r => r.prevM != null);

    // 6) Max current (kalau mau dipakai untuk progress bar dsb.)
    this.maxCurr = this.displayRows.reduce((m, r) => Math.max(m, r.curr), 0);
  }

  get headerPrevText(): string {
    return this.hasPrevDate ? this.labelPrevD : this.labelPrevY;
  }

  fmt(x: number | null | undefined): string {
    if (x == null) return '—';
    const n = Number(x);
    return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);
  }

  trackByName = (_: number, r: Row) => r.name;
}
