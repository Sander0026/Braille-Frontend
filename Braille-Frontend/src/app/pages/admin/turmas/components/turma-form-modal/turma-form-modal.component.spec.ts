/**
 * turma-form-modal.component.spec.ts
 *
 * Suite de Acessibilidade WCAG 2.1 AA — TurmaFormModalComponent
 * Runner: Vitest (@angular/build:unit-test) — sem zone.js / fakeAsync.
 *
 * Critérios cobertos:
 *  4.1.2 — role=dialog, aria-modal no overlay; label[for]+id nos inputs do turno
 *  2.1.2 — cdkTrapFocus (Focus Trap)
 *  2.4.3 — foco retorna ao elemento disparador ao fechar
 *  1.1.1 — aria-hidden no ícone de erro do turno
 *  1.3.1 — aria-describedby nos campos inválidos; fieldset+legend; role=group no turno-form
 *  4.1.3 — role=alert no erroAPI e erros de campo; role=status na grade vazia;
 *           LiveAnnouncer para adição/remoção de turno
 *  2.5.3 — aria-label descritivo no botão Remover turno; botão fechar contextual;
 *           aria-label dinâmico no submit
 *  4.1.2 — aria-busy no botão submit durante salvando=true
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By }                        from '@angular/platform-browser';
import { LiveAnnouncer }             from '@angular/cdk/a11y';

import { TurmaFormModalComponent }   from './turma-form-modal.component';

// ─── Stubs ───────────────────────────────────────────────────────────────────

const PROFESSORES = [
  { id: 'p1', nome: 'Prof. Ana', role: 'PROFESSOR' },
  { id: 'p2', nome: 'Prof. Bia', role: 'PROFESSOR' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function qs<T extends HTMLElement>(f: ComponentFixture<unknown>, sel: string): T {
  const el = f.debugElement.query(By.css(sel))?.nativeElement as T | null;
  if (!el) throw new Error(`Elemento não encontrado: "${sel}"`);
  return el;
}

// ─── Setup ───────────────────────────────────────────────────────────────────

describe('TurmaFormModalComponent — Acessibilidade WCAG 2.1 AA', () => {
  let fixture:   ComponentFixture<TurmaFormModalComponent>;
  let component: TurmaFormModalComponent;

  const announcer = { announce: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [TurmaFormModalComponent],
      providers: [
        { provide: LiveAnnouncer, useValue: announcer },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(TurmaFormModalComponent);
    component = fixture.componentInstance;
    component.aberto      = true;
    component.professores = PROFESSORES as any;
    component.turmaEdicao = null;
    component.salvando    = false;
    component.erroAPI     = '';
    fixture.detectChanges();
  });

  // ── 1. WCAG 4.1.2 — Overlay com role=dialog e aria-modal ────────────

  describe('4.1.2 — Overlay com role="dialog" e aria-modal="true"', () => {
    it('deve ter role="dialog" no overlay', () => {
      expect(qs<HTMLElement>(fixture, '[role="dialog"]')).toBeTruthy();
    });

    it('deve ter aria-modal="true" no overlay', () => {
      expect(qs<HTMLElement>(fixture, '[role="dialog"]').getAttribute('aria-modal')).toBe('true');
    });

    it('aria-label do overlay deve mencionar "nova oficina" no modo criação', () => {
      const label = qs<HTMLElement>(fixture, '[role="dialog"]').getAttribute('aria-label') ?? '';
      expect(label.toLowerCase()).toContain('nova');
    });

    it('aria-label do overlay deve mencionar "editar" no modo edição', () => {
      component.modoEdicao = true;
      fixture.detectChanges();
      const label = qs<HTMLElement>(fixture, '[role="dialog"]').getAttribute('aria-label') ?? '';
      expect(label.toLowerCase()).toContain('editar');
    });
  });

  // ── 2. WCAG 2.1.2 — cdkTrapFocus ─────────────────────────────────────

  describe('2.1.2 — Focus Trap via cdkTrapFocus', () => {
    it('overlay deve ter atributo cdktrapfocus', () => {
      expect(qs<HTMLElement>(fixture, '[role="dialog"]').hasAttribute('cdktrapfocus')).toBe(true);
    });
  });

  // ── 3. WCAG 2.4.3 — Foco retorna ao fechar ───────────────────────────

  describe('2.4.3 — Foco retorna ao elemento disparador ao fechar', () => {
    it('aoFechar() com form pristine deve emitir fechar e agendar restauração de foco', async () => {
      // Form começa pristine (sem alterações) → deve emitir fechar (não tentarFecharSujo)
      const emitSpy = vi.spyOn(component.fechar, 'emit');
      const mockEl  = { focus: vi.fn() } as unknown as HTMLElement;
      (component as any).lastFocusBeforeModal = mockEl;

      // Garante que o form está pristine e a grade igual ao original
      component.turmaForm.reset();
      component.gradeOriginalStr = JSON.stringify([]);
      
      component.aoFechar();

      expect(emitSpy).toHaveBeenCalled();
      await new Promise(r => setTimeout(r, 10));
      expect(mockEl.focus).toHaveBeenCalled();
    });

    it('aoFechar() com form sujo deve emitir tentarFecharSujo ao invés de fechar', () => {
      component.turmaForm.get('nome')?.setValue('Teste sujo');
      component.turmaForm.markAsDirty();
      const spy = vi.spyOn(component.tentarFecharSujo, 'emit');
      component.aoFechar();
      expect(spy).toHaveBeenCalledWith(true);
    });
  });

  // ── 4. WCAG 1.3.1 — Semântica dos campos obrigatórios ────────────────

  describe('1.3.1 — label[for]+id, aria-required e aria-describedby', () => {
    it('label[for="modalNomeTurma"] deve existir e #modalNomeTurma deve existir', () => {
      expect(qs(fixture, 'label[for="modalNomeTurma"]')).toBeTruthy();
      expect(qs(fixture, '#modalNomeTurma')).toBeTruthy();
    });

    it('#modalNomeTurma deve ter aria-required="true"', () => {
      expect(qs<HTMLInputElement>(fixture, '#modalNomeTurma').getAttribute('aria-required')).toBe('true');
    });

    it('#modalProfessor deve ter aria-required="true"', () => {
      expect(qs<HTMLSelectElement>(fixture, '#modalProfessor').getAttribute('aria-required')).toBe('true');
    });

    it('label[for="modalCapacidade"] e #modalCapacidade devem existir', () => {
      expect(qs(fixture, 'label[for="modalCapacidade"]')).toBeTruthy();
      expect(qs(fixture, '#modalCapacidade')).toBeTruthy();
    });

    it('label[for="modalDescricao"] e #modalDescricao devem existir', () => {
      expect(qs(fixture, 'label[for="modalDescricao"]')).toBeTruthy();
      expect(qs(fixture, '#modalDescricao')).toBeTruthy();
    });
  });

  // ── 5. WCAG 1.3.1 — aria-invalid + aria-describedby ao tocar ─────────

  describe('1.3.1 — aria-invalid e aria-describedby sincronizados com erros', () => {
    it('#modalNomeTurma deve ter aria-invalid="true" quando tocado e inválido', () => {
      component.turmaForm.get('nome')?.markAsTouched();
      fixture.detectChanges();
      expect(qs<HTMLInputElement>(fixture, '#modalNomeTurma').getAttribute('aria-invalid')).toBe('true');
    });

    it('#modalNomeTurma deve ter aria-describedby="erro-nome-turma" quando inválido', () => {
      component.turmaForm.get('nome')?.markAsTouched();
      fixture.detectChanges();
      expect(qs<HTMLInputElement>(fixture, '#modalNomeTurma').getAttribute('aria-describedby'))
        .toBe('erro-nome-turma');
    });

    it('#erro-nome-turma deve ter role="alert" e conteúdo de texto', () => {
      component.turmaForm.get('nome')?.markAsTouched();
      fixture.detectChanges();
      const span = qs<HTMLElement>(fixture, '#erro-nome-turma[role="alert"]');
      expect(span.textContent?.trim().length).toBeGreaterThan(0);
    });

    it('erroAPI deve ter role="alert" e aria-live="assertive"', () => {
      component.erroAPI = 'Erro de servidor';
      fixture.detectChanges();
      expect(qs<HTMLElement>(fixture, '.error-banner[role="alert"][aria-live="assertive"]')).toBeTruthy();
    });
  });

  // ── 6. WCAG 1.3.1 — fieldset+legend e role=group no turno-form ───────

  describe('1.3.1 — fieldset+legend para grade horária e role=group no turno-form', () => {
    it('deve ter fieldset.grade-horaria-fieldset com legend', () => {
      expect(qs<HTMLFieldSetElement>(fixture, 'fieldset.grade-horaria-fieldset legend')).toBeTruthy();
    });

    it('turno-form deve ter role="group" e aria-label', () => {
      expect(qs<HTMLElement>(fixture, '.turno-form[role="group"][aria-label]')).toBeTruthy();
    });
  });

  // ── 7. WCAG 4.1.2 — inputs do turno com id + label[for] ─────────────

  describe('4.1.2 — inputs do turno com id e label[for] (sr-only)', () => {
    it('select#turno-dia deve existir com label sr-only', () => {
      expect(qs(fixture, '#turno-dia')).toBeTruthy();
      expect(qs(fixture, 'label[for="turno-dia"]')).toBeTruthy();
    });

    it('input#turno-hora-inicio deve existir com label sr-only', () => {
      expect(qs(fixture, '#turno-hora-inicio')).toBeTruthy();
      expect(qs(fixture, 'label[for="turno-hora-inicio"]')).toBeTruthy();
    });

    it('input#turno-hora-fim deve existir com label sr-only', () => {
      expect(qs(fixture, '#turno-hora-fim')).toBeTruthy();
      expect(qs(fixture, 'label[for="turno-hora-fim"]')).toBeTruthy();
    });

    it('botão Incluir deve ter aria-label descritivo', () => {
      expect(qs<HTMLButtonElement>(fixture, 'button[aria-label*="Incluir"]')).toBeTruthy();
    });
  });

  // ── 8. WCAG 4.1.3 — LiveAnnouncer ao adicionar/remover turno ─────────

  describe('4.1.3 — LiveAnnouncer anuncia adição e remoção de turno', () => {
    it('deve anunciar quando turno é adicionado', () => {
      component.diaNovoTurno.set('SEG');
      component.horaInicioNovoTurno.set('08:00');
      component.horaFimNovoTurno.set('10:00');
      component.adicionarTurno();
      expect(announcer.announce).toHaveBeenCalledWith(expect.stringContaining('Segunda'));
    });

    it('deve anunciar quando turno é removido', () => {
      component.gradeHoraria.set([{ dia: 'TER', horaInicio: '14:00', horaFim: '16:00' }]);
      component.removerTurno(0);
      expect(announcer.announce).toHaveBeenCalledWith(expect.stringContaining('Terça'));
    });
  });

  // ── 9. WCAG 1.1.1 — Ícone de erro do turno com aria-hidden ──────────

  describe('1.1.1 — Ícone de erro com aria-hidden="true"', () => {
    it('ícone de erro do turno deve ter aria-hidden="true"', () => {
      component.erroTurno.set('Preencha todos os campos.');
      fixture.detectChanges();
      const icon = qs<HTMLElement>(fixture, '.error-with-icon .material-symbols-rounded');
      expect(icon.getAttribute('aria-hidden')).toBe('true');
    });
  });

  // ── 10. WCAG 4.1.3 — role=status na grade vazia ─────────────────────

  describe('4.1.3 — Estado vazio da grade com role="status" e aria-live', () => {
    it('deve ter role="status" e aria-live="polite" quando não há turnos', () => {
      expect(qs<HTMLElement>(fixture, '[role="status"][aria-live="polite"]')).toBeTruthy();
    });
  });

  // ── 11. WCAG 2.5.3 — Botão Remover com contexto do dia e horário ─────

  describe('2.5.3 — Botão Remover turno com aria-label contendo dia e horário', () => {
    beforeEach(() => {
      component.gradeHoraria.set([{ dia: 'QUA', horaInicio: '08:00', horaFim: '10:00' }]);
      fixture.detectChanges();
    });

    it('botão remover deve conter "Quarta" no aria-label', () => {
      const btn = qs<HTMLButtonElement>(fixture, 'button[aria-label*="Quarta"]');
      expect(btn).toBeTruthy();
    });

    it('botão remover deve conter horário no aria-label', () => {
      const label = qs<HTMLButtonElement>(fixture, 'button[aria-label*="Quarta"]').getAttribute('aria-label') ?? '';
      expect(label).toContain('08:00');
    });
  });

  // ── 12. WCAG 4.1.2 — aria-busy e aria-label no submit ───────────────

  describe('4.1.2 — aria-busy e aria-label dinâmico no botão submit', () => {
    it('botão submit deve ter aria-busy="true" quando salvando=true', () => {
      component.salvando = true;
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('button[type="submit"][aria-busy="true"]') as HTMLButtonElement | null;
      expect(btn).not.toBeNull();
    });

    it('botão submit deve ter aria-label mencionando "Criar" no modo criação', () => {
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('button[type="submit"][aria-label]') as HTMLButtonElement | null;
      expect(btn?.getAttribute('aria-label')?.toLowerCase()).toContain('criar');
    });
  });

  // ── 13. WCAG 2.5.3 — Botão fechar contextual ────────────────────────

  describe('2.5.3 — Botão fechar com aria-label contextual por modo', () => {
    it('modo criação: botão fechar deve mencionar "criação" ou "nova"', () => {
      const label = qs<HTMLButtonElement>(fixture, '.modal-close[aria-label]').getAttribute('aria-label') ?? '';
      expect(label.toLowerCase()).toMatch(/criar|nova/);
    });

    it('modo edição: botão fechar deve mencionar "edição"', () => {
      component.modoEdicao = true;
      fixture.detectChanges();
      const label = qs<HTMLButtonElement>(fixture, '.modal-close[aria-label]').getAttribute('aria-label') ?? '';
      expect(label.toLowerCase()).toContain('edição');
    });
  });
});
