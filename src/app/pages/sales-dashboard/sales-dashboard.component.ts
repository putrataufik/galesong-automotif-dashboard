import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { FilterSalesDashboardComponent } from '../../shared/components/filter-sales-dashboard/filter-sales-dashboard.component';
import { LineChartCardComponent } from '../../shared/components/line-chart-card/line-chart-card.component';
import { YoyProgressListComponent } from '../../shared/components/yoy-progress-list/yoy-progress-list.component';
import { AppFilter } from '../../types/filter.model';
import { SalesStateService } from '../../core/state/sales-state.service';
import { SalesDashboardFacade } from './sales-dashboard.facade';
import { getPeriodDisplayName as utilPeriodName } from '../pages.utils';
import {
  getCompanyDisplayName as utilCompanyName,
  getCategoryDisplayName as utilCategoryName,
  getBranchDisplayName as utilBranchName,
} from './sales.utils';
import { StockUnitPanelComponent } from '../../shared/components/stock-unit-panel/stock-unit-panel.component';
import { BarChartCardComponent } from "../../shared/components/bar-chart-card/bar-chart-card.component";

const MONTH_LABELS: string[] = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MEI',
  'JUN',
  'JUL',
  'AGU',
  'SEP',
  'OKT',
  'NOV',
  'DES',
];

@Component({
  selector: 'app-sales-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    KpiCardComponent,
    FilterSalesDashboardComponent,
    LineChartCardComponent,
    YoyProgressListComponent,
    StockUnitPanelComponent,
    BarChartCardComponent
],
  templateUrl: './sales-dashboard.component.html',
  styleUrl: './sales-dashboard.component.css',
  providers: [SalesDashboardFacade],
})
export class SalesDashboardComponent implements OnInit {
  private readonly facade = inject(SalesDashboardFacade);
  private readonly state = inject(SalesStateService);

  readonly MONTH_LABELS = MONTH_LABELS;

  currentFilter: AppFilter = {
    company: 'sinar-galesong-mobilindo',
    category: 'sales',
    year: String(new Date().getFullYear()),
    month: String(new Date().getMonth() + 1).padStart(2, '0'),
    branch: 'all-branch',
    compare: true,
    useCustomDate: true,
    selectedDate: new Date().toISOString().slice(0, 10),
  };

  // expose signals dari facade
  loading = this.facade.loading;
  loadingMessage = this.facade.loadingMessage;
  error = this.facade.error;
  hasData = this.facade.hasData;
  isDataEmpty = this.facade.isDataEmpty;
  salesKpi = this.facade.salesKpi;

  trendLoading = this.facade.trendLoading;
  trendError = this.facade.trendError;
  trendLineSeries = this.facade.trendLineSeries;

  doSpkLoading = this.facade.doSpkLoading;
  doSpkError = this.facade.doSpkError;
  doSpkLineSeries = this.facade.doSpkLineSeries;

  modelDistLoading = this.facade.modelDistLoading;
  modelDistError = this.facade.modelDistError;
  modelDistItems = this.facade.modelDistItems;
  modelLabelCurr = this.facade.modelLabelCurr;
  modelLabelPrevY = this.facade.modelLabelPrevY;
  modelLabelPrevM = this.facade.modelLabelPrevM;

  stockLoading = this.facade.stockLoading;
  stockError = this.facade.stockError;
  stockGroups = this.facade.stockGroups;

  // Expose DO per Cabang signals
  doBranchLoading = this.facade.doBranchLoading;
  doBranchError = this.facade.doBranchError;
  doBranchChartData = this.facade.doBranchChartData;
  doBranchPeriodLabel = this.facade.doBranchPeriodLabel;

  ngOnInit(): void {
    const saved = this.state.getCurrentFilter();
    if (saved) {
      this.currentFilter = {
        ...this.currentFilter,
        company: saved.companyId,
        branch: saved.branchId ?? 'all-branch',
        compare: !!saved.compare,
        useCustomDate: !!saved.useCustomDate,
        year: saved.year ?? this.currentFilter.year,
        month: saved.month ?? this.currentFilter.month,
        selectedDate: saved.selectedDate ?? this.currentFilter.selectedDate,
      };
    }
    this.facade.initFromState(this.currentFilter);
  }

  onSearch(filter: AppFilter): void {
    this.currentFilter = { ...filter, category: 'sales' };
    this.facade.refreshAll(this.currentFilter);
  }

  getCompanyDisplayName(company: string) {
    return utilCompanyName(company);
  }
  getCategoryDisplayName(category: string) {
    return utilCategoryName(category);
  }
  getBranchDisplayName(branch: string) {
    return utilBranchName(branch);
  }
  getPeriodDisplayName(): string {
    return utilPeriodName({
      useCustomDate: this.currentFilter.useCustomDate,
      selectedDate: this.currentFilter.selectedDate,
      year: this.currentFilter.year,
      month: this.currentFilter.month,
    });
  }
}
