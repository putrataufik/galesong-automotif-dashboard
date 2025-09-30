import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StockUnitPanelComponent } from './stock-unit-panel.component';

describe('StockUnitPanelComponent', () => {
  let component: StockUnitPanelComponent;
  let fixture: ComponentFixture<StockUnitPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StockUnitPanelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StockUnitPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
