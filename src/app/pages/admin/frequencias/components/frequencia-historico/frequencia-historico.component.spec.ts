/**
 * frequencia-historico.component.spec.ts
 *
 * Suite de testes de Acessibilidade (WCAG 2.1 AA/AAA) — FrequenciaHistoricoComponent
 * Runner: Vitest (Angular 19+ @angular/build:unit-test) — sem zone.js, sem fakeAsync.
 *
 * Critérios WCAG cobertos:
 *  1.3.1 — Semântica (label/id, scope, nav paginação, region)
 *  2.1.1 — Teclado (ArrowUp/Down, Esc fecha modal, Tab não interceptado quando modal aberto)
 *  2.4.3 — Ordem de Foco (retorno de foco ao fechar modal)
 *  4.1.2 — Nome, Função e Valor (aria-busy, aria-modal, aria-label no modal, botão fechar)
 *  4.1.3 — Mensagens de Status (aria-live, role=alert, loader com aria-busy)
 *  2.5.3 — Label in Name (botão Detalhes contém turma e data)
 *  1.1.1 — Conteúdo não textual (aria-hidden em ícones decorativos)
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting }  from '@angular/common/http/testing';
import { provideHttpClient }         from '@angular/common/http';
import { By }                        from '@angular/platform-browser';
import { of, throwError }            from 'rxjs';

import { FrequenciaHistoricoComponent } from './frequencia-historico.component';
import { FrequenciasService }  from '../../../../../core/services/frequencias.service';
import { AuthService }         from '../../../../../core/services/auth.service';

// ─── Stubs ───────────────────────────────────────────────────────────────────

const RESUMO_STUB = {
  dataAula: '2026-04-20',
  turmaId:   'turma-1',
  turmaNome: 'Oficina de Braille',
  totalAlunos: 10,
  presentes: 8,
  faltas: 2,
  diarioFechado: false,
  fechadoEm: null,
};

const RESUMO_RESP = {
  data: [RESUMO_STUB],
  meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
};

const DETALHES_RESP = {
  data: [
    { id: 'f1', alunoId: 'a1', presente: true,  aluno: { id: 'a1', nomeCompleto: 'Ana Silva' } },
    { id: 'f2', alunoId: 'a2', presente: false, aluno: { id: 'a2', nomeCompleto: 'Bruno Costa' } },
  ],
  meta: { total: 2, page: 1, limit: 400, totalPages: 1 },
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

describe('FrequenciaHistoricoComponent — Acessibilidade WCAG 2.1 AA', () => {
  let fixture:   ComponentFixture<FrequenciaHistoricoComponent>;
  let component: FrequenciaHistoricoComponent;

  const freqSvc = { listarResumo: vi.fn(), listar: vi.fn() };
  const authSvc = { getUser: vi.fn().mockReturnValue({ role: 'SECRETARIA', sub: 'u1' }) };

  beforeEach(async () => {
    vi.clearAllMocks();
    freqSvc.listarResumo.mockReturnValue(of(RESUMO_RESP));
    freqSvc.listar.mockReturnValue(of(DETALHES_RESP));

    await TestBed.configureTestingModule({
      imports: [FrequenciaHistoricoComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: FrequenciasService, useValue: freqSvc },
        { provide: AuthService,        useValue: authSvc },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(FrequenciaHistoricoComponent);
    component = fixture.componentInstance;
    component.turmas = [{ id: 'turma-1', nome: 'Oficina de Braille' } as any];
    fixture.detectChanges();
  });

  // ── 1. WCAG 1.3.1 — Semântica dos Filtros ────────────────────────────────

  describe('1.3.1 — Semântica dos filtros (label/id, aria-label)', () => {
    it('section deve ter aria-label="Filtros do histórico"', () => {
      expect(qs<HTMLElement>(fixture, 'section[aria-label="Filtros do histórico"]')).toBeTruthy();
    });

    it('label[for="turmaHistorico"] e #turmaHistorico devem existir', () => {
      expect(qs(fixture, 'label[for="turmaHistorico"]')).toBeTruthy();
      expect(qs(fixture, '#turmaHistorico')).toBeTruthy();
    });

    it('botão Filtrar deve ter aria-label="Aplicar filtro"', () => {
      expect(qs<HTMLButtonElement>(fixture, 'button[aria-label="Aplicar filtro"]')).toBeTruthy();
    });
  });

  // ── 2. WCAG 4.1.2 — aria-busy durante carregamento ───────────────────────

  describe('4.1.2 — aria-busy="true" ao carregar histórico', () => {
    it('loader deve ter aria-busy="true" e aria-label enquanto carregando', () => {
      component.carregandoHistorico.set(true);
      fixture.detectChanges();
      const loader = qs<HTMLElement>(fixture, '[aria-busy="true"][aria-label]');
      expect(loader.getAttribute('aria-label')?.length).toBeGreaterThan(0);
    });
  });

  // ── 3. WCAG 4.1.3 — Erro como role="alert" ───────────────────────────────

  describe('4.1.3 — Erro de API anunciado via role="alert"', () => {
    it('deve exibir role="alert" quando listarResumo falha', () => {
      freqSvc.listarResumo.mockReturnValue(throwError(() => new Error('500')));
      component.carregarHistorico();
      fixture.detectChanges();
      expect(qs<HTMLElement>(fixture, '[role="alert"]').textContent?.trim().length).toBeGreaterThan(0);
    });
  });

  // ── 4. WCAG 1.3.1 — Semântica da tabela ──────────────────────────────────

  describe('1.3.1 — Tabela de histórico com region, scope e aria-label', () => {
    it('wrapper deve ter role="region" e aria-label descritivo', () => {
      const region = qs<HTMLElement>(fixture, '[role="region"][aria-label]');
      expect(region.getAttribute('aria-label')?.length).toBeGreaterThan(0);
    });

    it('todos os <th> devem ter scope="col"', () => {
      qsAll<HTMLTableCellElement>(fixture, 'thead th').forEach(th =>
        expect(th.getAttribute('scope')).toBe('col')
      );
    });

    it('linhas tbody devem ter tabindex="0"', () => {
      qsAll<HTMLTableRowElement>(fixture, 'tbody tr').forEach(tr =>
        expect(tr.getAttribute('tabindex')).toBe('0')
      );
    });
  });

  // ── 5. WCAG 2.5.3 — aria-label do botão Detalhes ─────────────────────────

  describe('2.5.3 — Botão Detalhes deve descrever turma e data no aria-label', () => {
    it('aria-label deve conter "Oficina de Braille" e a data formatada', () => {
      const btn = qs<HTMLButtonElement>(fixture, 'button[aria-label*="Oficina de Braille"]');
      const label = btn.getAttribute('aria-label') ?? '';
      expect(label).toContain('Oficina de Braille');
      expect(label).toContain('20/04/2026');
    });
  });

  // ── 6. WCAG 1.3.1 — Paginação semântica ──────────────────────────────────

  describe('1.3.1 + 2.4.8 — Paginação com <nav> e aria-label', () => {
    it('<nav> deve ter aria-label="Paginação do histórico"', () => {
      expect(qs<HTMLElement>(fixture, 'nav[aria-label="Paginação do histórico"]')).toBeTruthy();
    });

    it('botão "Página anterior" deve ter aria-label="Página anterior" e estar disabled na pág 1', () => {
      const btn = qs<HTMLButtonElement>(fixture, 'button[aria-label="Página anterior"]');
      expect(btn).toBeTruthy();
      expect(btn.disabled).toBe(true);
    });

    it('botão "Próxima página" deve ter aria-label="Próxima página"', () => {
      expect(qs<HTMLButtonElement>(fixture, 'button[aria-label="Próxima página"]')).toBeTruthy();
    });
  });

  // ── 7. WCAG 4.1.2 — Modal com role="dialog" e aria-modal ─────────────────

  describe('4.1.2 + 2.4.3 — Modal de detalhes semântico', () => {
    beforeEach(() => {
      const btn = qs<HTMLButtonElement>(fixture, 'button[aria-label*="Oficina de Braille"]');
      btn.focus();
      btn.click();
      fixture.detectChanges();
    });

    it('overlay deve ter role="dialog" e aria-modal="true"', () => {
      expect(qs<HTMLElement>(fixture, '[role="dialog"][aria-modal="true"]')).toBeTruthy();
    });

    it('overlay deve ter aria-label descritivo (não vazio)', () => {
      const label = qs<HTMLElement>(fixture, '[role="dialog"]').getAttribute('aria-label');
      expect(label?.length).toBeGreaterThan(0);
    });

    it('botão Fechar deve ter aria-label="Fechar janela de detalhes"', () => {
      expect(qs<HTMLButtonElement>(fixture, 'button[aria-label="Fechar janela de detalhes"]')).toBeTruthy();
    });

    it('cdkTrapFocus deve estar presente no overlay (WCAG 2.1.2)', () => {
      // CDK TrapFocus adiciona atributo ao elemento host
      const overlay = qs<HTMLElement>(fixture, '[role="dialog"]');
      expect(overlay.hasAttribute('cdktrapfocus')).toBe(true);
    });

    it('Esc deve fechar o modal (WCAG 2.1.1)', () => {
      const overlay = qs<HTMLElement>(fixture, '[role="dialog"]');
      overlay.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      fixture.detectChanges();
      expect(component.modalDetalhesAberto()).toBe(false);
    });

    it('fechar modal deve retornar foco ao botão de origem (WCAG 2.4.3)', async () => {
      const btnDetalhes = fixture.debugElement.queryAll(By.css('button[aria-label*="Oficina de Braille"]'))[0]?.nativeElement as HTMLButtonElement;
      const focusSpy = vi.spyOn(btnDetalhes, 'focus');
      component.fecharDetalhes();
      await new Promise(r => setTimeout(r, 10));
      expect(focusSpy).toHaveBeenCalled();
    });
  });

  // ── 8. WCAG 2.1.1 — Navegação por Teclado ────────────────────────────────

  describe('2.1.1 — ArrowUp/Down na tabela, bloqueado quando modal aberto', () => {
    it('ArrowDown deve chamar keyManager.onKeydown', () => {
      const spy = vi.spyOn(component.keyManager, 'onKeydown');
      fixture.nativeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      expect(spy).toHaveBeenCalled();
    });

    it('ArrowUp deve chamar keyManager.onKeydown', () => {
      const spy = vi.spyOn(component.keyManager, 'onKeydown');
      fixture.nativeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      expect(spy).toHaveBeenCalled();
    });

    it('NÃO deve interceptar ArrowDown quando modal está aberto', () => {
      component.modalDetalhesAberto.set(true);
      fixture.detectChanges();
      const spy = vi.spyOn(component.keyManager, 'onKeydown');
      fixture.nativeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      expect(spy).not.toHaveBeenCalled();
    });
  });

  // ── 9. WCAG 1.1.1 — Ícones decorativos ──────────────────────────────────

  describe('1.1.1 — Ícones decorativos devem ter aria-hidden="true"', () => {
    it('deve haver ícones aria-hidden no loader', () => {
      component.carregandoHistorico.set(true);
      fixture.detectChanges();
      expect(qsAll(fixture, '.material-symbols-rounded[aria-hidden="true"]').length).toBeGreaterThan(0);
    });
  });

  // ── 10. WCAG 4.1.3 — Estado vazio ────────────────────────────────────────

  describe('4.1.3 — Estado vazio exibe mensagem descritiva', () => {
    it('deve renderizar h2 descritivo quando histórico está vazio', () => {
      freqSvc.listarResumo.mockReturnValue(of({ data: [], meta: { total: 0 } }));
      component.carregarHistorico();
      fixture.detectChanges();
      expect(qs<HTMLHeadingElement>(fixture, '.empty-state h2').textContent?.trim().length).toBeGreaterThan(0);
    });
  });
});
