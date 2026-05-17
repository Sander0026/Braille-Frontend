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

  const alunosResumoVazio = {
    totalCadastrados: 0,
    ativos: 0,
    inativos: 0,
    comLaudo: 0,
    semLaudo: 0,
    precisamAcompanhante: 0,
    lgpdAceito: 0,
  };

  const alunosDistribuicoesVazio = {
    porTipoDeficiencia: [],
    porCidadeTop10: [],
    porBairroTop10: [],
    porEscolaridadeTop10: [],
    porRendaFamiliarTop10: [],
  };

  const alunosListaVazio = {
    data: [],
    meta: {
      page: 1,
      limit: 20,
      total: 0,
      lastPage: 1,
    },
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

  const riscoEvasaoVazio = {
    filtros: {},
    total: 0,
    indicadores: {
      alto: 0,
      medio: 0,
      baixo: 0,
      tresFaltasSeguidas: 0,
      presencaAbaixo60: 0,
      semRegistro30Dias: 0,
      matriculaAtivaSemFrequenciaRecente: 0,
    },
    data: [],
  };

  const impactoSocialVazio = {
    filtros: {},
    periodo: {
      atual: { dataInicio: '2026-05-01', dataFim: '2026-05-31' },
      anterior: { dataInicio: '2026-03-31', dataFim: '2026-04-30' },
    },
    metricas: {
      totalAlunosAtendidos: 0,
      totalAtendimentosIndividuais: 0,
      totalTurmasOfertadas: 0,
      totalCertificadosEmitidos: 0,
      totalAlunosDeficienciaVisualAtendidos: 0,
      totalBairrosAlcancados: 0,
      totalCidadesAlcancadas: 0,
      taxaPermanencia: 0,
      taxaConclusao: 0,
    },
    comparativo: {
      totalAlunosAtendidos: { atual: 0, anterior: 0, variacaoPercentual: 0, direcao: 'ESTAVEL' },
      totalAtendimentosIndividuais: { atual: 0, anterior: 0, variacaoPercentual: 0, direcao: 'ESTAVEL' },
      totalTurmasOfertadas: { atual: 0, anterior: 0, variacaoPercentual: 0, direcao: 'ESTAVEL' },
      totalCertificadosEmitidos: { atual: 0, anterior: 0, variacaoPercentual: 0, direcao: 'ESTAVEL' },
      totalAlunosDeficienciaVisualAtendidos: { atual: 0, anterior: 0, variacaoPercentual: 0, direcao: 'ESTAVEL' },
      totalBairrosAlcancados: { atual: 0, anterior: 0, variacaoPercentual: 0, direcao: 'ESTAVEL' },
      totalCidadesAlcancadas: { atual: 0, anterior: 0, variacaoPercentual: 0, direcao: 'ESTAVEL' },
      taxaPermanencia: { atual: 0, anterior: 0, variacaoPercentual: 0, direcao: 'ESTAVEL' },
      taxaConclusao: { atual: 0, anterior: 0, variacaoPercentual: 0, direcao: 'ESTAVEL' },
    },
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
      alunos: vi.fn(),
      alunosResumo: vi.fn().mockReturnValue(of(alunosResumoVazio)),
      alunosDistribuicoes: vi.fn().mockReturnValue(of(alunosDistribuicoesVazio)),
      alunosLista: vi.fn().mockReturnValue(of(alunosListaVazio)),
      turmas: vi.fn().mockReturnValue(of(turmasVazio)),
      evasoes: vi.fn().mockReturnValue(of(evasoesVazio)),
      frequencias: vi.fn().mockReturnValue(of(frequenciasVazio)),
      riscoEvasao: vi.fn().mockReturnValue(of(riscoEvasaoVazio)),
      impactoSocial: vi.fn().mockReturnValue(of(impactoSocialVazio)),
      buscarOpcoesTurmas: vi.fn().mockReturnValue(of([{ id: 'turma-1', label: 'Braille Basico' }])),
      buscarOpcoesProfessores: vi.fn().mockReturnValue(of([{ id: 'prof-1', label: 'Professora Ana' }])),
      buscarOpcoesAlunos: vi.fn().mockReturnValue(of([{ id: 'aluno-1', label: 'Ana Silva (A001)' }])),
      buscarOpcoesCidades: vi.fn().mockReturnValue(of([{ id: 'Serra', label: 'Serra' }])),
      buscarOpcoesBairros: vi.fn().mockReturnValue(of([{ id: 'Jardim Limoeiro', label: 'Jardim Limoeiro' }])),
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
      'impacto-social',
      'exportacoes',
    ]);
    expect(component.abaAtiva()).toBe('visao-geral');
    expect(component.resumo()).toEqual(resumoVazio);
    expect(component.alunosResumo()).toBeNull();
    expect(component.alunosDistribuicoes()).toBeNull();
    expect(component.alunosLista()).toBeNull();
    expect(component.turmas()).toBeNull();
    expect(component.evasoes()).toBeNull();
    expect(component.riscoEvasao()).toBeNull();
    expect(component.atendimentos()).toBeNull();
    expect(component.impactoSocial()).toBeNull();
    expect(component.totalRegistros()).toBe(0);
    expect(fixture.nativeElement.querySelectorAll('.tab-btn').length).toBe(7);
    expect(relatoriosService.alunos).not.toHaveBeenCalled();
    expect(relatoriosService.alunosResumo).not.toHaveBeenCalled();
    expect(relatoriosService.alunosDistribuicoes).not.toHaveBeenCalled();
    expect(relatoriosService.alunosLista).not.toHaveBeenCalled();
    expect(relatoriosService.turmas).not.toHaveBeenCalled();
    expect(relatoriosService.evasoes).not.toHaveBeenCalled();
    expect(relatoriosService.riscoEvasao).not.toHaveBeenCalled();
    expect(relatoriosService.impactoSocial).not.toHaveBeenCalled();
    expect(relatorioAtendimentoApi.gerar).not.toHaveBeenCalled();
    expect(turmasService.listar).not.toHaveBeenCalled();
    expect(turmasService.listarProfessoresAtivos).not.toHaveBeenCalled();
    expect(beneficiariosService.listar).not.toHaveBeenCalled();
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
    expect(relatorioAtendimentoApi.gerar).not.toHaveBeenCalled();
  });

  it('alterna abas sem perder o estado carregado', async () => {
    await montarComponente('ADMIN');

    component.mudarAba('evasoes');
    fixture.detectChanges();

    expect(component.abaAtiva()).toBe('evasoes');
    expect(fixture.nativeElement.querySelector('#painel-evasoes')).not.toBeNull();
    expect(relatoriosService.evasoes).toHaveBeenCalledWith({ statusAluno: 'TODOS' });
    expect(relatoriosService.riscoEvasao).toHaveBeenCalledWith({ statusAluno: 'TODOS' });

    relatoriosService.evasoes.mockClear();
    relatoriosService.riscoEvasao.mockClear();
    component.mudarAba('visao-geral');
    component.mudarAba('evasoes');

    expect(relatoriosService.evasoes).not.toHaveBeenCalled();
    expect(relatoriosService.riscoEvasao).not.toHaveBeenCalled();
  });

  it('carrega impacto social somente ao abrir a aba dedicada', async () => {
    await montarComponente('ADMIN');

    expect(relatoriosService.impactoSocial).not.toHaveBeenCalled();

    component.mudarAba('impacto-social');

    expect(relatoriosService.impactoSocial).toHaveBeenCalledWith({ statusAluno: 'TODOS' });
    expect(component.impactoSocial()).toEqual(impactoSocialVazio);
    expect(component.abasCarregadas()['impacto-social']).toBe(true);
  });

  it('carrega alunos somente ao abrir a aba de alunos e nao carrega a lista automaticamente', async () => {
    await montarComponente('ADMIN');

    component.mudarAba('alunos');

    expect(relatoriosService.alunosResumo).toHaveBeenCalledWith({ statusAluno: 'TODOS' });
    expect(relatoriosService.alunosDistribuicoes).toHaveBeenCalledWith({ statusAluno: 'TODOS' });
    expect(component.alunosResumo()).toEqual(alunosResumoVazio);
    expect(component.alunosDistribuicoes()).toEqual(alunosDistribuicoesVazio);
    expect(relatoriosService.alunosLista).not.toHaveBeenCalled();
  });

  it('invalida cache ao mudar filtros e recarrega somente a aba ativa', async () => {
    await montarComponente('ADMIN');
    component.mudarAba('atendimentos');
    relatoriosService.resumo.mockClear();
    relatoriosService.alunosResumo.mockClear();
    relatoriosService.turmas.mockClear();
    relatoriosService.evasoes.mockClear();
    relatoriosService.riscoEvasao.mockClear();
    relatoriosService.impactoSocial.mockClear();
    relatorioAtendimentoApi.gerar.mockClear();

    component.aplicarFiltros({ professorId: 'prof-1', statusAluno: 'ATIVO' });

    expect(relatorioAtendimentoApi.gerar).toHaveBeenCalledWith({ professorId: 'prof-1' });
    expect(relatoriosService.resumo).not.toHaveBeenCalled();
    expect(relatoriosService.alunosResumo).not.toHaveBeenCalled();
    expect(relatoriosService.turmas).not.toHaveBeenCalled();
    expect(relatoriosService.evasoes).not.toHaveBeenCalled();
    expect(relatoriosService.riscoEvasao).not.toHaveBeenCalled();
    expect(relatoriosService.impactoSocial).not.toHaveBeenCalled();
    expect(component.abasCarregadas().atendimentos).toBe(true);
    expect(component.abasCarregadas()['visao-geral']).toBe(false);
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
    expect(component.alunosLista()).toBeNull();
    expect(component.turmas()).toBeNull();
    expect(component.evasoes()).toBeNull();

    component.abrirListaAlunos();

    expect(relatoriosService.alunosLista).toHaveBeenCalledWith({ statusAluno: 'TODOS' }, 1, 20);
    expect(component.alunosLista()?.data).toEqual([]);
  });

  it('exibe mensagem amigavel quando a API falha', async () => {
    await montarComponente('ADMIN', true);
    fixture.detectChanges();

    expect(component.erro()).toBe('Nao foi possivel carregar o resumo dos relatorios.');
    expect(fixture.nativeElement.textContent).toContain('Nao foi possivel carregar o resumo dos relatorios.');
  });
});
