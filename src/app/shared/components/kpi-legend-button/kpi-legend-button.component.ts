import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-kpi-legend-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kpi-legend-button.component.html',
  styleUrl: './kpi-legend-button.component.css',
})
export class KpiLegendButtonComponent {
  /** Tampilkan bagian "Harapan Target" jika true */
  @Input() showSisaHariKerja = false;

  /** Kelas tombol (opsional) */
  @Input() buttonClass = 'btn btn-light border rounded-circle p-2 shadow-sm';

  /** Posisi popover relatif tombol */
  @Input() placement: 'start' | 'end' = 'start';

  /** Event ketika dibuka/ditutup (opsional) */
  @Output() openedChange = new EventEmitter<boolean>();
  @Input() diameter = 36;

  opened = false;

  toggle(e?: MouseEvent) {
    e?.stopPropagation();
    this.opened = !this.opened;
    this.openedChange.emit(this.opened);
  }

  close() {
    if (this.opened) {
      this.opened = false;
      this.openedChange.emit(false);
    }
  }

  @HostListener('document:click')
  onDocClick() {
    this.close();
  }

  @HostListener('document:keydown.escape')
  onEsc() {
    this.close();
  }

  stop(e: MouseEvent) {
    e.stopPropagation();
  }
}
