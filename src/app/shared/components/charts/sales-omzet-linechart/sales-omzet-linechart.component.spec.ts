import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesOmzetLinechartComponent } from './sales-omzet-linechart.component';

describe('SalesOmzetLinechartComponent', () => {
  let component: SalesOmzetLinechartComponent;
  let fixture: ComponentFixture<SalesOmzetLinechartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesOmzetLinechartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SalesOmzetLinechartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
