import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LineChartCardComponent } from './line-chart-card.component';

describe('LineChartCardComponent', () => {
  let component: LineChartCardComponent;
  let fixture: ComponentFixture<LineChartCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LineChartCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LineChartCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
