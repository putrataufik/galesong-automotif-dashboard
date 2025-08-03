import { Component} from '@angular/core';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { FilterComponent } from '../../shared/components/filter/filter.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [KpiCardComponent, FilterComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent{

}
