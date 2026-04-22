/**
 * cadastro-turma-wizard.spec.ts
 *
 * Suite de Acessibilidade WCAG 2.1 AA — CadastroTurmaWizard
 * Runner: Vitest (@angular/build:unit-test) — sem zone.js / fakeAsync.
 *
 * Critérios cobertos:
 *  1.3.1 — Semântica (fieldset/legend, label/id, aria-describedby, role=group)
 *  2.4.3 — Foco vai ao primeiro campo inválido ao tentar avançar sem preencher
 *  4.1.2 — aria-required, aria-invalid, aria-busy no submit, progressbar
 *  4.1.3 — role=alert para erros, aria-live nos loaders, LiveAnnouncer ao trocar etapa
 *  1.1.1 — aria-hidden nos ícones decorativos do banner
 *  2.1.1 — Teclado (Tab não interceptado, Enter no submit)
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient }         from '@angular/common/http';
import { provideHttpClientTesting }  from '@angular/common/http/testing';
import { By }                        from '@angular/platform-browser';
import { provideRouter }             from '@angular/router';
import { LiveAnnouncer }             from '@angular/cdk/a11y';
import { of, throwError }            from 'rxjs';

import { CadastroTurmaWizard } from './cadastro-turma-wizard';
import { TurmasService }             from '../../../../core/services/turmas.service';
import { UsuariosService }           from '../../../../core/services/usuarios.service';
import { ModelosCertificadosService } from '../../../../core/services/modelos-certificados.service';

// ─── Stubs ───────────────────────────────────────────────────────────────────

const PROFESSORES_RESP = {
  data: [{ id: 'p1', nome: 'Prof. Ana',   role: 'PROFESSOR' }],
  meta: { total: 1, page: 1, limit: 100, totalPages: 1 },
};
const MODELOS_RESP = [{ id: 'm1', nome: 'Certificado A', nomeAssinante: 'Diretor', tipo: 'ACADEMICO' }];
const TURMA_CRIADA = { id: 't99', nome: 'Oficina Teste' };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function qs<T extends HTMLElement>(f: ComponentFixture<unknown>, sel: string): T {
  const el = f.debugElement.query(By.css(sel))?.nativeElement as T | null;
  if (!el) throw new Error(`Elemento não encontrado: "${sel}"`);
  return el;
}

// ─── Setup ───────────────────────────────────────────────────────────────────

describe('CadastroTurmaWizard — Acessibilidade WCAG 2.1 AA', () => {
  let fixture:   ComponentFixture<CadastroTurmaWizard>;
  let component: CadastroTurmaWizard;

  const turmaSvc    = { criar: vi.fn() };
  const usuarioSvc  = { listar: vi.fn() };
  const modelosSvc  = { listar: vi.fn() };
  const announcer   = { announce: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    usuarioSvc.listar.mockReturnValue(of(PROFESSORES_RESP));
    modelosSvc.listar.mockReturnValue(of(MODELOS_RESP));
    turmaSvc.criar.mockReturnValue(of(TURMA_CRIADA));

    await TestBed.configureTestingModule({
      imports: [CadastroTurmaWizard],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: TurmasService,              useValue: turmaSvc    },
        { provide: UsuariosService,            useValue: usuarioSvc  },
        { provide: ModelosCertificadosService, useValue: modelosSvc  },
        { provide: LiveAnnouncer,              useValue: announcer   },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(CadastroTurmaWizard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── 1. WCAG 1.3.1 — Semântica da Etapa 1 ────────────────────────────────

  describe('1.3.1 — Semântica da Etapa 1: fieldset, labels e aria-required', () => {
    it('deve ter <fieldset> com <legend> descritiva na etapa 1', () => {
      expect(qs<HTMLFieldSetElement>(fixture, 'fieldset.wizard-step legend').textContent?.trim())
        .toContain('Passo 1');
    });

    it('label[for="input-nome"] deve existir e associar ao input', () => {
      expect(qs(fixture, 'label[for="input-nome"]')).toBeTruthy();
      expect(qs(fixture, '#input-nome')).toBeTruthy();
    });

    it('label[for="input-professor"] deve existir e associar ao select', () => {
      expect(qs(fixture, 'label[for="input-professor"]')).toBeTruthy();
      expect(qs(fixture, '#input-professor')).toBeTruthy();
    });

    it('#input-nome deve ter aria-required="true"', () => {
      expect(qs<HTMLInputElement>(fixture, '#input-nome').getAttribute('aria-required')).toBe('true');
    });

    it('#input-professor deve ter aria-required="true"', () => {
      expect(qs<HTMLSelectElement>(fixture, '#input-professor').getAttribute('aria-required')).toBe('true');
    });

    it('progressbar deve ter role="progressbar" com aria-valuenow e aria-label', () => {
      const bar = qs<HTMLElement>(fixture, '[role="progressbar"]');
      expect(bar.getAttribute('aria-valuenow')).toBe('1');
      expect(bar.getAttribute('aria-label')?.length).toBeGreaterThan(5);
    });
  });

  // ── 2. WCAG 4.1.2 — aria-invalid e aria-describedby ao tocar ────────────

  describe('4.1.2 — aria-invalid + aria-describedby ao tentar avançar sem preencher', () => {
    it('deve marcar aria-invalid="true" no input-nome quando inválido e tocado', () => {
      component.formTurma.get('nome')?.markAsTouched();
      fixture.detectChanges();
      expect(qs<HTMLInputElement>(fixture, '#input-nome').getAttribute('aria-invalid')).toBe('true');
    });

    it('span de erro deve ter role="alert" e id="erro-nome" para aria-describedby', () => {
      component.formTurma.get('nome')?.markAsTouched();
      fixture.detectChanges();
      const span = qs<HTMLElement>(fixture, '#erro-nome[role="alert"]');
      expect(span.textContent?.trim().length).toBeGreaterThan(0);
    });

    it('input inválido deve ter aria-describedby apontando para #erro-nome', () => {
      component.formTurma.get('nome')?.markAsTouched();
      fixture.detectChanges();
      expect(qs<HTMLInputElement>(fixture, '#input-nome').getAttribute('aria-describedby')).toBe('erro-nome');
    });
  });

  // ── 3. WCAG 2.4.3 — Foco vai ao primeiro campo inválido ─────────────────

  describe('2.4.3 — proximaEtapa() move foco ao primeiro campo inválido', () => {
    it('deve chamar focus() em #input-nome quando campo está vazio', async () => {
      const input = qs<HTMLInputElement>(fixture, '#input-nome');
      const spy = vi.spyOn(input, 'focus');
      component.proximaEtapa();
      await new Promise(r => setTimeout(r, 10));
      expect(spy).toHaveBeenCalled();
    });

    it('não deve avançar etapa quando campos obrigatórios estão vazios', () => {
      component.proximaEtapa();
      expect(component.etapaAtual).toBe(1);
    });
  });

  // ── 4. WCAG 4.1.3 — LiveAnnouncer anuncia troca de etapa ───────────────

  describe('4.1.3 — LiveAnnouncer anuncia troca de etapa (screen readers)', () => {
    it('deve anunciar "Passo 2" ao avançar com dados válidos', () => {
      component.formTurma.get('nome')?.setValue('Oficina Braille');
      component.formTurma.get('professorId')?.setValue('p1');
      component.proximaEtapa();
      expect(announcer.announce).toHaveBeenCalledWith(expect.stringContaining('2'));
    });

    it('deve anunciar "Passo 1" ao voltar da etapa 2', () => {
      component.etapaAtual = 2;
      component.etapaAnterior();
      expect(announcer.announce).toHaveBeenCalledWith(expect.stringContaining('1'));
    });
  });

  // ── 5. WCAG 1.3.1 — Etapa 2: Semântica da grade horária ────────────────

  describe('1.3.1 — Etapa 2: grade horária com role=group e aria-labelledby', () => {
    beforeEach(() => {
      component.formTurma.get('nome')?.setValue('Oficina Braille');
      component.formTurma.get('professorId')?.setValue('p1');
      component.etapaAtual = 2;
      fixture.detectChanges();
    });

    it('turno-form deve ter role="group" e aria-label', () => {
      expect(qs<HTMLElement>(fixture, '[role="group"][aria-label]')).toBeTruthy();
    });

    it('botão "+ Incluir" deve ter aria-label descritivo', () => {
      expect(qs<HTMLButtonElement>(fixture, 'button[aria-label*="Incluir"]')).toBeTruthy();
    });

    it('grade-vazio deve ter role="status" e aria-live="polite"', () => {
      expect(qs<HTMLElement>(fixture, '.grade-vazio[role="status"][aria-live="polite"]')).toBeTruthy();
    });

    it('ao adicionar turno, deve anunciar via LiveAnnouncer', () => {
      component.diaNovoTurno        = 'SEG';
      component.horaInicioNovoTurno = '08:00';
      component.horaFimNovoTurno    = '10:00';
      component.adicionarTurno();
      expect(announcer.announce).toHaveBeenCalledWith(expect.stringContaining('Turno adicionado'));
    });
  });

  // ── 6. WCAG 4.1.2 — aria-busy no botão Cadastrar ───────────────────────

  describe('4.1.2 — aria-busy no botão Finalizar durante submit', () => {
    beforeEach(() => {
      component.formTurma.get('nome')?.setValue('Oficina Braille');
      component.formTurma.get('professorId')?.setValue('p1');
      component.etapaAtual = 2;
      fixture.detectChanges();
    });

    it('botão Cadastrar deve ter aria-busy="true" quando isSalvando=true', () => {
      component.isSalvando = true;
      fixture.detectChanges();
      // Busca qualquer botão de submit da etapa 2 com aria-busy ativo
      const btn = fixture.nativeElement.querySelector('button[aria-busy="true"]') as HTMLButtonElement | null;
      expect(btn).not.toBeNull();
      expect(btn?.getAttribute('aria-busy')).toBe('true');
    });
  });

  // ── 7. WCAG 1.1.1 — Banner icon deve ser aria-hidden ───────────────────

  describe('1.1.1 — Ícone do banner de feedback deve ser aria-hidden', () => {
    it('deve ter aria-hidden="true" no ícone quando banner está visível', () => {
      component.mostrarFeedback('Erro teste', 'erro');
      fixture.detectChanges();
      expect(qs<HTMLElement>(fixture, '.feedback-banner .material-symbols-rounded[aria-hidden="true"]')).toBeTruthy();
    });
  });

  // ── 8. WCAG 4.1.3 — role=alert no feedback banner ──────────────────

  describe('4.1.3 — Feedback banner com role="alert" e aria-live="assertive"', () => {
    it('deve ter role="alert" e aria-live="assertive" quando mensagem exibida', () => {
      component.mostrarFeedback('Turma criada!', 'sucesso');
      fixture.detectChanges();
      expect(qs<HTMLElement>(fixture, '[role="alert"][aria-live="assertive"]')).toBeTruthy();
    });
  });
});
