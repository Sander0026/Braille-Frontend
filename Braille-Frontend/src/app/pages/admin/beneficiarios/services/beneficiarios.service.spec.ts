import { TestBed } from '@angular/core/testing';

import { Beneficiarios } from './beneficiarios.service';

describe('Beneficiarios', () => {
  let service: Beneficiarios;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Beneficiarios);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
