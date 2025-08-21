import { CommonModule } from '@angular/common';
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kpi-card.component.html',
  styleUrl: './kpi-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KpiCardComponent {
  @Input() title = 'KPI';

  // IZINKAN null di sini
  @Input() value: string | number | null = null;

  @Input() unit?: string;
  @Input() subtitle?: string;
  @Input() icon = 'bi bi-star';
  @Input() iconColor = '#000000';
  @Input() iconBgColor = '#868686ff';
  @Input() loading = false;

  // (opsional) samakan juga tipe ini jika dipakai
  @Input() isLarge = false;
  @Input() highlightLabel?: string;
  @Input() highlightValue?: string | number | null;

  formatValue(val: string | number | null): string {
    if (val === null || val === undefined || val === '') return '—';
    if (typeof val === 'number') {
      return val.toLocaleString('id-ID'); // format angka default
    }
    return val.toString();
  }
}
