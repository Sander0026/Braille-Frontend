import { TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { SafeUrlPipe } from './safe-url.pipe';

describe('SafeUrlPipe', () => {
  let pipe: SafeUrlPipe;
  let sanitizer: DomSanitizer;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SafeUrlPipe,
        {
          provide: DomSanitizer,
          useValue: {
            bypassSecurityTrustResourceUrl: (val: string) => `safe-${val}`
          }
        }
      ]
    });
    pipe = TestBed.inject(SafeUrlPipe);
    sanitizer = TestBed.inject(DomSanitizer);
  });

  it('deve ser instanciado corretamente', () => {
    expect(pipe).toBeTruthy();
  });

  it('deve autorizar e bypassed links com http://', () => {
    const result = pipe.transform('http://instituto.org');
    expect(result).toBe('safe-http://instituto.org');
  });

  it('deve autorizar e bypassed links com https://', () => {
    const result = pipe.transform('https://secure.org');
    expect(result).toBe('safe-https://secure.org');
  });

  it('deve autorizar e bypassed URLs locais (blob:) transferidas em memória', () => {
    const result = pipe.transform('blob:http://localhost/123');
    expect(result).toBe('safe-blob:http://localhost/123');
  });

  it('deve bloquear URIs maliciosos de injeção (javascript: e data: base64)', () => {
    spyOn(console, 'warn');
    const result = pipe.transform('javascript:alert(1)');
    expect(result).toBe('safe-'); // Bypassa o empty fallback seguro
    expect(console.warn).toHaveBeenCalled();
  });

  it('deve devolver fallback encasulado ao receber valores nulos', () => {
    const result = pipe.transform(null as any);
    expect(result).toBe(''); // Como if (!url) retorna native string '' no começo, o DOM normal aceita
  });
});
