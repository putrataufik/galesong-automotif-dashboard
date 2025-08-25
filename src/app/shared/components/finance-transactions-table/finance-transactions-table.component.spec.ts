import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinanceTransactionsTableComponent } from './finance-transactions-table.component';

describe('FinanceTransactionsTableComponent', () => {
  let component: FinanceTransactionsTableComponent;
  let fixture: ComponentFixture<FinanceTransactionsTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinanceTransactionsTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinanceTransactionsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
