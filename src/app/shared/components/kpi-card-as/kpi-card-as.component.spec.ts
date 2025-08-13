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
});
