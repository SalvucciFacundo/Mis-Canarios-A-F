import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BirdsAutocompleteComponent } from './birds-autocomplete.component';

describe('BirdsAutocompleteComponent', () => {
  let component: BirdsAutocompleteComponent;
  let fixture: ComponentFixture<BirdsAutocompleteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BirdsAutocompleteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BirdsAutocompleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
