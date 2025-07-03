import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminNomenclatorListComponent } from './admin-nomenclator-list.component';

describe('AdminNomenclatorListComponent', () => {
  let component: AdminNomenclatorListComponent;
  let fixture: ComponentFixture<AdminNomenclatorListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminNomenclatorListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminNomenclatorListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
