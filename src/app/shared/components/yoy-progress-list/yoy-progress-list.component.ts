import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ModelYoYMoM = {
  name: string;
  curr: number;         // selalu number
  prevY: number | null; // boleh null
  prevM: number | null; // boleh null
};

@Component({
  selector: 'app-yoy-progress-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './yoy-progress-list.component.html',
  styleUrls: ['./yoy-progress-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class YoyProgressListComponent {
  @Input() title = 'Proporsi Penjualan per Model';
  @Input() unit = 'Unit';
  @Input() items: ModelYoYMoM[] = [];
  @Input() maxRows = 100;

  /** label periode (tampilkan di header kecil di atas kolom) */
  @Input() labelCurr = 'Current';
  @Input() labelPrevY = 'Prev Year';
  @Input() labelPrevM = 'Prev Month';

  /** mode komparasi dari parent (filter.compare) */
  @Input() compare = false;

  /** helper total kolom (untuk proporsi) */
  private sum(arr: number[]) { return Math.max(1, arr.reduce((a,b)=>a+(b||0),0)); }

  get rows()      { return this.items.slice(0, this.maxRows); }

  /** Tampilkan kolom PrevY/PrevM HANYA jika compare=TRUE dan ada datanya */
  get showPrevY() { return this.compare && this.items.some(x => x.prevY != null); }
  get showPrevM() { return this.compare && this.items.some(x => x.prevM != null); }

  get totalCurr()  { return this.sum(this.rows.map(r => r.curr)); }
  get totalPrevY() { return this.sum(this.rows.map(r => r.prevY || 0)); }
  get totalPrevM() { return this.sum(this.rows.map(r => r.prevM || 0)); }

  pctCurr(v: number)  { return Math.min(100, (v / this.totalCurr) * 100); }
  pctPrevY(v: number) { return Math.min(100, (v / this.totalPrevY) * 100); }
  pctPrevM(v: number) { return Math.min(100, (v / this.totalPrevM) * 100); }
}
