import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinancialTrackingComponent } from './financial-tracking.component';

describe('FinancialTrackingComponent', () => {
  let component: FinancialTrackingComponent;
  let fixture: ComponentFixture<FinancialTrackingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinancialTrackingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinancialTrackingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
