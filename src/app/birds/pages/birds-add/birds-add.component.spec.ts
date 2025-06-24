import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BirdsAddComponent } from './birds-add.component';

describe('BirdsAddComponent', () => {
  let component: BirdsAddComponent;
  let fixture: ComponentFixture<BirdsAddComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BirdsAddComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BirdsAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
