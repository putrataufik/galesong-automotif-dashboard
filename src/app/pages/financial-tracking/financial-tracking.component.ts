import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FilterComponent } from '../../shared/components/filter/filter.component';
@Component({
  selector: 'app-financial-tracking',
  standalone: true,
  imports: [CommonModule, FilterComponent],
  templateUrl: './financial-tracking.component.html',
  styleUrl: './financial-tracking.component.css'
})
export class FinancialTrackingComponent {
  
}