import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterMainDashboardComponent } from './filter-main-dashboard.component';

describe('FilterMainDashboardComponent', () => {
  let component: FilterMainDashboardComponent;
  let fixture: ComponentFixture<FilterMainDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterMainDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FilterMainDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
