import { TestBed } from '@angular/core/testing';
import { ResolveFn } from '@angular/router';

import { allianceResolver } from './alliance.resolver';

describe('allianceResolver', () => {
  const executeResolver: ResolveFn<boolean> = (...resolverParameters) => 
      TestBed.runInInjectionContext(() => allianceResolver(...resolverParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeResolver).toBeTruthy();
  });
});
