import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminCouplesListComponent } from './admin-couples-list.component';

describe('AdminCouplesListComponent', () => {
  let component: AdminCouplesListComponent;
  let fixture: ComponentFixture<AdminCouplesListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCouplesListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminCouplesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
