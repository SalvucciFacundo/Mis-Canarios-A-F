import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CouplesDetailsComponent } from './couples-details.component';

describe('CouplesDetailsComponent', () => {
  let component: CouplesDetailsComponent;
  let fixture: ComponentFixture<CouplesDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CouplesDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CouplesDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
