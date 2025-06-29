import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NomenclatorListComponent } from './nomenclator-list.component';

describe('NomenclatorListComponent', () => {
  let component: NomenclatorListComponent;
  let fixture: ComponentFixture<NomenclatorListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NomenclatorListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NomenclatorListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
