import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ValidarCertificado } from './validar-certificado';

describe('ValidarCertificado', () => {
  let component: ValidarCertificado;
  let fixture: ComponentFixture<ValidarCertificado>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ValidarCertificado],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ValidarCertificado);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
