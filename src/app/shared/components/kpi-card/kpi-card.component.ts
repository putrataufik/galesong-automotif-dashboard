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
  @Input() value: string | number = '—';
  @Input() unit?: string;      
  @Input() subtitle?: string;       
  @Input() icon = 'icons/default.png';
  @Input() iconBgClass = 'icon-bg-blue';
  @Input() loading = false;
  
  // For large/highlighted cards
  @Input() isLarge = false;
  @Input() highlightLabel?: string;
  @Input() highlightValue?: string;

  formatValue(val: string | number): string {
    if (typeof val === 'number') {
      // Format large numbers with comma separators
      return val.toLocaleString('id-ID');
    }
    return val.toString();
  }
}
