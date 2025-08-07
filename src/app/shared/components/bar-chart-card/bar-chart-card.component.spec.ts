import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BarChartCardComponent } from './bar-chart-card.component';

describe('BarChartCardComponent', () => {
  let component: BarChartCardComponent;
  let fixture: ComponentFixture<BarChartCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BarChartCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BarChartCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
