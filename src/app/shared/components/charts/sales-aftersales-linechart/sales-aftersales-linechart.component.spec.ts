import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesAftersalesLinechartComponent } from './sales-aftersales-linechart.component';

describe('SalesAftersalesLinechartComponent', () => {
  let component: SalesAftersalesLinechartComponent;
  let fixture: ComponentFixture<SalesAftersalesLinechartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesAftersalesLinechartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SalesAftersalesLinechartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
