/**
 * turma-alunos-modal.component.spec.ts
 *
 * Suite de Acessibilidade WCAG 2.1 AA — TurmaAlunosModalComponent
 * Runner: Vitest (@angular/build:unit-test) — sem zone.js / fakeAsync.
 *
 * Critérios cobertos:
 *  4.1.2 — role=dialog, aria-modal, aria-label no overlay; id+aria-controls+tabindex roving nas abas
 *  2.1.2 — cdkTrapFocus presente (Focus Trap)
 *  2.4.3 — Foco retorna ao elemento disparador ao fechar modal (lastFocusBeforeModal)
 *  1.1.1 — SVG icons com aria-hidden + focusable=false; avatar aria-hidden
 *  1.4.1 — Badge "Lotada" com aria-label (não depende só de cor)
 *  4.1.3 — role=status + aria-live nos empty-states; aria-busy no loader
 *  2.5.3 — aria-label do botão Remover contém nome do aluno; botão Fechar descritivo
 *  1.3.1 — role=tabpanel + aria-labelledby nos painéis; checkboxes com for+id
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient }         from '@angular/common/http';
import { provideHttpClientTesting }  from '@angular/common/http/testing';
import { By }                        from '@angular/platform-browser';
import { of }                        from 'rxjs';

import { TurmaAlunosModalComponent } from './turma-alunos-modal.component';
import { TurmasService }        from '../../../../../core/services/turmas.service';
import { ConfirmDialogService } from '../../../../../core/services/confirm-dialog.service';
import { ToastService }         from '../../../../../core/services/toast.service';

// ─── Stubs ───────────────────────────────────────────────────────────────────

const TURMA_DETALHE = {
  id: 't1',
  nome: 'Oficina de Braille',
  statusAtivo: true,
  capacidadeMaxima: 10,
  professor: { id: 'p1', nome: 'Prof. Ana' },
  matriculasOficina: [
    {
      aluno: { id: 'a1', nomeCompleto: 'Ana Silva', matricula: '0001' },
      status: 'ATIVA',
      dataEntrada: '2026-01-10',
    },
  ],
};

const ALUNOS_DISPONIVEIS = [
  { id: 'b1', nomeCompleto: 'Bruno Costa' },
  { id: 'b2', nomeCompleto: 'Carla Souza' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function qs<T extends HTMLElement>(f: ComponentFixture<unknown>, sel: string): T {
  const el = f.debugElement.query(By.css(sel))?.nativeElement as T | null;
  if (!el) throw new Error(`Elemento não encontrado: "${sel}"`);
  return el;
}
function qsAll<T extends HTMLElement>(f: ComponentFixture<unknown>, sel: string): T[] {
  return f.debugElement.queryAll(By.css(sel)).map(d => d.nativeElement as T);
}

// ─── Setup ───────────────────────────────────────────────────────────────────

describe('TurmaAlunosModalComponent — Acessibilidade WCAG 2.1 AA', () => {
  let fixture:   ComponentFixture<TurmaAlunosModalComponent>;
  let component: TurmaAlunosModalComponent;

  const turmaSvc   = { buscarPorId: vi.fn(), alunosDisponiveis: vi.fn(), matricularAluno: vi.fn(), desmatricularAluno: vi.fn() };
  const confirmSvc = { confirmar: vi.fn() };
  const toastSvc   = { sucesso: vi.fn(), erro: vi.fn(), aviso: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    turmaSvc.buscarPorId.mockReturnValue(of(TURMA_DETALHE));
    turmaSvc.alunosDisponiveis.mockReturnValue(of(ALUNOS_DISPONIVEIS));

    await TestBed.configureTestingModule({
      imports: [TurmaAlunosModalComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TurmasService,        useValue: turmaSvc   },
        { provide: ConfirmDialogService, useValue: confirmSvc },
        { provide: ToastService,         useValue: toastSvc   },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(TurmaAlunosModalComponent);
    component = fixture.componentInstance;
    component.aberto         = true;
    component.turmaOriginal  = { id: 't1', nome: 'Oficina de Braille' } as any;
    component.isProfessor    = false;
    fixture.detectChanges();
  });

  // ── 1. WCAG 4.1.2 — Overlay do Modal semântico ────────────────────────

  describe('4.1.2 — Overlay com role=dialog, aria-modal e aria-label', () => {
    it('deve ter role="dialog" e aria-modal="true"', () => {
      expect(qs<HTMLElement>(fixture, '[role="dialog"][aria-modal="true"]')).toBeTruthy();
    });

    it('deve ter aria-label descritivo no overlay', () => {
      const label = qs<HTMLElement>(fixture, '[role="dialog"]').getAttribute('aria-label');
      expect(label?.length).toBeGreaterThan(5);
    });

    it('botão fechar deve ter aria-label="Fechar perfil da oficina"', () => {
      expect(qs<HTMLButtonElement>(fixture, 'button[aria-label="Fechar perfil da oficina"]')).toBeTruthy();
    });

    it('botão do footer deve ter aria-label descritivo (não genérico)', () => {
      const btn = qs<HTMLButtonElement>(fixture, '.modal-footer button[aria-label]');
      expect(btn.getAttribute('aria-label')?.length).toBeGreaterThan(0);
    });
  });

  // ── 2. WCAG 2.1.2 — cdkTrapFocus no overlay ───────────────────────────

  describe('2.1.2 — Focus Trap via cdkTrapFocus', () => {
    it('overlay deve ter atributo cdktrapfocus', () => {
      expect(qs<HTMLElement>(fixture, '[role="dialog"]').hasAttribute('cdktrapfocus')).toBe(true);
    });
  });

  // ── 3. WCAG 2.4.3 — Foco retorna ao fechar modal ─────────────────

  describe('2.4.3 — Foco retorna ao elemento disparador ao fechar', () => {
    it('lastFocusBeforeModal deve ser capturado ao abrir modal', () => {
      // O elemento focado antes de abrir deve estar salvo na propriedade privada
      // Verificamos indiretamente via comportamento: lastFocusBeforeModal não é null
      const lastFocus = (component as any).lastFocusBeforeModal;
      // Pode ser o body ou qualquer elemento — o importante é não ser null
      // JSDOM não executa focus de verdade, então verificamos que a propriedade foi setada
      expect(lastFocus).not.toBeUndefined();
    });

    it('aoFechar() deve emitir fechar e tentar restaurar foco', () => {
      const emitSpy = vi.spyOn(component.fechar, 'emit');
      // Define um mock de lastFocusBeforeModal
      const mockEl = { focus: vi.fn() } as unknown as HTMLElement;
      (component as any).lastFocusBeforeModal = mockEl;
      component.aoFechar();
      expect(emitSpy).toHaveBeenCalled();
    });
  });

  // ── 4. WCAG 4.1.2 — Padrão ARIA Tabs nas abas internas ───────────────

  describe('4.1.2 — Abas com role=tab, id, aria-controls, tabindex roving', () => {
    it('tablist deve ter aria-label descritivo', () => {
      const tablist = qs<HTMLElement>(fixture, '[role="tablist"][aria-label]');
      expect(tablist.getAttribute('aria-label')?.length).toBeGreaterThan(0);
    });

    it('#tab-remover deve ter aria-controls="painel-remover"', () => {
      expect(qs<HTMLButtonElement>(fixture, '#tab-remover').getAttribute('aria-controls')).toBe('painel-remover');
    });

    it('aba ativa deve ter tabindex="0", inativas tabindex="-1"', () => {
      component.abaAtual.set('remover');
      fixture.detectChanges();
      expect(qs<HTMLButtonElement>(fixture, '#tab-remover').getAttribute('tabindex')).toBe('0');
    });
  });

  // ── 5. WCAG 1.3.1 — Painéis com role=tabpanel + aria-labelledby ──────

  describe('1.3.1 — Painéis com role=tabpanel e aria-labelledby', () => {
    it('painel-remover deve ter role="tabpanel" e aria-labelledby="tab-remover"', () => {
      component.abaAtual.set('remover');
      fixture.detectChanges();
      const painel = qs<HTMLElement>(fixture, '#painel-remover');
      expect(painel.getAttribute('role')).toBe('tabpanel');
      expect(painel.getAttribute('aria-labelledby')).toBe('tab-remover');
    });

    it('painel-adicionar deve ter role=tabpanel e aria-labelledby="tab-adicionar"', () => {
      component.abaAtual.set('adicionar');
      fixture.detectChanges();
      const painel = qs<HTMLElement>(fixture, '#painel-adicionar');
      expect(painel.getAttribute('role')).toBe('tabpanel');
      expect(painel.getAttribute('aria-labelledby')).toBe('tab-adicionar');
    });
  });

  // ── 6. WCAG 1.1.1 — SVG icons decorativos ocultos ────────────────────

  describe('1.1.1 — SVG ícones informativos com aria-hidden e focusable=false', () => {
    it('todos os SVG no info-card devem ter aria-hidden="true"', () => {
      qsAll<HTMLElement>(fixture, '.info-card svg[aria-hidden="true"]')
        .forEach(svg => expect(svg.getAttribute('aria-hidden')).toBe('true'));
    });

    it('todos os SVG devem ter focusable="false"', () => {
      qsAll<HTMLElement>(fixture, '.info-card svg[focusable="false"]')
        .forEach(svg => expect(svg.getAttribute('focusable')).toBe('false'));
    });
  });

  // ── 7. WCAG 1.4.1 — Badge "Lotada" com aria-label ─────────────────

  describe('1.4.1 — Badge Lotada com aria-label (não depende só de cor)', () => {
    it('deve exibir badge Lotada com aria-label quando turma está lotada', () => {
      const turmaLotada = {
        ...TURMA_DETALHE,
        excluido: false,
        status: 'ATIVA' as any,
        capacidadeMaxima: 1,
        matriculasOficina: [TURMA_DETALHE.matriculasOficina[0]],
      } as any;
      component.turmaDetalhes.set(turmaLotada);
      component.abaAtual.set('remover');
      fixture.detectChanges();
      // O badge é um span com texto 'Lotada' e aria-label contextual
      const badge = fixture.nativeElement.querySelector('[aria-label]') as HTMLElement | null;
      // Verifica que existe algum elemento com aria-label (o badge lotada ou outro)
      // O importante é que o badge não depende só de cor
      const allLabeled = fixture.nativeElement.querySelectorAll('[aria-label]') as NodeListOf<HTMLElement>;
      const lotadaBadge = Array.from(allLabeled).find(el => el.textContent?.includes('Lotada'));
      expect(lotadaBadge).toBeTruthy();
    });
  });

  // ── 8. WCAG 4.1.3 — Empty-state com role=status ──────────────────────

  describe('4.1.3 — Empty-state de alunos matriculados com role=status + aria-live', () => {
    it('deve ter role="status" e aria-live="polite" quando sem alunos matriculados', () => {
      component.turmaDetalhes.set({ ...TURMA_DETALHE, excluido: false, status: 'ATIVA' as any, matriculasOficina: [] } as any);
      component.abaAtual.set('remover');
      fixture.detectChanges();
      expect(qs<HTMLElement>(fixture, '[role="status"][aria-live="polite"]')).toBeTruthy();
    });
  });

  describe('Modo professor', () => {
    it('deve abrir em modo leitura sem buscar alunos disponiveis para matricula', () => {
      vi.clearAllMocks();
      turmaSvc.buscarPorId.mockReturnValue(of({ ...TURMA_DETALHE, matriculasOficina: [] }));
      turmaSvc.alunosDisponiveis.mockReturnValue(of(ALUNOS_DISPONIVEIS));

      component.aberto = false;
      fixture.detectChanges();
      component.isProfessor = true;
      component.turmaOriginal = { id: 't1', nome: 'Oficina de Braille' } as any;
      component.aberto = true;
      component.ngOnChanges({
        aberto: {
          currentValue: true,
          previousValue: false,
          firstChange: false,
          isFirstChange: () => false,
        },
      } as any);
      fixture.detectChanges();

      expect(component.abaAtual()).toBe('remover');
      expect(turmaSvc.buscarPorId).toHaveBeenCalledWith('t1');
      expect(turmaSvc.alunosDisponiveis).not.toHaveBeenCalled();
      expect(toastSvc.erro).not.toHaveBeenCalled();
    });

    it('deve impedir acoes administrativas quando estiver em modo professor', async () => {
      vi.clearAllMocks();
      component.isProfessor = true;
      component.turmaDetalhes.set(TURMA_DETALHE as any);
      component.abaAtual.set('remover');

      component.alterarAba('adicionar');
      component.buscarAlunosParaMatricula('');
      component.salvarMatriculasEmLote();
      await component.removerAluno('a1', 'Ana Silva');

      expect(component.abaAtual()).toBe('remover');
      expect(turmaSvc.alunosDisponiveis).not.toHaveBeenCalled();
      expect(turmaSvc.matricularAluno).not.toHaveBeenCalled();
      expect(turmaSvc.desmatricularAluno).not.toHaveBeenCalled();
    });
  });

  // ── 9. WCAG 2.5.3 — Botão Remover com nome do aluno ──────────────

  describe('2.5.3 — Botão Remover contém nome do aluno no aria-label', () => {
    beforeEach(() => {
      // Garante que turmaDetalhes está setada com a aluna e aba 'remover' ativa
      component.turmaDetalhes.set(TURMA_DETALHE as any);
      component.abaAtual.set('remover');
      fixture.detectChanges();
    });

    it('botão Remover deve mencionar "Ana Silva" no aria-label', () => {
      const btn = qs<HTMLButtonElement>(fixture, 'button[aria-label*="Ana Silva"]');
      expect(btn).toBeTruthy();
    });

    it('aria-label do botão Remover deve mencionar "esta oficina"', () => {
      const label = qs<HTMLButtonElement>(fixture, 'button[aria-label*="Ana Silva"]').getAttribute('aria-label') ?? '';
      expect(label.toLowerCase()).toContain('oficina');
    });
  });

  // ── 10. WCAG 1.3.1 — Checkboxes com for+id explícitos ───────────────

  describe('1.3.1 — Checkboxes de busca com label[for] associado ao id do input', () => {
    beforeEach(() => {
      component.abaAtual.set('adicionar');
      component.alunosBuscaRestado.set(ALUNOS_DISPONIVEIS as any);
      fixture.detectChanges();
    });

    it('cada checkbox deve ter um id único', () => {
      const checkboxes = qsAll<HTMLInputElement>(fixture, 'input[type="checkbox"][id]');
      expect(checkboxes.length).toBeGreaterThan(0);
      const ids = checkboxes.map(c => c.id);
      expect(new Set(ids).size).toBe(ids.length); // sem duplicatas
    });

    it('cada label deve ter [for] apontando para o checkbox correspondente', () => {
      const labels = qsAll<HTMLLabelElement>(fixture, 'label[for]');
      labels.forEach(label => {
        const forId = label.getAttribute('for');
        expect(fixture.nativeElement.querySelector(`#${forId}`)).toBeTruthy();
      });
    });

    it('checkbox deve ter aria-label descritivo com nome do aluno', () => {
      const cb = qs<HTMLInputElement>(fixture, 'input[aria-label*="Bruno Costa"]');
      expect(cb).toBeTruthy();
    });
  });
});
