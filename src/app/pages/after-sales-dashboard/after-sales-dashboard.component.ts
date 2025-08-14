import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FilterAftersalesDashboardComponent } from '../../shared/components/filter-aftersales-dashboard/filter-aftersales-dashboard.component';

@Component({
  selector: 'app-after-sales-dashboard',
  standalone: true,
  imports: [CommonModule, FilterAftersalesDashboardComponent],
  templateUrl: './after-sales-dashboard.component.html',
  styleUrl: './after-sales-dashboard.component.css'
})
export class AfterSalesDashboardComponent {
  
  onSearch(event: any) {
    console.log('After Sales Search initiated:', event);
  }
}