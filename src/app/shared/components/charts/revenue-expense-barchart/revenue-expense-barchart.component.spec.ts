import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RevenueExpenseBarchartComponent } from './revenue-expense-barchart.component';

describe('RevenueExpenseBarchartComponent', () => {
  let component: RevenueExpenseBarchartComponent;
  let fixture: ComponentFixture<RevenueExpenseBarchartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RevenueExpenseBarchartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RevenueExpenseBarchartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
