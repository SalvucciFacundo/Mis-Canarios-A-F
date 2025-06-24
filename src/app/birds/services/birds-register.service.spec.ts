import { TestBed } from '@angular/core/testing';

import { BirdsRegisterService } from './birds-register.service';

describe('BirdsRegisterService', () => {
  let service: BirdsRegisterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BirdsRegisterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
