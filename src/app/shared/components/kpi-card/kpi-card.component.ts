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
  @Input() subtitle = '';
  @Input() iconClass = 'bi-graph-up'; // default icon
}
