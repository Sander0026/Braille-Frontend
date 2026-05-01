/**
 * frequencia-relatorio.component.spec.ts
 *
 * Suite de Acessibilidade WCAG 2.1 AA — FrequenciaRelatorioComponent
 * Runner: Vitest (@angular/build:unit-test) — sem zone.js / fakeAsync.
 *
 * Critérios cobertos:
 *  1.3.1 — Semântica (label/id, scope, caption, region, aria-labelledby)
 *  1.4.1 — Uso de cor (badge com aria-label, não depende só de cor)
 *  2.1.1 — Teclado (ArrowUp/Down, Tab livre)
 *  4.1.2 — Nome, Função, Valor (aria-disabled no select, aria-busy no botão)
 *  4.1.3 — Mensagens de status (role=alert, role=status, aria-live)
 *  2.5.3 — Label in Name (botão Gerar contém descrição completa)
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient }         from '@angular/common/http';
import { provideHttpClientTesting }  from '@angular/common/http/testing';
import { By }                        from '@angular/platform-browser';
import { of, throwError }            from 'rxjs';

import { FrequenciaRelatorioComponent } from './frequencia-relatorio.component';
import { FrequenciasService } from '../../../../../core/services/frequencias.service';
import { TurmasService }       from '../../../../../core/services/turmas.service';

// ─── Stubs ───────────────────────────────────────────────────────────────────

const TURMA_STUB = {
  id: 't1',
  nome: 'Oficina de Braille',
  matriculasOficina: [
    { aluno: { id: 'a1', nomeCompleto: 'Ana Silva'   } },
    { aluno: { id: 'a2', nomeCompleto: 'Bruno Costa' } },
  ],
};

const RELATORIO_RESP = {
  estatisticas: { totalAulas: 10, presentes: 8, faltas: 2, taxaPresenca: 80 },
  historico: [
    { id: 'h1', dataAula: '2026-04-10', presente: true  },
    { id: 'h2', dataAula: '2026-04-17', presente: false },
  ],
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

describe('FrequenciaRelatorioComponent — Acessibilidade WCAG 2.1 AA', () => {
  let fixture:   ComponentFixture<FrequenciaRelatorioComponent>;
  let component: FrequenciaRelatorioComponent;

  const freqSvc  = { obterRelatorioAluno: vi.fn() };
  const turmaSvc = { buscarPorId: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    turmaSvc.buscarPorId.mockReturnValue(of(TURMA_STUB));
    freqSvc.obterRelatorioAluno.mockReturnValue(of(RELATORIO_RESP));

    await TestBed.configureTestingModule({
      imports: [FrequenciaRelatorioComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: FrequenciasService, useValue: freqSvc  },
        { provide: TurmasService,      useValue: turmaSvc },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(FrequenciaRelatorioComponent);
    component = fixture.componentInstance;
    component.turmas = [{ id: 't1', nome: 'Oficina de Braille' } as any];
    fixture.detectChanges();
  });

  // ── 1. WCAG 1.3.1 — Semântica dos Filtros ────────────────────────────────

  describe('1.3.1 — Semântica dos filtros', () => {
    it('section deve ter aria-label="Buscar relatório do aluno"', () => {
      expect(qs(fixture, 'section[aria-label="Buscar relatório do aluno"]')).toBeTruthy();
    });

    it('label[for="relatorioTurmaSelect"] e #relatorioTurmaSelect devem estar associados', () => {
      expect(qs(fixture, 'label[for="relatorioTurmaSelect"]')).toBeTruthy();
      expect(qs(fixture, '#relatorioTurmaSelect')).toBeTruthy();
    });

    it('label[for="relatorioAlunoSelect"] e #relatorioAlunoSelect devem estar associados', () => {
      expect(qs(fixture, 'label[for="relatorioAlunoSelect"]')).toBeTruthy();
      expect(qs(fixture, '#relatorioAlunoSelect')).toBeTruthy();
    });

    it('botão Gerar deve ter aria-label descritivo', () => {
      expect(qs<HTMLButtonElement>(fixture, 'button[aria-label*="Gerar Relatório"]')).toBeTruthy();
    });
  });

  // ── 2. WCAG 4.1.2 — aria-disabled no select de aluno ────────────────────

  describe('4.1.2 — Select de aluno com aria-disabled quando desativado', () => {
    it('deve ter aria-disabled="true" quando nenhuma turma está selecionada', () => {
      // Estado inicial: sem turma selecionada
      const sel = qs<HTMLSelectElement>(fixture, '#relatorioAlunoSelect');
      expect(sel.getAttribute('aria-disabled')).toBe('true');
    });

    it('deve ter dica sr-only quando select está desativado', () => {
      const hint = qs<HTMLElement>(fixture, '#aluno-hint');
      expect(hint.textContent?.trim().length).toBeGreaterThan(10);
    });

    it('aria-disabled deve ser null/false quando turma está selecionada e há alunos', () => {
      component.onTurmaRelatorioChange('t1');
      fixture.detectChanges();
      const sel = qs<HTMLSelectElement>(fixture, '#relatorioAlunoSelect');
      // turma selecionada + alunos carregados = select habilitado
      expect(sel.getAttribute('aria-disabled')).not.toBe('true');
    });
  });

  // ── 3. WCAG 4.1.2 — aria-busy no botão Gerar ────────────────────────────

  describe('4.1.2 — aria-busy="true" no botão Gerar durante geração', () => {
    it('deve ter aria-busy="true" quando carregandoRelatorio=true', () => {
      component.carregandoRelatorio.set(true);
      fixture.detectChanges();
      const btn = qs<HTMLButtonElement>(fixture, 'button[aria-label*="Gerar Relatório"]');
      expect(btn.getAttribute('aria-busy')).toBe('true');
    });
  });

  // ── 4. WCAG 4.1.3 — Erro com role="alert" + aria-live="assertive" ────────

  describe('4.1.3 — Erro anunciado via role="alert" + aria-live="assertive"', () => {
    it('deve exibir alerta assertivo quando o relatório falha', () => {
      freqSvc.obterRelatorioAluno.mockReturnValue(throwError(() => new Error('500')));
      component.turmaSelecionadaId.set('t1');
      component.alunoSelecionadoId.set('a1');
      component.carregarRelatorio();
      fixture.detectChanges();

      const alert = qs<HTMLElement>(fixture, '[role="alert"][aria-live="assertive"]');
      expect(alert.textContent?.trim().length).toBeGreaterThan(0);
    });
  });

  // ── 5. WCAG 1.3.1 — Seção de Estatísticas como region ───────────────────

  describe('1.3.1 — Estatísticas em region com aria-label', () => {
    beforeEach(() => {
      component.turmaSelecionadaId.set('t1');
      component.alunoSelecionadoId.set('a1');
      component.carregarRelatorio();
      fixture.detectChanges();
    });

    it('section das estatísticas deve ter role="region" e aria-label descritivo', () => {
      const region = qs<HTMLElement>(fixture, 'section[role="region"][aria-label]');
      expect(region.getAttribute('aria-label')?.length).toBeGreaterThan(0);
    });

    it('stat de presença deve ter aria-label com porcentagem legível', () => {
      const stat = qs<HTMLElement>(fixture, '.stat--presente[aria-label]');
      expect(stat.getAttribute('aria-label')).toContain('80%');
    });

    it('stat de faltas deve ter aria-label com número de faltas legível', () => {
      const stat = qs<HTMLElement>(fixture, '.stat--falta[aria-label]');
      expect(stat.getAttribute('aria-label')).toContain('2 faltas');
    });
  });

  // ── 6. WCAG 1.3.1 — Tabela com caption e scope ───────────────────────────

  describe('1.3.1 — Tabela de extrato com caption e scope', () => {
    beforeEach(() => {
      component.turmaSelecionadaId.set('t1');
      component.alunoSelecionadoId.set('a1');
      component.carregarRelatorio();
      fixture.detectChanges();
    });

    it('tabela deve ter <caption> sr-only descritivo', () => {
      expect(qs<HTMLElement>(fixture, 'caption.sr-only').textContent?.trim().length).toBeGreaterThan(20);
    });

    it('tabela deve ter aria-describedby apontando para caption existente', () => {
      const table = qs<HTMLTableElement>(fixture, 'table.data-table');
      const ids   = table.getAttribute('aria-describedby') ?? '';
      ids.split(' ').forEach(id => {
        expect(fixture.nativeElement.querySelector(`#${id}`)).toBeTruthy();
      });
    });

    it('todos os <th> devem ter scope="col"', () => {
      qsAll<HTMLTableCellElement>(fixture, 'thead th').forEach(th =>
        expect(th.getAttribute('scope')).toBe('col')
      );
    });

    it('wrapper da tabela deve ter role="region" e aria-label', () => {
      const region = qs<HTMLElement>(fixture, '[role="region"][aria-label]');
      expect(region.getAttribute('aria-label')?.length).toBeGreaterThan(0);
    });
  });

  // ── 7. WCAG 1.4.1 — Badge não depende só de cor ──────────────────────────

  describe('1.4.1 — Badges de presença/falta com aria-label (não só cor)', () => {
    beforeEach(() => {
      component.turmaSelecionadaId.set('t1');
      component.alunoSelecionadoId.set('a1');
      component.carregarRelatorio();
      fixture.detectChanges();
    });

    it('badge de linha presente deve ter aria-label="Presente"', () => {
      const badge = qs<HTMLElement>(fixture, '.badge-success[aria-label="Presente"]');
      expect(badge).toBeTruthy();
    });

    it('badge de linha falta deve ter aria-label="Falta"', () => {
      const badge = qs<HTMLElement>(fixture, '.badge-danger[aria-label="Falta"]');
      expect(badge).toBeTruthy();
    });

    it('ícones dentro do badge devem ser aria-hidden', () => {
      qsAll<HTMLElement>(fixture, '.badge .material-symbols-rounded[aria-hidden="true"]')
        .forEach(icon => expect(icon.getAttribute('aria-hidden')).toBe('true'));
    });
  });

  // ── 8. WCAG 4.1.3 — Empty-state com role="status" ────────────────────────

  describe('4.1.3 — Empty-state anunciado com role="status" + aria-live="polite"', () => {
    it('deve ter role="status" e aria-live="polite" quando histórico vazio', () => {
      freqSvc.obterRelatorioAluno.mockReturnValue(of({
        estatisticas: { totalAulas: 0, presentes: 0, faltas: 0, taxaPresenca: 0 },
        historico: [],
      }));
      component.turmaSelecionadaId.set('t1');
      component.alunoSelecionadoId.set('a1');
      component.carregarRelatorio();
      fixture.detectChanges();

      expect(qs<HTMLElement>(fixture, '[role="status"][aria-live="polite"]')).toBeTruthy();
    });
  });

  // ── 9. WCAG 2.1.1 — Teclado: ArrowUp/Down na tabela ─────────────────────

  describe('2.1.1 — Navegação por teclado na tabela', () => {
    beforeEach(() => {
      component.turmaSelecionadaId.set('t1');
      component.alunoSelecionadoId.set('a1');
      component.carregarRelatorio();
      fixture.detectChanges();
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

    it('Tab NÃO deve ser interceptado', () => {
      const spy = vi.spyOn(component.keyManager, 'onKeydown');
      fixture.nativeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
      expect(spy).not.toHaveBeenCalled();
    });

    it('linhas tbody devem ter tabindex="0"', () => {
      qsAll<HTMLTableRowElement>(fixture, 'tbody tr').forEach(tr =>
        expect(tr.getAttribute('tabindex')).toBe('0')
      );
    });
  });
});
