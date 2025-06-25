import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BirdEditComponent } from './bird-edit.component';

describe('BirdEditComponent', () => {
  let component: BirdEditComponent;
  let fixture: ComponentFixture<BirdEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BirdEditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BirdEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
