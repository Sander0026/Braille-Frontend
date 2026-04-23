/**
 * frequencias-lista.spec.ts
 *
 * Suite de Acessibilidade WCAG 2.1 AA — FrequenciasLista (orquestradora de abas)
 * Runner: Vitest (@angular/build:unit-test) — sem zone.js / fakeAsync.
 *
 * Critérios cobertos:
 *  4.1.2 — Name, Role, Value: role=tab, aria-selected, aria-controls, tabindex roving
 *  4.1.3 — Mensagens de status: live region anuncia troca de aba
 *  2.1.1 — Teclado: abas são ativadas por click; tab-inativas têm tabindex=-1
 *  2.4.3 — Ordem de foco: painéis têm role=tabpanel + aria-labelledby
 *  1.3.1 — Semântica: nav[role=tablist] + aria-label, painéis identificados
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient }         from '@angular/common/http';
import { provideHttpClientTesting }  from '@angular/common/http/testing';
import { By }                        from '@angular/platform-browser';
import { of }                        from 'rxjs';

import { FrequenciasLista }  from './frequencias-lista';
import { TurmasService }     from '../../../../core/services/turmas.service';
import { AuthService }       from '../../../../core/services/auth.service';

// ─── Stubs ───────────────────────────────────────────────────────────────────

const TURMAS_RESP = {
  data: [{ id: 't1', nome: 'Oficina de Braille', statusAtivo: true }],
  meta: { total: 1, page: 1, limit: 100, totalPages: 1 },
};

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

describe('FrequenciasLista — Acessibilidade WCAG 2.1 AA (Tab Panel)', () => {
  let fixture:   ComponentFixture<FrequenciasLista>;
  let component: FrequenciasLista;

  const turmaSvc = { listar: vi.fn() };
  const authSvc  = { getUser: vi.fn().mockReturnValue({ role: 'SECRETARIA', sub: 'u1' }) };

  beforeEach(async () => {
    vi.clearAllMocks();
    turmaSvc.listar.mockReturnValue(of(TURMAS_RESP));

    await TestBed.configureTestingModule({
      imports: [FrequenciasLista],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TurmasService, useValue: turmaSvc },
        { provide: AuthService,   useValue: authSvc  },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(FrequenciasLista);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── 1. WCAG 1.3.1 — nav[role=tablist] semântico ─────────────────────────

  describe('1.3.1 — nav[role=tablist] com aria-label', () => {
    it('deve ter nav[role="tablist"][aria-label]', () => {
      const nav = qs<HTMLElement>(fixture, 'nav[role="tablist"][aria-label]');
      expect(nav.getAttribute('aria-label')?.length).toBeGreaterThan(0);
    });

    it('deve ter exatamente 3 botões role="tab"', () => {
      expect(qsAll(fixture, '[role="tab"]').length).toBe(3);
    });
  });

  // ── 2. WCAG 4.1.2 — aria-controls + aria-selected nos tabs ──────────────

  describe('4.1.2 — Cada tab deve ter id, aria-controls e aria-selected', () => {
    it('tab Chamada deve ter id="tab-chamada" e aria-controls="painel-chamada"', () => {
      const tab = qs<HTMLButtonElement>(fixture, '#tab-chamada');
      expect(tab.getAttribute('aria-controls')).toBe('painel-chamada');
    });

    it('tab Histórico deve ter id="tab-historico" e aria-controls="painel-historico"', () => {
      const tab = qs<HTMLButtonElement>(fixture, '#tab-historico');
      expect(tab.getAttribute('aria-controls')).toBe('painel-historico');
    });

    it('tab Relatório deve ter id="tab-relatorio" e aria-controls="painel-relatorio"', () => {
      const tab = qs<HTMLButtonElement>(fixture, '#tab-relatorio');
      expect(tab.getAttribute('aria-controls')).toBe('painel-relatorio');
    });

    it('aba ativa (chamada) deve ter aria-selected="true"', () => {
      expect(qs<HTMLButtonElement>(fixture, '#tab-chamada').getAttribute('aria-selected')).toBe('true');
    });

    it('abas inativas devem ter aria-selected="false"', () => {
      expect(qs<HTMLButtonElement>(fixture, '#tab-historico').getAttribute('aria-selected')).toBe('false');
      expect(qs<HTMLButtonElement>(fixture, '#tab-relatorio').getAttribute('aria-selected')).toBe('false');
    });
  });

  // ── 3. WCAG 2.1.1 — Tabindex roving nas abas ─────────────────────────────

  describe('2.1.1 — Tabindex roving: ativa=0, inativas=-1', () => {
    it('tab ativa deve ter tabindex="0"', () => {
      expect(qs<HTMLButtonElement>(fixture, '#tab-chamada').getAttribute('tabindex')).toBe('0');
    });

    it('tabs inativas devem ter tabindex="-1"', () => {
      expect(qs<HTMLButtonElement>(fixture, '#tab-historico').getAttribute('tabindex')).toBe('-1');
      expect(qs<HTMLButtonElement>(fixture, '#tab-relatorio').getAttribute('tabindex')).toBe('-1');
    });

    it('ao mudar para Histórico, tabindex deve atualizar corretamente', () => {
      component.mudarAba('historico');
      fixture.detectChanges();
      expect(qs<HTMLButtonElement>(fixture, '#tab-historico').getAttribute('tabindex')).toBe('0');
      expect(qs<HTMLButtonElement>(fixture, '#tab-chamada').getAttribute('tabindex')).toBe('-1');
    });
  });

  // ── 4. WCAG 2.4.3 — Painéis com role=tabpanel e aria-labelledby ─────────

  describe('2.4.3 — Painéis com role="tabpanel" + aria-labelledby', () => {
    it('painel-chamada deve ter role="tabpanel" e aria-labelledby="tab-chamada"', () => {
      const painel = qs<HTMLElement>(fixture, '#painel-chamada');
      expect(painel.getAttribute('role')).toBe('tabpanel');
      expect(painel.getAttribute('aria-labelledby')).toBe('tab-chamada');
    });

    it('painel-historico deve ter role="tabpanel" e aria-labelledby="tab-historico"', () => {
      const painel = qs<HTMLElement>(fixture, '#painel-historico');
      expect(painel.getAttribute('role')).toBe('tabpanel');
      expect(painel.getAttribute('aria-labelledby')).toBe('tab-historico');
    });

    it('painel-relatorio deve ter role="tabpanel" e aria-labelledby="tab-relatorio"', () => {
      const painel = qs<HTMLElement>(fixture, '#painel-relatorio');
      expect(painel.getAttribute('role')).toBe('tabpanel');
      expect(painel.getAttribute('aria-labelledby')).toBe('tab-relatorio');
    });
  });

  // ── 5. WCAG 4.1.3 — Live region anuncia troca de aba ────────────────────

  describe('4.1.3 — Live region anuncia troca de aba', () => {
    it('live region deve ter aria-live="polite" e aria-atomic="true"', () => {
      const region = qs<HTMLElement>(fixture, '[aria-live="polite"][aria-atomic="true"]');
      expect(region).toBeTruthy();
    });

    it('ao mudar aba, live region deve receber texto descritivo', () => {
      const region = qs<HTMLElement>(fixture, '#freq-anuncio');
      component.mudarAba('historico');
      expect(region.textContent?.toLowerCase()).toContain('histórico');
    });

    it('ao mudar para Relatório, live region deve mencionar "Relatório Individual"', () => {
      const region = qs<HTMLElement>(fixture, '#freq-anuncio');
      component.mudarAba('relatorio');
      expect(region.textContent?.toLowerCase()).toContain('relatório');
    });
  });

  // ── 6. WCAG 1.1.1 — Ícones das abas devem ser aria-hidden ───────────────

  describe('1.1.1 — Ícones nos botões de aba são decorativos (aria-hidden)', () => {
    it('todos ícones dentro de [role="tab"] devem ter aria-hidden="true"', () => {
      const icons = qsAll<HTMLElement>(fixture, '[role="tab"] .material-symbols-rounded[aria-hidden="true"]');
      expect(icons.length).toBe(3); // um por aba
    });
  });
});
