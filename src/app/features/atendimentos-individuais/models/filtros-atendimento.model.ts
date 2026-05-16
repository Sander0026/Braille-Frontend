import { StatusAcompanhamentoIndividual } from './acompanhamento-individual.model';
import { TipoRegistroAtendimentoIndividual } from './atendimento-individual.model';

export interface FiltroAcompanhamentoIndividual {
  page?: number;
  limit?: number;
  alunoId?: string;
  professorId?: string;
  status?: StatusAcompanhamentoIndividual;
  busca?: string;
  dataInicio?: string;
  dataFim?: string;
}

export interface FiltroRelatorioAtendimento {
  alunoId?: string;
  professorId?: string;
  status?: StatusAcompanhamentoIndividual;
  tipoRegistro?: TipoRegistroAtendimentoIndividual;
  dataInicio?: string;
  dataFim?: string;
}
