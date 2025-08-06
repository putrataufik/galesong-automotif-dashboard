import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kpi-card.component.html',
  styleUrl: './kpi-card.component.css',
})
export class KpiCardComponent {
  @Input() title = '';
  @Input() value: number | string = 0;
  @Input() unit = '';
  @Input() icon = ''; // path icon dari public
  @Input() bgColor = '#f5f5f5'; // background default icon

  onIconError(event: Event) {
    (event.target as HTMLImageElement).src = 'icons/dashboard.png'; // fallback icon
  }
}
