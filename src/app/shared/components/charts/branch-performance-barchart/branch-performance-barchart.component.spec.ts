import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BranchPerformanceBarchartComponent } from './branch-performance-barchart.component';

describe('BranchPerformanceBarchartComponent', () => {
  let component: BranchPerformanceBarchartComponent;
  let fixture: ComponentFixture<BranchPerformanceBarchartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BranchPerformanceBarchartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BranchPerformanceBarchartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
