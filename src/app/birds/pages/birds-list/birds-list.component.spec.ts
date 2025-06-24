import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BirdsListComponent } from './birds-list.component';

describe('BirdsListComponent', () => {
  let component: BirdsListComponent;
  let fixture: ComponentFixture<BirdsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BirdsListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BirdsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
