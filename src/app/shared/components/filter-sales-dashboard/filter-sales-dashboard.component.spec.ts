import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterSalesDashboardComponent } from './filter-sales-dashboard.component';

describe('FilterSalesDashboardComponent', () => {
  let component: FilterSalesDashboardComponent;
  let fixture: ComponentFixture<FilterSalesDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterSalesDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FilterSalesDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
