import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';

export type StatusAlunoRelatorio = 'ATIVO' | 'INATIVO' | 'TODOS';
export type TurmaStatusRelatorio = 'PREVISTA' | 'ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA';
export type MatriculaStatusRelatorio = 'ATIVA' | 'CONCLUIDA' | 'EVADIDA' | 'CANCELADA' | 'TRANSFERIDA';
export type StatusAcompanhamentoRelatorio = 'EM_ANDAMENTO' | 'FINALIZADO' | 'ARQUIVADO';
export type TipoRegistroAtendimentoRelatorio =
  | 'ATENDIMENTO_REALIZADO'
  | 'FALTA_JUSTIFICADA'
  | 'FALTA_NAO_JUSTIFICADA'
  | 'CANCELADO';
export type ModalidadeAtendimentoRelatorio = 'PRESENCIAL' | 'REMOTO' | 'TELEFONE' | 'OUTRO';
export type MotivoEncerramentoMatricula =
  | 'CONCLUSAO'
  | 'EVASAO_SEM_JUSTIFICATIVA'
  | 'MUDANCA_DE_TURNO'
  | 'TRANSFERENCIA_DE_TURMA'
  | 'MUDANCA_DE_CIDADE'
  | 'DIFICULDADE_TRANSPORTE'
  | 'PROBLEMA_SAUDE'
  | 'PROBLEMA_FAMILIAR'
  | 'INCOMPATIBILIDADE_HORARIO'
  | 'FALTA_DE_CONTATO'
  | 'DESISTENCIA_VOLUNTARIA'
  | 'CANCELAMENTO_DA_TURMA'
  | 'OUTRO';

export interface RelatorioFiltro {
  dataInicio?: string;
  dataFim?: string;
  turmaId?: string;
  professorId?: string;
  alunoId?: string;
  statusAluno?: StatusAlunoRelatorio;
  statusTurma?: TurmaStatusRelatorio;
  statusMatricula?: MatriculaStatusRelatorio;
  statusAcompanhamento?: StatusAcompanhamentoRelatorio;
  tipoRegistroAtendimento?: TipoRegistroAtendimentoRelatorio;
  modalidadeAtendimento?: ModalidadeAtendimentoRelatorio;
  motivoEncerramento?: MotivoEncerramentoMatricula;
  cidade?: string;
  bairro?: string;
  tipoDeficiencia?: string;
}

export interface RelatorioOpcao {
  id: string;
  label: string;
}

export interface RelatorioResumo {
  alunos: {
    total: number;
    ativos: number;
    inativos: number;
    novosNoPeriodo: number;
  };
  turmas: {
    total: number;
    previstas: number;
    andamento: number;
    concluidas: number;
    canceladas: number;
  };
  matriculas: {
    total: number;
    ativas: number;
    concluidas: number;
    evadidas: number;
    canceladas: number;
    transferidas: number;
  };
  indicadores: {
    taxaEvasao: number;
    taxaConclusao: number;
    taxaPermanencia: number;
  };
}

export interface RelatorioAlunoItem {
  id: string;
  matricula: string | null;
  nomeCompleto: string;
  dataNascimento: string;
  cpf: string | null;
  telefoneContato: string | null;
  cidade: string | null;
  bairro: string | null;
  tipoDeficiencia: string | null;
  causaDeficiencia: string | null;
  prefAcessibilidade: string | null;
  possuiLaudo: boolean;
  laudoUrl: string | null;
  escolaridade: string | null;
  rendaFamiliar: string | null;
  beneficiosGov: string | null;
  precisaAcompanhante: boolean;
  termoLgpdAceito: boolean;
  statusAtivo: boolean;
  criadoEm: string;
  matriculasOficina?: Array<{
    id: string;
    status: MatriculaStatusRelatorio;
    dataEntrada: string;
    dataEncerramento: string | null;
    motivoEncerramento: MotivoEncerramentoMatricula | null;
    turma: {
      id: string;
      nome: string;
      status: TurmaStatusRelatorio;
    };
  }>;
}

export interface RelatorioAlunosResponse {
  filtros: RelatorioFiltro;
  total: number;
  indicadores: {
    totalCadastrados: number;
    ativos: number;
    inativos: number;
    cadastradosNoPeriodo: number;
    porTipoDeficiencia: Record<string, number>;
    porCausaDeficiencia: Record<string, number>;
    porPreferenciaAcessibilidade: Record<string, number>;
    porCidade: Record<string, number>;
    porBairro: Record<string, number>;
    porEscolaridade: Record<string, number>;
    porRendaFamiliar: Record<string, number>;
    recebemBeneficioGov: number;
    precisamAcompanhante: number;
    comLaudo: number;
    semLaudo: number;
    lgpdAceito: number;
  };
  porStatus: {
    ativos: number;
    inativos: number;
  };
  porCidade: Record<string, number>;
  porTipoDeficiencia: Record<string, number>;
  data: RelatorioAlunoItem[];
}

export interface RelatorioAlunosResumo {
  totalCadastrados: number;
  ativos: number;
  inativos: number;
  comLaudo: number;
  semLaudo: number;
  precisamAcompanhante: number;
  lgpdAceito: number;
}

export interface RelatorioRankingItem {
  label: string;
  total: number;
}

export interface RelatorioAlunosDistribuicoes {
  porTipoDeficiencia: RelatorioRankingItem[];
  porCidadeTop10: RelatorioRankingItem[];
  porBairroTop10: RelatorioRankingItem[];
  porEscolaridadeTop10: RelatorioRankingItem[];
  porRendaFamiliarTop10: RelatorioRankingItem[];
}

export interface RelatorioAlunosListaResponse {
  data: RelatorioAlunoItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    lastPage: number;
  };
}

export interface RelatorioTurmaItem {
  id: string;
  nome: string;
  descricao: string | null;
  status: TurmaStatusRelatorio;
  statusAtivo: boolean;
  dataInicio: string | null;
  dataFim: string | null;
  cargaHoraria: string | null;
  capacidadeMaxima: number | null;
  professor: {
    id: string;
    nome: string;
    matricula: string | null;
  };
  matriculasOficina: Array<{
    id: string;
    status: MatriculaStatusRelatorio;
    dataEntrada: string;
    dataEncerramento: string | null;
    motivoEncerramento: MotivoEncerramentoMatricula | null;
    aluno: {
      id: string;
      nomeCompleto: string;
      matricula: string | null;
    };
  }>;
  matriculasResumo: Record<string, number>;
  metricas: {
    totalMatriculas: number;
    matriculasAtivas: number;
    matriculasConcluidas: number;
    matriculasEvadidas: number;
    matriculasCanceladas: number;
    matriculasTransferidas: number;
    totalEncerradas: number;
    taxaOcupacao: number;
    taxaEvasao: number;
    taxaConclusao: number;
  };
  _count: {
    frequencias: number;
  };
}

export interface RelatorioTurmasResponse {
  filtros: RelatorioFiltro;
  total: number;
  indicadores: {
    totalTurmas: number;
    previstas: number;
    andamento: number;
    concluidas: number;
    canceladas: number;
    arquivadas: number;
    totalVagas: number;
    vagasOcupadas: number;
    taxaMediaOcupacao: number;
    alunosMatriculadosPorTurma: Array<{
      turmaId: string;
      turma: string;
      totalMatriculas: number;
    }>;
  };
  porStatus: Record<string, number>;
  data: RelatorioTurmaItem[];
}

export interface RelatorioEvasaoItem {
  id: string;
  status: MatriculaStatusRelatorio;
  motivoEncerramento: MotivoEncerramentoMatricula | null;
  observacao: string | null;
  dataEntrada: string;
  dataEncerramento: string | null;
  dataSaida: string | null;
  encerradoEm: string | null;
  encerradoPorId: string | null;
  tempoPermanenciaDias: number | null;
  atendimentosIndividuais: {
    possuiAtendimento: boolean;
    totalAtendimentos: number;
    faltasJustificadas: number;
    faltasNaoJustificadas: number;
    cancelados: number;
    acompanhamentosTotal: number;
    acompanhamentosEmAndamento: number;
    acompanhamentosFinalizados: number;
    acompanhamentosArquivados: number;
    teveFalta: boolean;
  };
  registradoPor: {
    id: string;
    nome: string;
    email: string | null;
    matricula: string | null;
  } | null;
  aluno: {
    id: string;
    nomeCompleto: string;
    matricula: string | null;
    cidade: string | null;
    bairro: string | null;
    tipoDeficiencia: string | null;
  };
  turma: {
    id: string;
    nome: string;
    status: TurmaStatusRelatorio;
    professor: {
      id: string;
      nome: string;
    };
  };
}

export interface RelatorioEvasoesResponse {
  filtros: RelatorioFiltro;
  totalEncerramentos: number;
  totalEvasoes: number;
  indicadores: {
    totalEvasoes: number;
    totalCancelamentos: number;
    totalTransferencias: number;
    semMotivoEstruturado: number;
    evasoesComAtendimentoIndividual: number;
    evasoesSemAtendimentoIndividual: number;
    evasoesComFaltasEmAtendimento: number;
    evasoesComAcompanhamentoFinalizado: number;
    evasoesComAcompanhamentoArquivado: number;
    porTurma: Record<string, number>;
    porProfessor: Record<string, number>;
    porMes: Record<string, number>;
    porMotivo: Record<string, number>;
    porTipoDeficiencia: Record<string, number>;
    porCidade: Record<string, number>;
    porBairro: Record<string, number>;
    porCidadeBairro: Record<string, number>;
    tempoMedioPermanenciaDias: number;
    rankingTurmas: Array<{
      nome: string;
      total: number;
    }>;
  };
  porStatus: Record<string, number>;
  porMotivo: Record<string, number>;
  data: RelatorioEvasaoItem[];
}

export interface RelatorioAtendimentoItem {
  id: string;
  dataAtendimento: string;
  horaInicioMinutos: number | null;
  horaFimMinutos: number | null;
  duracaoMinutos: number | null;
  modalidade: string | null;
  localAtendimento: string | null;
  tipoRegistro: string;
  assuntoDoDia: string | null;
  observacao: string | null;
  aluno: {
    id: string;
    nomeCompleto: string;
    matricula: string | null;
    cidade: string | null;
    bairro: string | null;
    tipoDeficiencia: string | null;
  };
  professor: {
    id: string;
    nome: string;
    matricula: string | null;
  };
  acompanhamento: {
    id: string;
    assuntoAtual: string;
    status: string;
  };
}

export interface RelatorioAtendimentosResponse {
  filtros: RelatorioFiltro;
  total: number;
  porTipoRegistro: Record<string, number>;
  data: RelatorioAtendimentoItem[];
}

export interface RelatorioFrequenciaItem {
  id: string;
  dataAula: string;
  status: 'PRESENTE' | 'FALTA' | 'FALTA_JUSTIFICADA';
  observacao: string | null;
  fechado: boolean;
  aluno: {
    id: string;
    nomeCompleto: string;
    matricula: string | null;
    cidade: string | null;
    bairro: string | null;
    tipoDeficiencia: string | null;
  };
  turma: {
    id: string;
    nome: string;
    status: TurmaStatusRelatorio;
    professor: {
      id: string;
      nome: string;
    };
  };
}

export interface RelatorioFrequenciasResponse {
  filtros: RelatorioFiltro;
  total: number;
  presentes: number;
  faltas: number;
  faltasJustificadas: number;
  taxaPresenca: number;
  porStatus: Record<string, number>;
  data: RelatorioFrequenciaItem[];
}

export type NivelRiscoEvasao = 'ALTO' | 'MEDIO' | 'BAIXO';

export interface RelatorioRiscoEvasaoItem {
  alunoId: string;
  nomeCompleto: string;
  matricula: string | null;
  cidade: string | null;
  bairro: string | null;
  turmaId: string;
  turma: string;
  professor: string | null;
  faltasSeguidas: number;
  taxaPresenca: number;
  ultimaFrequencia: string | null;
  ultimoAtendimento: string | null;
  diasSemRegistro: number | null;
  criterios: string[];
  nivel: NivelRiscoEvasao;
  acaoAberta?: {
    id: string;
    status: StatusAcaoRiscoEvasao;
    responsavel?: string;
    prazo?: string;
  };
}

export interface RelatorioRiscoEvasaoResponse {
  filtros: RelatorioFiltro;
  total: number;
  indicadores: {
    alto: number;
    medio: number;
    baixo: number;
    tresFaltasSeguidas: number;
    presencaAbaixo60: number;
    semRegistro30Dias: number;
    matriculaAtivaSemFrequenciaRecente: number;
    acoesPendentes: number;
    acoesVencidas: number;
    acoesResolvidasNoMes: number;
  };
  data: RelatorioRiscoEvasaoItem[];
}

export type StatusAcaoRiscoEvasao = 'PENDENTE' | 'EM_ANDAMENTO' | 'RESOLVIDA' | 'SEM_CONTATO' | 'CANCELADA';
export type TipoAcaoRiscoEvasao =
  | 'CONTATO_TELEFONICO'
  | 'WHATSAPP'
  | 'REUNIAO_PRESENCIAL'
  | 'ENCAMINHAMENTO_ASSISTENCIAL'
  | 'AJUSTE_DE_HORARIO'
  | 'TRANSFERENCIA_DE_TURMA'
  | 'JUSTIFICATIVA_DE_FALTA'
  | 'VISITA_DOMICILIAR'
  | 'OUTRO';

export interface RelatorioImpactoMetricas {
  totalAlunosAtendidos: number;
  totalAtendimentosIndividuais: number;
  totalTurmasOfertadas: number;
  totalCertificadosEmitidos: number;
  totalAlunosDeficienciaVisualAtendidos: number;
  totalBairrosAlcancados: number;
  totalCidadesAlcancadas: number;
  taxaPermanencia: number;
  taxaConclusao: number;
}

export interface RelatorioComparativoItem {
  atual: number;
  anterior: number;
  variacaoPercentual: number;
  direcao: 'SUBIU' | 'DESCEU' | 'ESTAVEL';
}

export interface RelatorioImpactoSocialResponse {
  filtros: RelatorioFiltro;
  periodo: {
    atual: { dataInicio: string; dataFim: string };
    anterior: { dataInicio: string; dataFim: string };
  };
  metricas: RelatorioImpactoMetricas;
  comparativo: Record<keyof RelatorioImpactoMetricas, RelatorioComparativoItem>;
}

const RELATORIO_INSTITUCIONAL_KEYS = [
  'dataInicio',
  'dataFim',
  'turmaId',
  'professorId',
  'alunoId',
  'statusAluno',
  'statusTurma',
  'statusMatricula',
  'motivoEncerramento',
  'cidade',
  'bairro',
  'tipoDeficiencia',
] as const;

@Injectable({ providedIn: 'root' })
export class RelatoriosService {
  private readonly url = '/api/relatorios';

  constructor(private readonly http: HttpClient) {}

  resumo(filtro: RelatorioFiltro): Observable<RelatorioResumo> {
    return this.http.get<RelatorioResumo>(`${this.url}/resumo`, { params: this.buildParams(filtro) });
  }

  alunos(filtro: RelatorioFiltro): Observable<RelatorioAlunosResponse> {
    return this.http.get<RelatorioAlunosResponse>(`${this.url}/alunos`, { params: this.buildParams(filtro) });
  }

  alunosResumo(filtro: RelatorioFiltro): Observable<RelatorioAlunosResumo> {
    return this.http.get<RelatorioAlunosResumo>(`${this.url}/alunos/resumo`, { params: this.buildParams(filtro) });
  }

  alunosDistribuicoes(filtro: RelatorioFiltro): Observable<RelatorioAlunosDistribuicoes> {
    return this.http.get<RelatorioAlunosDistribuicoes>(`${this.url}/alunos/distribuicoes`, {
      params: this.buildParams(filtro),
    });
  }

  alunosLista(filtro: RelatorioFiltro, page = 1, limit = 20): Observable<RelatorioAlunosListaResponse> {
    const params = this.buildParams(filtro).set('page', page).set('limit', limit);
    return this.http.get<RelatorioAlunosListaResponse>(`${this.url}/alunos/lista`, { params });
  }

  turmas(filtro: RelatorioFiltro): Observable<RelatorioTurmasResponse> {
    return this.http.get<RelatorioTurmasResponse>(`${this.url}/turmas`, { params: this.buildParams(filtro) });
  }

  evasoes(filtro: RelatorioFiltro): Observable<RelatorioEvasoesResponse> {
    return this.http.get<RelatorioEvasoesResponse>(`${this.url}/evasoes`, { params: this.buildParams(filtro) });
  }

  atendimentos(filtro: RelatorioFiltro): Observable<RelatorioAtendimentosResponse> {
    return this.http.get<RelatorioAtendimentosResponse>(`${this.url}/atendimentos`, {
      params: this.buildParams(filtro),
    });
  }

  frequencias(filtro: RelatorioFiltro): Observable<RelatorioFrequenciasResponse> {
    return this.http.get<RelatorioFrequenciasResponse>(`${this.url}/frequencias`, {
      params: this.buildParams(filtro),
    });
  }

  riscoEvasao(filtro: RelatorioFiltro): Observable<RelatorioRiscoEvasaoResponse> {
    return this.http.get<RelatorioRiscoEvasaoResponse>(`${this.url}/risco-evasao`, {
      params: this.buildParams(filtro),
    });
  }

  /**
   * Busca o relatório de impacto social.
   * Quando `periodoComparativo` for fornecido (com ambas as datas preenchidas),
   * faz duas chamadas paralelas ao mesmo endpoint e monta o comparativo no frontend,
   * pois o backend não expõe parâmetros de período de comparação customizados.
   */
  impactoSocial(
    filtro: RelatorioFiltro,
    periodoComparativo?: { inicio: string; fim: string },
  ): Observable<RelatorioImpactoSocialResponse> {
    const filtroAtual: RelatorioFiltro = { ...filtro };

    if (!periodoComparativo?.inicio || !periodoComparativo?.fim) {
      // Sem comparativo customizado — chamada simples
      return this.http.get<RelatorioImpactoSocialResponse>(`${this.url}/impacto-social`, {
        params: this.buildParams(filtroAtual),
      });
    }

    // Com comparativo customizado — duas chamadas paralelas
    const filtroComparativo: RelatorioFiltro = {
      ...filtroAtual,
      dataInicio: periodoComparativo.inicio,
      dataFim: periodoComparativo.fim,
    };

    return forkJoin([
      this.http.get<RelatorioImpactoSocialResponse>(`${this.url}/impacto-social`, {
        params: this.buildParams(filtroAtual),
      }),
      this.http.get<RelatorioImpactoSocialResponse>(`${this.url}/impacto-social`, {
        params: this.buildParams(filtroComparativo),
      }),
    ]).pipe(
      map(([atual, comparativo]) =>
        this.mesclarComComparativoCustomizado(atual, comparativo),
      ),
    );
  }

  /**
   * Combina dois snapshots de impacto social: substitui o comparativo automático
   * pelo snapshot do período escolhido pelo usuário, recalculando as variações.
   */
  private mesclarComComparativoCustomizado(
    atual: RelatorioImpactoSocialResponse,
    comparativo: RelatorioImpactoSocialResponse,
  ): RelatorioImpactoSocialResponse {
    const metricasAtual = atual.metricas;
    const metricasComparativo = comparativo.metricas;

    const novoComparativo = (Object.keys(metricasAtual) as (keyof RelatorioImpactoMetricas)[]).reduce(
      (acc, key) => {
        const atual = metricasAtual[key];
        const anterior = metricasComparativo[key] ?? 0;
        const diferenca = atual - anterior;
        const variacaoPercentual =
          anterior === 0 ? (atual > 0 ? 100 : 0) : Math.round((diferenca / anterior) * 100 * 100) / 100;
        const direcao: 'SUBIU' | 'DESCEU' | 'ESTAVEL' =
          diferenca > 0 ? 'SUBIU' : diferenca < 0 ? 'DESCEU' : 'ESTAVEL';
        acc[key] = { atual, anterior, variacaoPercentual, direcao };
        return acc;
      },
      {} as Record<keyof RelatorioImpactoMetricas, RelatorioComparativoItem>,
    );

    return {
      ...atual,
      periodo: {
        ...atual.periodo,
        anterior: comparativo.periodo.atual, // O período atual da segunda chamada vira o anterior
      },
      comparativo: novoComparativo,
    };
  }

  buscarOpcoesTurmas(busca: string): Observable<RelatorioOpcao[]> {
    return this.http.get<RelatorioOpcao[]>(`${this.url}/opcoes/turmas`, {
      params: new HttpParams().set('busca', busca.trim()),
    });
  }

  buscarOpcoesProfessores(busca: string): Observable<RelatorioOpcao[]> {
    return this.http.get<RelatorioOpcao[]>(`${this.url}/opcoes/professores`, {
      params: new HttpParams().set('busca', busca.trim()),
    });
  }

  buscarOpcoesAlunos(busca: string): Observable<RelatorioOpcao[]> {
    return this.http.get<RelatorioOpcao[]>(`${this.url}/opcoes/alunos`, {
      params: new HttpParams().set('busca', busca.trim()),
    });
  }

  buscarOpcoesCidades(busca: string): Observable<RelatorioOpcao[]> {
    return this.http.get<RelatorioOpcao[]>(`${this.url}/opcoes/cidades`, {
      params: new HttpParams().set('busca', busca.trim()),
    });
  }

  buscarOpcoesBairros(busca: string, cidade?: string): Observable<RelatorioOpcao[]> {
    let params = new HttpParams().set('busca', busca.trim());
    if (cidade?.trim()) {
      params = params.set('cidade', cidade.trim());
    }
    return this.http.get<RelatorioOpcao[]>(`${this.url}/opcoes/bairros`, { params });
  }

  exportarPdf(filtro: RelatorioFiltro): Observable<Blob> {
    return this.http.post(`${this.url}/exportar/pdf`, this.limparFiltro(filtro, RELATORIO_INSTITUCIONAL_KEYS), {
      responseType: 'blob',
    });
  }

  exportarXlsx(filtro: RelatorioFiltro): Observable<Blob> {
    return this.http.post(`${this.url}/exportar/xlsx`, this.limparFiltro(filtro, RELATORIO_INSTITUCIONAL_KEYS), {
      responseType: 'blob',
    });
  }

  private buildParams(
    filtro: RelatorioFiltro,
    allowedKeys: readonly (keyof RelatorioFiltro)[] = RELATORIO_INSTITUCIONAL_KEYS,
  ): HttpParams {
    let params = new HttpParams();
    Object.entries(this.limparFiltro(filtro, allowedKeys)).forEach(([key, value]) => {
      params = params.set(key, String(value));
    });
    return params;
  }

  private limparFiltro(
    filtro: RelatorioFiltro,
    allowedKeys?: readonly (keyof RelatorioFiltro)[],
  ): Partial<RelatorioFiltro> {
    const limpo: Partial<RelatorioFiltro> = {};
    Object.entries(filtro).forEach(([key, value]) => {
      const keyPermitida = !allowedKeys || allowedKeys.includes(key as keyof RelatorioFiltro);
      if (keyPermitida && value !== undefined && value !== null && value !== '') {
        limpo[key as keyof RelatorioFiltro] = value as never;
      }
    });
    return limpo;
  }
}
