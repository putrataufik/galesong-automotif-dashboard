import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KpiLegendButtonComponent } from './kpi-legend-button.component';

describe('KpiLegendButtonComponent', () => {
  let component: KpiLegendButtonComponent;
  let fixture: ComponentFixture<KpiLegendButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KpiLegendButtonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KpiLegendButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
