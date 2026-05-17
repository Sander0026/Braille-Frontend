import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthService } from '../../../../core/services/auth.service';
import { BeneficiariosService } from '../../../../core/services/beneficiarios.service';
import { RelatoriosService } from '../../../../core/services/relatorios.service';
import { ToastService } from '../../../../core/services/toast.service';
import { TurmasService } from '../../../../core/services/turmas.service';
import { RelatorioAtendimentoApiService } from '../../../../features/atendimentos-individuais/services/relatorio-atendimento-api.service';
import { RelatoriosDashboard } from './relatorios-dashboard';

describe('RelatoriosDashboard', () => {
  let fixture: ComponentFixture<RelatoriosDashboard>;
  let component: RelatoriosDashboard;
  let relatoriosService: any;
  let relatorioAtendimentoApi: any;
  let toast: any;
  let turmasService: any;
  let beneficiariosService: any;

  const resumoVazio = {
    alunos: { total: 0, ativos: 0, inativos: 0, novosNoPeriodo: 0 },
    turmas: { total: 0, previstas: 0, andamento: 0, concluidas: 0, canceladas: 0 },
    matriculas: { total: 0, ativas: 0, concluidas: 0, evadidas: 0, canceladas: 0, transferidas: 0 },
    indicadores: { taxaEvasao: 0, taxaConclusao: 0, taxaPermanencia: 0 },
  };

  const alunosVazio = {
    filtros: {},
    total: 0,
    indicadores: {
      totalCadastrados: 0,
      ativos: 0,
      inativos: 0,
      cadastradosNoPeriodo: 0,
      porTipoDeficiencia: {},
      porCausaDeficiencia: {},
      porPreferenciaAcessibilidade: {},
      porCidade: {},
      porBairro: {},
      porEscolaridade: {},
      porRendaFamiliar: {},
      recebemBeneficioGov: 0,
      precisamAcompanhante: 0,
      comLaudo: 0,
      semLaudo: 0,
      lgpdAceito: 0,
    },
    porStatus: { ativos: 0, inativos: 0 },
    porCidade: {},
    porTipoDeficiencia: {},
    data: [],
  };

  const turmasVazio = {
    filtros: {},
    total: 0,
    indicadores: {
      totalTurmas: 0,
      previstas: 0,
      andamento: 0,
      concluidas: 0,
      canceladas: 0,
      arquivadas: 0,
      totalVagas: 0,
      vagasOcupadas: 0,
      taxaMediaOcupacao: 0,
      alunosMatriculadosPorTurma: [],
    },
    porStatus: {},
    data: [],
  };

  const evasoesVazio = {
    filtros: {},
    totalEncerramentos: 0,
    totalEvasoes: 0,
    indicadores: {
      totalEvasoes: 0,
      totalCancelamentos: 0,
      totalTransferencias: 0,
      semMotivoEstruturado: 0,
      evasoesComAtendimentoIndividual: 0,
      evasoesSemAtendimentoIndividual: 0,
      evasoesComFaltasEmAtendimento: 0,
      evasoesComAcompanhamentoFinalizado: 0,
      evasoesComAcompanhamentoArquivado: 0,
      porTurma: {},
      porProfessor: {},
      porMes: {},
      porMotivo: {},
      porTipoDeficiencia: {},
      porCidade: {},
      porBairro: {},
      porCidadeBairro: {},
      tempoMedioPermanenciaDias: 0,
      rankingTurmas: [],
    },
    porStatus: {},
    porMotivo: {},
    data: [],
  };

  const frequenciasVazio = {
    filtros: {},
    total: 0,
    presentes: 0,
    faltas: 0,
    faltasJustificadas: 0,
    taxaPresenca: 0,
    porStatus: {},
    data: [],
  };

  const atendimentosVazio = {
    filtros: {},
    totalAcompanhamentos: 0,
    totalRegistros: 0,
    indicadores: {
      totalAcompanhamentos: 0,
      emAndamento: 0,
      finalizados: 0,
      arquivados: 0,
      totalAtendimentosRealizados: 0,
      faltasJustificadas: 0,
      faltasNaoJustificadas: 0,
      atendimentosCancelados: 0,
      mediaAtendimentosPorAluno: 0,
      mediaDuracaoMinutos: 0,
      porStatusAcompanhamento: {},
      porTipoRegistro: {},
      porModalidade: {},
    },
    atendimentosPorProfessor: [],
    alunosMaisAtendidos: [],
    totais: {
      atendimentosRealizados: 0,
      faltasJustificadas: 0,
      faltasNaoJustificadas: 0,
      cancelados: 0,
    },
    acompanhamentos: [],
  };

  beforeEach(() => {
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn().mockReturnValue('blob:relatorio'),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    });
    Object.defineProperty(HTMLAnchorElement.prototype, 'click', {
      configurable: true,
      value: vi.fn(),
    });
  });

  async function montarComponente(role: 'ADMIN' | 'SECRETARIA' | 'PROFESSOR' | 'COMUNICACAO' = 'ADMIN', erroApi = false) {
    TestBed.resetTestingModule();

    relatoriosService = {
      resumo: vi.fn().mockReturnValue(erroApi ? throwError(() => new Error('Falha')) : of(resumoVazio)),
      alunos: vi.fn().mockReturnValue(of(alunosVazio)),
      turmas: vi.fn().mockReturnValue(of(turmasVazio)),
      evasoes: vi.fn().mockReturnValue(of(evasoesVazio)),
      frequencias: vi.fn().mockReturnValue(of(frequenciasVazio)),
      exportarPdf: vi.fn().mockReturnValue(of(new Blob(['pdf']))),
      exportarXlsx: vi.fn().mockReturnValue(of(new Blob(['xlsx']))),
    };
    relatorioAtendimentoApi = {
      gerar: vi.fn().mockReturnValue(of(atendimentosVazio)),
      exportarPdf: vi.fn().mockReturnValue(of(new Blob(['pdf-atendimentos']))),
    };
    turmasService = {
      listar: vi.fn().mockReturnValue(of({ data: [{ id: 'turma-1', nome: 'Braille Basico' }] })),
      listarProfessoresAtivos: vi.fn().mockReturnValue(of([{ id: 'prof-1', nome: 'Professora Ana' }])),
    };
    beneficiariosService = {
      listar: vi.fn().mockReturnValue(of({ data: [{ id: 'aluno-1', nomeCompleto: 'Ana Silva', matricula: 'A001' }] })),
    };
    toast = {
      sucesso: vi.fn(),
      erro: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [RelatoriosDashboard],
      providers: [
        { provide: RelatoriosService, useValue: relatoriosService },
        { provide: RelatorioAtendimentoApiService, useValue: relatorioAtendimentoApi },
        { provide: TurmasService, useValue: turmasService },
        { provide: BeneficiariosService, useValue: beneficiariosService },
        { provide: ToastService, useValue: toast },
        { provide: AuthService, useValue: { getUser: () => ({ sub: 'u-1', nome: 'Usuario', role }) } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(RelatoriosDashboard, {
        set: { imports: [CommonModule], schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(RelatoriosDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('carrega abas e dados consolidados para perfil administrativo', async () => {
    await montarComponente('ADMIN');

    expect(component.tabs.map((tab) => tab.id)).toEqual([
      'visao-geral',
      'alunos',
      'turmas',
      'evasoes',
      'atendimentos',
      'exportacoes',
    ]);
    expect(component.abaAtiva()).toBe('visao-geral');
    expect(component.resumo()).toEqual(resumoVazio);
    expect(component.totalRegistros()).toBe(0);
    expect(fixture.nativeElement.querySelectorAll('.tab-btn').length).toBe(6);
  });

  it('recarrega os relatorios quando filtros sao aplicados', async () => {
    await montarComponente('SECRETARIA');
    relatoriosService.resumo.mockClear();
    relatorioAtendimentoApi.gerar.mockClear();

    component.aplicarFiltros({
      dataInicio: '2026-05-01',
      turmaId: 'turma-1',
      professorId: 'prof-1',
      statusAluno: 'ATIVO',
      tipoRegistroAtendimento: 'ATENDIMENTO_REALIZADO',
    });

    expect(relatoriosService.resumo).toHaveBeenCalledWith({
      dataInicio: '2026-05-01',
      turmaId: 'turma-1',
      professorId: 'prof-1',
      statusAluno: 'ATIVO',
      tipoRegistroAtendimento: 'ATENDIMENTO_REALIZADO',
    });
    expect(relatorioAtendimentoApi.gerar).toHaveBeenCalledWith({
      professorId: 'prof-1',
      dataInicio: '2026-05-01',
      tipoRegistro: 'ATENDIMENTO_REALIZADO',
    });
  });

  it('alterna abas sem perder o estado carregado', async () => {
    await montarComponente('ADMIN');

    component.mudarAba('evasoes');
    fixture.detectChanges();

    expect(component.abaAtiva()).toBe('evasoes');
    expect(fixture.nativeElement.querySelector('#painel-evasoes')).not.toBeNull();
  });

  it('executa exportacoes institucionais e mostra feedback de sucesso', async () => {
    await montarComponente('ADMIN');

    component.exportarPdf();
    component.exportarXlsx();

    expect(relatoriosService.exportarPdf).toHaveBeenCalledWith({ statusAluno: 'TODOS' });
    expect(relatoriosService.exportarXlsx).toHaveBeenCalledWith({ statusAluno: 'TODOS' });
    expect(toast.sucesso).toHaveBeenCalledWith('PDF gerado com sucesso.');
    expect(toast.sucesso).toHaveBeenCalledWith('Planilha gerada com sucesso.');
  });

  it('bloqueia exportacao XLSX para COMUNICACAO e mantem apenas a aba de exportacoes', async () => {
    await montarComponente('COMUNICACAO');

    expect(component.tabs.map((tab) => tab.id)).toEqual(['exportacoes']);
    expect(component.abaAtiva()).toBe('exportacoes');
    expect(relatoriosService.resumo).not.toHaveBeenCalled();
    expect(turmasService.listar).not.toHaveBeenCalled();

    component.exportarXlsx();

    expect(relatoriosService.exportarXlsx).not.toHaveBeenCalled();
    expect(toast.erro).toHaveBeenCalledWith(
      'Seu perfil pode exportar apenas o PDF institucional sem dados sensíveis.',
    );
  });

  it('exibe estado vazio sem erro quando a API retorna listas vazias', async () => {
    await montarComponente('ADMIN');

    expect(component.erro()).toBe('');
    expect(component.alunos()?.data).toEqual([]);
    expect(component.turmas()?.data).toEqual([]);
    expect(component.evasoes()?.data).toEqual([]);
  });

  it('exibe mensagem amigavel quando a API falha', async () => {
    await montarComponente('ADMIN', true);
    fixture.detectChanges();

    expect(component.erro()).toBe('Não foi possível carregar os relatórios.');
    expect(fixture.nativeElement.textContent).toContain('Não foi possível carregar os relatórios.');
  });
});
