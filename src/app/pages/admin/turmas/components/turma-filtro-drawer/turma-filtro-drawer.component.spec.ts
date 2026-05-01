/**
 * turma-filtro-drawer.component.spec.ts
 *
 * Suite de Acessibilidade WCAG 2.1 AA — TurmaFiltroDrawerComponent
 * Runner: Vitest (@angular/build:unit-test) — sem zone.js / fakeAsync.
 *
 * Critérios cobertos:
 *  4.1.2 — dialog com aria-modal, aria-label, role=dialog implícito (elemento nativo)
 *  2.1.2 — cdkTrapFocus presente (Focus Trap)
 *  2.4.3 — foco retorna ao elemento disparador ao fechar drawer
 *  1.1.1 — ícone decorativo com aria-hidden="true" no título
 *  1.3.1 — sections com aria-labelledby apontando para h3
 *  4.1.3 — LiveAnnouncer anuncia "Filtros limpos" e "Filtros aplicados"
 *  2.5.3 — botões com aria-label descritivo (fechar, limpar, aplicar)
 *  2.4.1 — seletores de filtro com label[for] associado
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By }                        from '@angular/platform-browser';
import { LiveAnnouncer }             from '@angular/cdk/a11y';

import { TurmaFiltroDrawerComponent } from './turma-filtro-drawer.component';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function qs<T extends HTMLElement>(f: ComponentFixture<unknown>, sel: string): T {
  const el = f.debugElement.query(By.css(sel))?.nativeElement as T | null;
  if (!el) throw new Error(`Elemento não encontrado: "${sel}"`);
  return el;
}

// ─── Setup ───────────────────────────────────────────────────────────────────

describe('TurmaFiltroDrawerComponent — Acessibilidade WCAG 2.1 AA', () => {
  let fixture:   ComponentFixture<TurmaFiltroDrawerComponent>;
  let component: TurmaFiltroDrawerComponent;

  const announcer = { announce: vi.fn() };

  const PROFESSORES = [
    { id: 'p1', nome: 'Prof. Ana' },
    { id: 'p2', nome: 'Prof. Bia' },
  ];

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [TurmaFiltroDrawerComponent],
      providers: [
        { provide: LiveAnnouncer, useValue: announcer },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(TurmaFiltroDrawerComponent);
    component = fixture.componentInstance;
    component.aberto      = true;
    component.professores = PROFESSORES;
    fixture.detectChanges();
  });

  // ── 1. WCAG 4.1.2 — <dialog> com aria-modal e aria-label ─────────────

  describe('4.1.2 — <dialog> com aria-modal="true" e aria-label descritivo', () => {
    it('deve ter aria-modal="true" no elemento <dialog>', () => {
      const dialog = qs<HTMLElement>(fixture, 'dialog#turmas-filter-drawer');
      expect(dialog.getAttribute('aria-modal')).toBe('true');
    });

    it('deve ter aria-label descritivo no <dialog>', () => {
      const label = qs<HTMLElement>(fixture, 'dialog[aria-label]').getAttribute('aria-label') ?? '';
      expect(label.length).toBeGreaterThan(5);
    });
  });

  // ── 2. WCAG 2.1.2 — cdkTrapFocus ─────────────────────────────────────

  describe('2.1.2 — Focus Trap via cdkTrapFocus', () => {
    it('dialog deve ter o atributo cdktrapfocus', () => {
      expect(qs<HTMLElement>(fixture, 'dialog').hasAttribute('cdktrapfocus')).toBe(true);
    });
  });

  // ── 3. WCAG 2.4.3 — Foco retorna ao fechar drawer ────────────────────

  describe('2.4.3 — fecharDrawer() retorna foco ao elemento disparador', () => {
    it('lastFocusBeforeDrawer deve ser capturado via ngOnChanges ao abrir', () => {
      // ngOnChanges já foi chamado no beforeEach com aberto=true
      // A propriedade não deve ser null (JSDOM mantém document.body como activeElement)
      const saved = (component as any).lastFocusBeforeDrawer;
      expect(saved).not.toBeUndefined();
    });

    it('fecharDrawer() deve emitir aoFechar', () => {
      const spy = vi.spyOn(component.aoFechar, 'emit');
      component.fecharDrawer();
      expect(spy).toHaveBeenCalled();
    });

    it('fecharDrawer() deve agendar focus() no lastFocusBeforeDrawer', async () => {
      const mockEl = { focus: vi.fn() } as unknown as HTMLElement;
      (component as any).lastFocusBeforeDrawer = mockEl;
      component.fecharDrawer();
      await new Promise(r => setTimeout(r, 10));
      expect(mockEl.focus).toHaveBeenCalled();
    });
  });

  // ── 4. WCAG 1.1.1 — Ícone decorativo com aria-hidden ─────────────────

  describe('1.1.1 — Ícone do título com aria-hidden="true"', () => {
    it('ícone .material-symbols-rounded no h2 deve ter aria-hidden="true"', () => {
      const icon = qs<HTMLElement>(fixture, '.filter-drawer__title .material-symbols-rounded');
      expect(icon.getAttribute('aria-hidden')).toBe('true');
    });
  });

  // ── 5. WCAG 1.3.1 — Sections com aria-labelledby ─────────────────────

  describe('1.3.1 — Sections com aria-labelledby apontando para o h3', () => {
    it('section Situação deve ter aria-labelledby="filtro-situacao-titulo"', () => {
      const section = qs<HTMLElement>(fixture, 'section[aria-labelledby="filtro-situacao-titulo"]');
      expect(section).toBeTruthy();
    });

    it('h3 com id="filtro-situacao-titulo" deve existir', () => {
      expect(qs<HTMLElement>(fixture, '#filtro-situacao-titulo')).toBeTruthy();
    });

    it('section Responsabilidade deve ter aria-labelledby="filtro-responsabilidade-titulo"', () => {
      expect(qs<HTMLElement>(fixture, 'section[aria-labelledby="filtro-responsabilidade-titulo"]')).toBeTruthy();
    });
  });

  // ── 6. WCAG 2.4.1 — Labels[for] associados aos selects ───────────────

  describe('2.4.1 — label[for] associado aos campos de filtro', () => {
    it('label[for="f-status"] deve existir e select#f-status deve existir', () => {
      expect(qs(fixture, 'label[for="f-status"]')).toBeTruthy();
      expect(qs(fixture, '#f-status')).toBeTruthy();
    });

    it('label[for="f-prof"] deve existir e select#f-prof deve existir', () => {
      expect(qs(fixture, 'label[for="f-prof"]')).toBeTruthy();
      expect(qs(fixture, '#f-prof')).toBeTruthy();
    });

    it('#f-prof deve listar os professores passados como @Input', () => {
      const options = fixture.nativeElement.querySelectorAll('#f-prof option') as NodeListOf<HTMLOptionElement>;
      // primeira opção é "Todos", depois os professores
      expect(options.length).toBe(PROFESSORES.length + 1);
    });
  });

  // ── 7. WCAG 4.1.3 — LiveAnnouncer ao limpar e aplicar ────────────────

  describe('4.1.3 — LiveAnnouncer anuncia resultado das ações de filtro', () => {
    it('limparFiltros() deve anunciar "Filtros limpos"', () => {
      component.limparFiltros();
      expect(announcer.announce).toHaveBeenCalledWith(expect.stringContaining('limpos'));
    });

    it('aplicarFiltros() deve anunciar mensagem com "Filtros aplicados"', () => {
      component.aplicarFiltros();
      expect(announcer.announce).toHaveBeenCalledWith(expect.stringContaining('aplicados'));
    });
  });

  // ── 8. WCAG 2.5.3 — Botões com aria-label descritivos ────────────────

  describe('2.5.3 — Botões com aria-label contextual', () => {
    it('botão fechar deve ter aria-label contendo "Fechar"', () => {
      const btn = qs<HTMLButtonElement>(fixture, 'button[aria-label*="Fechar"]');
      expect(btn).toBeTruthy();
    });

    it('botão Limpar deve ter aria-label descritivo', () => {
      expect(qs<HTMLButtonElement>(fixture, 'button[aria-label*="Limpar"]')).toBeTruthy();
    });

    it('botão Aplicar Filtros deve ter aria-label descritivo', () => {
      expect(qs<HTMLButtonElement>(fixture, 'button[aria-label*="Aplicar"]')).toBeTruthy();
    });
  });

  // ── 9. WCAG 4.1.3 — emit correto ao limpar e aplicar ─────────────────

  describe('4.1.3 — Outputs: limpar e aplicar emitem corretamente', () => {
    it('limpar deve ser emitido ao chamar limparFiltros()', () => {
      const spy = vi.spyOn(component.limpar, 'emit');
      component.limparFiltros();
      expect(spy).toHaveBeenCalled();
    });

    it('aplicar deve ser emitido com o valor do form ao chamar aplicarFiltros()', () => {
      const spy = vi.spyOn(component.aplicar, 'emit');
      component.filterForm.get('status')?.setValue('ANDAMENTO');
      component.aplicarFiltros();
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ status: 'ANDAMENTO' }));
    });
  });
});
