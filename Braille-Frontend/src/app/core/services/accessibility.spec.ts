import { TestBed } from '@angular/core/testing';

import { Accessibility } from './accessibility';

describe('Accessibility', () => {
  let service: Accessibility;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Accessibility);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
