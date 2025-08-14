import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AfterSalesDashboardComponent } from './after-sales-dashboard.component';

describe('AfterSalesDashboardComponent', () => {
  let component: AfterSalesDashboardComponent;
  let fixture: ComponentFixture<AfterSalesDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AfterSalesDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AfterSalesDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
