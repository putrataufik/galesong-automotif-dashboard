import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KpiCardAsComponent } from './kpi-card-as.component';

describe('KpiCardAsComponent', () => {
  let component: KpiCardAsComponent;
  let fixture: ComponentFixture<KpiCardAsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KpiCardAsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KpiCardAsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate percentage correctly', () => {
    component.realisasi = 80;
    component.target = 100;
    expect(component.percentage).toBe(80);
  });

  it('should handle zero target gracefully', () => {
    component.realisasi = 50;
    component.target = 0;
    expect(component.percentage).toBe(0);
  });

  it('should clamp percentage between 0 and 100', () => {
    component.realisasi = 150;
    component.target = 100;
    expect(component.clampedPercent).toBe(100);
    
    component.realisasi = -10;
    component.target = 100;
    expect(component.clampedPercent).toBe(0);
  });

  it('should calculate grand total correctly', () => {
    component.realisasi = 120;
    component.target = 100;
    expect(component.grandTotal).toBe(20);
  });

  it('should format currency correctly', () => {
    expect(component.formatCompactNumber(1500000)).toBe('Rp 1,5M');
    expect(component.formatCompactNumber(2500000000)).toBe('Rp 2,5B');
    expect(component.formatCompactNumber(-500000)).toBe('-Rp 500,0K');
  });
});