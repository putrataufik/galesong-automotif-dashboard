import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TargetRealizationBarchartComponent } from './target-realization-barchart.component';

describe('TargetRealizationBarchartComponent', () => {
  let component: TargetRealizationBarchartComponent;
  let fixture: ComponentFixture<TargetRealizationBarchartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TargetRealizationBarchartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TargetRealizationBarchartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
