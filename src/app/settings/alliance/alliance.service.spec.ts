import { TestBed } from '@angular/core/testing';

import { AllianceService } from './alliance.service';

describe('AllianceService', () => {
  let service: AllianceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AllianceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
