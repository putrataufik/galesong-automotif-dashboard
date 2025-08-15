import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterAftersalesDashboardComponent } from './filter-aftersales-dashboard.component';

describe('FilterAftersalesDashboardComponent', () => {
  let component: FilterAftersalesDashboardComponent;
  let fixture: ComponentFixture<FilterAftersalesDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterAftersalesDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FilterAftersalesDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
