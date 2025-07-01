import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CouplesEditComponent } from './couples-edit.component';

describe('CouplesEditComponent', () => {
  let component: CouplesEditComponent;
  let fixture: ComponentFixture<CouplesEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CouplesEditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CouplesEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
