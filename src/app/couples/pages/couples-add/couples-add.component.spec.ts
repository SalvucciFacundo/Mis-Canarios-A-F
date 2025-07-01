import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CouplesAddComponent } from './couples-add.component';

describe('CouplesAddComponent', () => {
  let component: CouplesAddComponent;
  let fixture: ComponentFixture<CouplesAddComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CouplesAddComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CouplesAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
