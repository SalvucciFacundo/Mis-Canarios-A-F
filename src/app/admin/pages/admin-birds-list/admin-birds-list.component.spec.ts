import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminBirdsListComponent } from './admin-birds-list.component';

describe('AdminBirdsListComponent', () => {
  let component: AdminBirdsListComponent;
  let fixture: ComponentFixture<AdminBirdsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminBirdsListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminBirdsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
