import { TestBed } from '@angular/core/testing';

import { BirdsStoreService } from './birds-store.service';

describe('BirdsStoreService', () => {
  let service: BirdsStoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BirdsStoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
