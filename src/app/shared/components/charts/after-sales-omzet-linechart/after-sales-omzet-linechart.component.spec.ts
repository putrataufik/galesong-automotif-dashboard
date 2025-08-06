import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AfterSalesOmzetLinechartComponent } from './after-sales-omzet-linechart.component';

describe('AfterSalesOmzetLinechartComponent', () => {
  let component: AfterSalesOmzetLinechartComponent;
  let fixture: ComponentFixture<AfterSalesOmzetLinechartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AfterSalesOmzetLinechartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AfterSalesOmzetLinechartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
