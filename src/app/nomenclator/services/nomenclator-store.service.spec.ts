import { TestBed } from '@angular/core/testing';

import { NomenclatorStoreService } from './nomenclator-store.service';

describe('NomenclatorStoreService', () => {
  let service: NomenclatorStoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NomenclatorStoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
