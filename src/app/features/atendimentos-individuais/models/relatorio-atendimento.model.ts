import { AcompanhamentoIndividual } from './acompanhamento-individual.model';
import { FiltroRelatorioAtendimento } from './filtros-atendimento.model';

export interface RelatorioAtendimentoIndividual {
  filtros: FiltroRelatorioAtendimento;
  totalAcompanhamentos: number;
  totalRegistros: number;
  indicadores: {
    totalAcompanhamentos: number;
    emAndamento: number;
    finalizados: number;
    arquivados: number;
    totalAtendimentosRealizados: number;
    faltasJustificadas: number;
    faltasNaoJustificadas: number;
    atendimentosCancelados: number;
    mediaAtendimentosPorAluno: number;
    mediaDuracaoMinutos: number;
    porStatusAcompanhamento: Record<string, number>;
    porTipoRegistro: Record<string, number>;
    porModalidade: Record<string, number>;
  };
  atendimentosPorProfessor: Array<{
    professorId: string;
    nome: string;
    matricula: string | null;
    total: number;
  }>;
  alunosMaisAtendidos: Array<{
    alunoId: string;
    nome: string;
    matricula: string | null;
    total: number;
  }>;
  totais: {
    atendimentosRealizados: number;
    faltasJustificadas: number;
    faltasJustificadasComComprovante?: number;
    faltasJustificadasSemComprovante?: number;
    faltasNaoJustificadas: number;
    cancelados: number;
  };
  acompanhamentos: AcompanhamentoIndividual[];
}
