import { TestBed } from '@angular/core/testing';

import { NomenclatorService } from './nomenclator.service';

describe('NomenclatorService', () => {
  let service: NomenclatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NomenclatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
