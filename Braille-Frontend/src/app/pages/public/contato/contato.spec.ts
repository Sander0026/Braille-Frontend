import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { Contato } from './contato';
import { ContatoService } from './contato.service';
import { SiteConfigService } from '../../../core/services/site-config';

describe('ContatoComponent', () => {
  let component: Contato;
  let fixture: ComponentFixture<Contato>;
  let contatoServiceMock: any;
  let siteConfigServiceMock: any;

  beforeEach(async () => {
    contatoServiceMock = { enviarContato: vi.fn() };
    siteConfigServiceMock = {
      secoes$: of({ contato_global: { emailOficial: 'teste@braille.org' } })
    };

    await TestBed.configureTestingModule({
      imports: [Contato, ReactiveFormsModule, HttpClientTestingModule],
      providers: [
        { provide: ContatoService, useValue: contatoServiceMock },
        { provide: SiteConfigService, useValue: siteConfigServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Contato);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve ser instanciado corretamente', () => {
    expect(component).toBeTruthy();
    expect(component.contatoForm).toBeDefined();
  });

  describe('Validação do Formulário', () => {
    it('deve marcar o formulário como inválido quando vazio', () => {
      expect(component.contatoForm.valid).toBe(false);
    });

    it('deve exigir nome, assunto e mensagem', () => {
      component.contatoForm.patchValue({
        nome: 'A', // inválido (min 2)
        assunto: 'Ab', // inválido (min 3)
        mensagem: 'Curta' // inválido (min 10)
      });
      component.contatoForm.markAllAsTouched();
      
      expect(component.isCampoInvalido('nome')).toBe(true);
      expect(component.isCampoInvalido('assunto')).toBe(true);
      expect(component.isCampoInvalido('mensagem')).toBe(true);
    });

    it('deve reprovar e-mail sem TLD (Regex stricto)', () => {
      component.contatoForm.patchValue({ email: 'usuario@dominio' }); // Sem .com
      component.contatoForm.get('email')?.markAsTouched();

      expect(component.isCampoInvalido('email')).toBe(true);
    });

    it('deve aprovar e-mail válido com TLD', () => {
      component.contatoForm.patchValue({ email: 'usuario@dominio.com.br' });
      component.contatoForm.get('email')?.markAsTouched();

      expect(component.isCampoInvalido('email')).toBe(false);
    });

    it('deve exigir preenchimento de e-mail OU telefone (validação cruzada)', () => {
      // Nenhum contato fornecido
      component.contatoForm.patchValue({ email: '', telefone: '' });
      component.contatoForm.get('email')?.markAsTouched();
      
      expect(component.isContatoObrigatorioInvalido()).toBe(true);

      // E-mail fornecido
      component.contatoForm.patchValue({ email: 'teste@teste.com' });
      expect(component.isContatoObrigatorioInvalido()).toBe(false);

      // Ou telefone fornecido
      component.contatoForm.patchValue({ email: '', telefone: '(11) 99999-9999' });
      expect(component.isContatoObrigatorioInvalido()).toBe(false);
    });
  });

  describe('Submissão (enviar)', () => {
    beforeEach(() => {
      // Prepara payload válido
      component.contatoForm.patchValue({
        nome: 'João Silva',
        email: 'joao@silva.com',
        assunto: 'Dúvida',
        mensagem: 'Gostaria de saber mais informações',
      });
    });

    it('deve enviar dados e mostrar sucesso', () => {
      contatoServiceMock.enviarContato.mockReturnValue(of(void 0));
      component.enviar();

      expect(contatoServiceMock.enviarContato).toHaveBeenCalled();
      expect(component.enviando()).toBe(false);
      expect(component.enviado()).toBe(true);
    });

    it('deve tratar erro generico', () => {
      contatoServiceMock.enviarContato.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 500 }))
      );
      component.enviar();

      expect(component.enviado()).toBe(false);
      expect(component.erroEnvio()).toBe('Não foi possível processar sua mensagem neste momento. Tente novamente.');
    });

    it('deve extrair a causa raiz da mensagem do backend em caso de Bad Request 400 (OWASP / UX)', () => {
      contatoServiceMock.enviarContato.mockReturnValue(
        throwError(() => new HttpErrorResponse({
          status: 400,
          error: { message: ['email deve ter um formato válido (ex: usuario@dominio.com)'] }
        }))
      );
      component.enviar();

      expect(component.erroEnvio()).toBe('email deve ter um formato válido (ex: usuario@dominio.com)');
    });
    
    it('deve extrair erro do backend mesmo quando message é uma string', () => {
      contatoServiceMock.enviarContato.mockReturnValue(
        throwError(() => new HttpErrorResponse({
          status: 400,
          error: { message: 'Dados inválidos detectados.' }
        }))
      );
      component.enviar();

      expect(component.erroEnvio()).toBe('Dados inválidos detectados.');
    });
  });
});

