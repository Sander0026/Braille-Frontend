/**
 * frequencia-chamada.component.spec.ts
 *
 * Suite de testes de Acessibilidade (WCAG 2.1 AA/AAA) — FrequenciaChamadaComponent
 * Runner: Vitest (Angular 19+ @angular/build:unit-test) — sem zone.js, sem fakeAsync.
 *
 * Critérios WCAG cobertos:
 *  1.3.1 — Semântica e Relações (label/id, scope, aria-label, caption)
 *  2.1.1 — Teclado (ArrowUp/Down, Tab não interceptado)
 *  4.1.2 — Nome, Função e Valor (aria-busy, aria-disabled, aria-required)
 *  4.1.3 — Mensagens de Status (aria-live, role=alert)
 *  2.5.3 — Label in Name (aria-label contém texto visível do aluno)
 *  1.1.1 — Conteúdo não textual (aria-hidden em ícones decorativos)
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting }  from '@angular/common/http/testing';
import { provideHttpClient }         from '@angular/common/http';
import { By }                        from '@angular/platform-browser';
import { of, throwError }            from 'rxjs';

import { FrequenciaChamadaComponent } from './frequencia-chamada.component';
import { FrequenciasService }  from '../../../../../core/services/frequencias.service';
import { TurmasService }       from '../../../../../core/services/turmas.service';
import { AuthService }         from '../../../../../core/services/auth.service';

// ─── Stubs ───────────────────────────────────────────────────────────────────

const TURMA_STUB = {
  id: 'turma-1',
  nome: 'Oficina de Braille',
  matriculasOficina: [
    { aluno: { id: 'aluno-1', nomeCompleto: 'Ana Silva' } },
    { aluno: { id: 'aluno-2', nomeCompleto: 'Bruno Costa' } },
  ],
};

const FREQ_RESP = {
  data: [
    { id: 'f1', alunoId: 'aluno-1', presente: true,  status: 'PRESENTE' },
    { id: 'f2', alunoId: 'aluno-2', presente: false, status: 'FALTA'    },
  ],
  meta: { total: 2, page: 1, limit: 100, totalPages: 1 },
};

const FJ_RESP = {
  data: [{ id: 'f1', alunoId: 'aluno-1', presente: false, status: 'FALTA_JUSTIFICADA' }],
  meta: { total: 1, page: 1, limit: 100, totalPages: 1 },
};

const TURMA_SEM_ALUNOS = { ...TURMA_STUB, matriculasOficina: [] };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function qs<T extends HTMLElement>(f: ComponentFixture<unknown>, sel: string): T {
  const el = f.debugElement.query(By.css(sel))?.nativeElement as T | null;
  if (!el) throw new Error(`Elemento não encontrado: "${sel}"`);
  return el;
}
function qsAll<T extends HTMLElement>(f: ComponentFixture<unknown>, sel: string): T[] {
  return f.debugElement.queryAll(By.css(sel)).map(d => d.nativeElement as T);
}

/** Carrega chamada e aguarda detecção de mudanças de forma síncrona */
function carregarChamada(component: FrequenciaChamadaComponent, fixture: ComponentFixture<FrequenciaChamadaComponent>) {
  component.turmaSelecionadaId.set('turma-1');
  component.dataAula.set('2026-04-22');
  component.carregarChamada();
  fixture.detectChanges();
}

// ─── Setup ───────────────────────────────────────────────────────────────────

describe('FrequenciaChamadaComponent — Acessibilidade WCAG 2.1 AA', () => {
  let fixture:   ComponentFixture<FrequenciaChamadaComponent>;
  let component: FrequenciaChamadaComponent;

  const freqSvc  = { listar: vi.fn(), salvarLote: vi.fn() };
  const turmaSvc = { buscarPorId: vi.fn() };
  const authSvc  = { getUser: vi.fn().mockReturnValue({ role: 'SECRETARIA', sub: 'u99' }) };

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [FrequenciaChamadaComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: FrequenciasService, useValue: freqSvc  },
        { provide: TurmasService,      useValue: turmaSvc },
        { provide: AuthService,        useValue: authSvc  },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(FrequenciaChamadaComponent);
    component = fixture.componentInstance;
    component.turmas = [{ id: 'turma-1', nome: 'Oficina de Braille' } as any];
    fixture.detectChanges();
  });

  // ── 1. WCAG 1.3.1 — Semântica dos Filtros ────────────────────────────────

  describe('1.3.1 — Semântica dos filtros (label/id, aria-required, aria-label)', () => {
    it('label[for="turmaSelect"] deve existir e apontar para #turmaSelect', () => {
      expect(qs(fixture, 'label[for="turmaSelect"]')).toBeTruthy();
      expect(qs(fixture, '#turmaSelect')).toBeTruthy();
    });

    it('label[for="dataAulaInput"] deve existir e apontar para #dataAulaInput', () => {
      expect(qs(fixture, 'label[for="dataAulaInput"]')).toBeTruthy();
      expect(qs(fixture, '#dataAulaInput')).toBeTruthy();
    });

    it('select de turma deve ter aria-required="true"', () => {
      expect(qs<HTMLSelectElement>(fixture, '#turmaSelect').getAttribute('aria-required')).toBe('true');
    });

    it('input de data deve ter aria-required="true"', () => {
      expect(qs<HTMLInputElement>(fixture, '#dataAulaInput').getAttribute('aria-required')).toBe('true');
    });

    it('section de filtros deve ter aria-label descritivo', () => {
      const label = qs<HTMLElement>(fixture, 'section.filtro-card').getAttribute('aria-label');
      expect(label?.length).toBeGreaterThan(0);
    });

    it('botão Carregar deve ter aria-label="Carregar lista de chamada"', () => {
      expect(qs<HTMLButtonElement>(fixture, 'button[aria-label="Carregar lista de chamada"]')).toBeTruthy();
    });
  });

  // ── 2. WCAG 1.1.1 — Ícones decorativos ocultos ────────────────────────────

  describe('1.1.1 — Ícones decorativos devem ter aria-hidden="true"', () => {
    it('deve haver pelo menos um ícone aria-hidden na seção de filtros', () => {
      expect(qsAll(fixture, '.material-symbols-rounded[aria-hidden="true"]').length).toBeGreaterThan(0);
    });
  });

  // ── 3. WCAG 4.1.3 — Erro de carregamento como role="alert" ───────────────

  describe('4.1.3 — Erro deve ser anunciado com role="alert" + aria-live="assertive"', () => {
    it('deve exibir alert assertive quando o carregamento falha', () => {
      turmaSvc.buscarPorId.mockReturnValue(throwError(() => new Error('500')));
      carregarChamada(component, fixture);

      const alert = qs<HTMLElement>(fixture, '[role="alert"][aria-live="assertive"]');
      expect(alert.textContent?.trim().length).toBeGreaterThan(0);
    });
  });

  // ── 4. WCAG 4.1.2 — aria-busy no botão Salvar ────────────────────────────

  describe('4.1.2 — aria-busy="true" no botão Salvar durante envio', () => {
    beforeEach(() => {
      turmaSvc.buscarPorId.mockReturnValue(of(TURMA_STUB));
      freqSvc.listar.mockReturnValue(of(FREQ_RESP));
      carregarChamada(component, fixture);
    });

    it('botão Salvar deve ter aria-label="Salvar chamada de todos os alunos"', () => {
      expect(qs<HTMLButtonElement>(fixture, 'button[aria-label="Salvar chamada de todos os alunos"]')).toBeTruthy();
    });

    it('botão Salvar deve ter aria-busy="true" enquanto salvandoTudo=true', () => {
      component.salvandoTudo.set(true);
      fixture.detectChanges();
      const btn = qs<HTMLButtonElement>(fixture, 'button[aria-label="Salvar chamada de todos os alunos"]');
      expect(btn.getAttribute('aria-busy')).toBe('true');
    });
  });

  // ── 5. WCAG 1.3.1 — Semântica da tabela de chamada ───────────────────────

  describe('1.3.1 — Tabela com caption, scope e region', () => {
    beforeEach(() => {
      turmaSvc.buscarPorId.mockReturnValue(of(TURMA_STUB));
      freqSvc.listar.mockReturnValue(of(FREQ_RESP));
      carregarChamada(component, fixture);
    });

    it('<caption> deve existir com descrição de pelo menos 10 caracteres', () => {
      expect(qs<HTMLTableCaptionElement>(fixture, 'table caption').textContent?.trim().length).toBeGreaterThan(10);
    });

    it('tabela deve ter aria-describedby apontando para o caption existente no DOM', () => {
      const captionId = qs<HTMLTableElement>(fixture, 'table.data-table').getAttribute('aria-describedby');
      expect(captionId).toBeTruthy();
      expect(fixture.nativeElement.querySelector(`#${captionId}`)).toBeTruthy();
    });

    it('todos os <th> do cabeçalho devem ter scope="col"', () => {
      qsAll<HTMLTableCellElement>(fixture, 'thead th').forEach(th =>
        expect(th.getAttribute('scope')).toBe('col')
      );
    });

    it('wrapper da tabela deve ter role="region" e aria-label', () => {
      const wrapper = qs<HTMLElement>(fixture, '[role="region"][aria-label]');
      expect(wrapper.getAttribute('aria-label')?.length).toBeGreaterThan(0);
    });
  });

  // ── 6. WCAG 2.5.3 — aria-label dos botões de toggle por aluno ────────────

  describe('2.5.3 — aria-label dos botões de ação deve conter nome do aluno', () => {
    beforeEach(() => {
      turmaSvc.buscarPorId.mockReturnValue(of(TURMA_STUB));
      freqSvc.listar.mockReturnValue(of(FREQ_RESP));
      carregarChamada(component, fixture);
    });

    it('botão de Ana Silva deve mencionar "Ana Silva" e "ausente" no aria-label', () => {
      const label = qsAll<HTMLButtonElement>(fixture, '.btn-action')[0].getAttribute('aria-label') ?? '';
      expect(label.toLowerCase()).toContain('ana silva');
      expect(label.toLowerCase()).toMatch(/ausente|falta/);
    });

    it('botão de Bruno Costa deve mencionar "Bruno Costa" e "presente" no aria-label', () => {
      const label = qsAll<HTMLButtonElement>(fixture, '.btn-action')[1].getAttribute('aria-label') ?? '';
      expect(label.toLowerCase()).toContain('bruno costa');
      expect(label.toLowerCase()).toMatch(/presente/);
    });
  });

  // ── 7. WCAG 4.1.2 — FJ com aria-disabled ─────────────────────────────────

  describe('4.1.2 — Linha de FJ bloqueada com aria-disabled', () => {
    beforeEach(() => {
      turmaSvc.buscarPorId.mockReturnValue(of({ ...TURMA_STUB, matriculasOficina: [{ aluno: { id: 'aluno-1', nomeCompleto: 'Ana Silva' } }] }));
      freqSvc.listar.mockReturnValue(of(FJ_RESP));
      carregarChamada(component, fixture);
    });

    it('linha com FJ deve ter aria-disabled="true"', () => {
      expect(qs<HTMLTableRowElement>(fixture, 'tr[aria-disabled="true"]')).toBeTruthy();
    });

    it('badge de FJ deve ter aria-label contendo "justificada"', () => {
      const label = qs<HTMLElement>(fixture, '.badge-fj[aria-label]').getAttribute('aria-label') ?? '';
      expect(label.toLowerCase()).toContain('justificada');
    });
  });

  // ── 8. WCAG 2.1.1 — Navegação por Teclado ────────────────────────────────

  describe('2.1.1 — ArrowUp/Down movem foco na tabela, Tab não é interceptado', () => {
    beforeEach(() => {
      turmaSvc.buscarPorId.mockReturnValue(of(TURMA_STUB));
      freqSvc.listar.mockReturnValue(of(FREQ_RESP));
      carregarChamada(component, fixture);
    });

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

    it('Tab NÃO deve ser interceptado pelo keyManager', () => {
      const spy = vi.spyOn(component.keyManager, 'onKeydown');
      fixture.nativeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
      expect(spy).not.toHaveBeenCalled();
    });

    it('linhas tbody devem ter tabindex="0" para receber foco', () => {
      qsAll<HTMLTableRowElement>(fixture, 'tbody tr').forEach(tr =>
        expect(tr.getAttribute('tabindex')).toBe('0')
      );
    });
  });

  // ── 9. WCAG 1.3.1 — Grupo de ações em massa ──────────────────────────────

  describe('1.3.1 — Grupo de ações em massa com role="group"', () => {
    beforeEach(() => {
      turmaSvc.buscarPorId.mockReturnValue(of(TURMA_STUB));
      freqSvc.listar.mockReturnValue(of(FREQ_RESP));
      carregarChamada(component, fixture);
    });

    it('deve ter [role="group"] com aria-label descritivo', () => {
      const group = qs<HTMLElement>(fixture, '[role="group"][aria-label]');
      expect(group.getAttribute('aria-label')?.length).toBeGreaterThan(0);
    });

    it('"Marcar todos presentes" deve ter aria-label explícito', () => {
      expect(qs<HTMLButtonElement>(fixture, 'button[aria-label="Marcar todos como presentes"]')).toBeTruthy();
    });

    it('"Marcar todos ausentes" deve ter aria-label explícito', () => {
      expect(qs<HTMLButtonElement>(fixture, 'button[aria-label="Marcar todos como ausentes"]')).toBeTruthy();
    });
  });

  // ── 10. WCAG 4.1.3 — Estado vazio com role="status" ──────────────────────

  describe('4.1.3 — Turma sem alunos anunciada com role="status" + aria-live="polite"', () => {
    it('empty-state deve ter role="status" e aria-live="polite"', () => {
      turmaSvc.buscarPorId.mockReturnValue(of(TURMA_SEM_ALUNOS));
      freqSvc.listar.mockReturnValue(of({ data: [], meta: { total: 0 } }));
      carregarChamada(component, fixture);

      expect(qs<HTMLElement>(fixture, '[role="status"][aria-live="polite"]')).toBeTruthy();
    });
  });
});
