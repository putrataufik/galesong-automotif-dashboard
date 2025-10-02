import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeaderboardListCardComponent } from './leaderboard-list-card.component';

describe('LeaderboardListCardComponent', () => {
  let component: LeaderboardListCardComponent;
  let fixture: ComponentFixture<LeaderboardListCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeaderboardListCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeaderboardListCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
