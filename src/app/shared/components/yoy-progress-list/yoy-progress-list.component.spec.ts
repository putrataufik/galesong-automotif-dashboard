import { ComponentFixture, TestBed } from '@angular/core/testing';

import { YoyProgressListComponent } from './yoy-progress-list.component';

describe('YoyProgressListComponent', () => {
  let component: YoyProgressListComponent;
  let fixture: ComponentFixture<YoyProgressListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [YoyProgressListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(YoyProgressListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
