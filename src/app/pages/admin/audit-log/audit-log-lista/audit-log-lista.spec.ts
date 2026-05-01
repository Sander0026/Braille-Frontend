import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { AuditLogLista } from './audit-log-lista';
import { AuditLogService, AuditStats } from '../../../../core/services/audit-log.service';
import { AuditStatsComponent } from '../components/audit-stats/audit-stats.component';
import { AuditModalDetalhesComponent } from '../components/audit-modal-detalhes/audit-modal-detalhes.component';

// ── Factories ──────────────────────────────────────────────────────────────────
const mockLog = {
  id: 'abc', entidade: 'User', registroId: '1', acao: 'CRIAR',
  autorId: null, autorNome: 'Admin', autorRole: 'ADMIN',
  ip: null, userAgent: null, oldValue: null, newValue: null,
  criadoEm: new Date().toISOString(),
};

const mockStats: AuditStats = { totalLogs: 100, logsHoje: 5, topAcoes: [{ acao: 'CRIAR', total: 40 }] };

const mockPaginatedRes = {
  data: [mockLog],
  meta: { total: 1, page: 1, lastPage: 1 },
};

// ── Suite ──────────────────────────────────────────────────────────────────────
describe('AuditLogLista Component', () => {
  let component: AuditLogLista;
  let fixture:   ComponentFixture<AuditLogLista>;
  let auditService: any;

  beforeEach(async () => {
    auditService = {listar: vi.fn(),stats: vi.fn(),limparCache: vi.fn()};
    auditService.listar.and.returnValue(of(mockPaginatedRes as any));
    auditService.stats.and.returnValue(of(mockStats));

    await TestBed.configureTestingModule({
      imports: [AuditLogLista, FormsModule, AuditStatsComponent, AuditModalDetalhesComponent],
      providers: [{ provide: AuditLogService, useValue: auditService }],
    }).compileComponents();

    fixture   = TestBed.createComponent(AuditLogLista);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve criar o componente', () => expect(component).toBeTruthy());

  // ── Caso crítico: Symbol.iterator ────────────────────────────────────────
  it('deve garantir que logs seja sempre um Array real (Symbol.iterator fix)', fakeAsync(() => {
    // Simula backend retornando objeto-like sem Symbol.iterator
    const badRes = { data: { 0: mockLog, length: 1 }, meta: { total: 1 } };
    auditService.listar.and.returnValue(of(badRes as any));
    component.carregarLogs();
    tick();
    // Após o map + Array.isArray guard, logs deve ser [] (objeto não é array)
    expect(Array.isArray(component.logs)).toBe(true);
  }));

  it('deve popular logs com array válido', fakeAsync(() => {
    tick();
    expect(Array.isArray(component.logs)).toBe(true);
    expect(component.logs.length).toBe(1);
    expect(component.total).toBe(1);
    expect(component.isLoading).toBeFalsy();
  }));

  it('deve tratar res sem meta graciosamente (total = 0)', fakeAsync(() => {
    auditService.listar.and.returnValue(of({ data: [] } as any));
    component.carregarLogs();
    tick();
    expect(component.total).toBe(0);
    expect(Array.isArray(component.logs)).toBe(true);
  }));

  // ── Erros HTTP ────────────────────────────────────────────────────────────
  it('deve exibir mensagem de erro amigável em falha HTTP', fakeAsync(() => {
    auditService.listar.and.returnValue(throwError(() => ({ error: { message: 'Acesso negado' } })));
    component.carregarLogs();
    tick();
    expect(component.erro).toBe('Acesso negado');
    expect(component.isLoading).toBeFalsy();
  }));

  it('deve usar fallback message se error.message estiver ausente', fakeAsync(() => {
    auditService.listar.and.returnValue(throwError(() => ({})));
    component.carregarLogs();
    tick();
    expect(component.erro).toBe('Erro ao carregar logs de auditoria.');
  }));

  // ── Stats ─────────────────────────────────────────────────────────────────
  it('deve popular stats com defaults se topAcoes vier undefined', fakeAsync(() => {
    auditService.stats.and.returnValue(of({ totalLogs: 50, logsHoje: 2 } as AuditStats));
    component.carregarStats();
    tick();
    expect(component.stats?.topAcoes).toEqual([]);
    expect(component.stats?.totalLogs).toBe(50);
  }));

  // ── Filtros ───────────────────────────────────────────────────────────────
  it('deve limpar filtros e recarregar logs', fakeAsync(() => {
    component.filtroEntidade = 'User';
    component.filtroAcao     = 'CRIAR';
    component.limparFiltros();
    tick();
    expect(component.filtroEntidade).toBe('');
    expect(component.filtroAcao).toBe('');
    expect(auditService.listar).toHaveBeenCalled();
  }));

  // ── Paginação ─────────────────────────────────────────────────────────────
  it('não deve ir para página inválida (0)', () => {
    component.total = 20;
    const callsBefore = auditService.listar.calls.count();
    component.irParaPagina(0);
    expect(auditService.listar.calls.count()).toBe(callsBefore);
  });

  it('deve calcular totalPaginas corretamente', () => {
    component.total = 45;
    expect(component.totalPaginas).toBe(3); // Math.ceil(45/20)
  });

  it('paginasVisiveis deve incluir sempre a página 1', () => {
    component.total = 200;
    component['pagina'] = 5;
    expect(component.paginasVisiveis[0]).toBe(1);
  });

  // ── Modal ─────────────────────────────────────────────────────────────────
  it('deve abrir e fechar modal de detalhes', () => {
    const log = mockLog as any;
    component.abrirDetalhes(log);
    expect(component.modalAberto()).toBeTruthy();
    expect(component.logSelecionado()).toEqual(log);

    component.fecharDetalhes();
    expect(component.modalAberto()).toBeFalsy();
    expect(component.logSelecionado()).toBeNull();
  });

  // ── Utilitários ───────────────────────────────────────────────────────────
  it('deve retornar "—" para data vazia', () => {
    expect(component.formatarData('')).toBe('—');
  });

  it('deve retornar data formatada em pt-BR para ISO válido', () => {
    const result = component.formatarData('2026-01-15T10:30:00.000Z');
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  it('trackById deve retornar o id do item', () => {
    const log = { id: 'xyz' } as any;
    expect(component.trackById(0, log)).toBe('xyz');
  });
});
