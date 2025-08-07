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
  @Input() icon = 'bi-graph-up'; 
  @Input() iconBgClass = 'bg-light';   
}
