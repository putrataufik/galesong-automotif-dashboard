import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { KpiCardData } from '../../../core/models/dashboard.model';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kpi-card.component.html',
  styleUrl: './kpi-card.component.css'
})
export class KpiCardComponent {
  // Input Signal - Menerima data dari parent component
  data = input.required<KpiCardData>();

  loading = input<boolean>(false);
}
