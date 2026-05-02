import { TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { SafeUrlPipe } from './safe-url.pipe';

describe('SafeUrlPipe', () => {
  let pipe: SafeUrlPipe;

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
  });

  it('deve ser instanciado corretamente', () => {
    expect(pipe).toBeTruthy();
  });

  it('deve autorizar assets locais', () => {
    const result = pipe.transform('assets/manuais/manual.pdf');
    expect(result).toBe('safe-/assets/manuais/manual.pdf');
  });

  it('deve autorizar URLs locais blob transferidas em memoria', () => {
    const result = pipe.transform('blob:http://localhost/123');
    expect(result).toBe('safe-blob:http://localhost/123');
  });

  it('deve autorizar URLs https do Cloudinary', () => {
    const result = pipe.transform('https://res.cloudinary.com/demo/raw/upload/manual.pdf');
    expect(result).toBe('safe-https://res.cloudinary.com/demo/raw/upload/manual.pdf');
  });

  it('deve bloquear links http externos', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = pipe.transform('http://instituto.org');
    expect(result).toBe('safe-');
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('deve bloquear URIs maliciosas de injecao', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = pipe.transform('javascript:alert(1)');
    expect(result).toBe('safe-');
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('deve devolver fallback seguro ao receber valores nulos', () => {
    const result = pipe.transform(null);
    expect(result).toBe('safe-');
  });
});
