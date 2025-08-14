import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FilterMainDashboardComponent } from '../../shared/components/filter-main-dashboard/filter-main-dashboard.component';
@Component({
  selector: 'app-financial-tracking',
  standalone: true,
  imports: [CommonModule, FilterMainDashboardComponent],
  templateUrl: './financial-tracking.component.html',
  styleUrl: './financial-tracking.component.css'
})
export class FinancialTrackingComponent {
  OnSearch(event: any) {
    console.log('Search initiated');
  }
}