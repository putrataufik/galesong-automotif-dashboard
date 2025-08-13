import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterAfterSalesComponent } from './filter-after-sales.component';

describe('FilterAfterSalesComponent', () => {
  let component: FilterAfterSalesComponent;
  let fixture: ComponentFixture<FilterAfterSalesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterAfterSalesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FilterAfterSalesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
