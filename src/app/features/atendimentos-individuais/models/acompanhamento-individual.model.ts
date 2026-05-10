import { AtendimentoIndividual } from './atendimento-individual.model';

export type StatusAcompanhamentoIndividual = 'EM_ANDAMENTO' | 'FINALIZADO' | 'ARQUIVADO';

export interface AcompanhamentoIndividual {
  id: string;
  alunoId: string;
  professorId: string;
  assuntoAtual: string;
  descricao?: string | null;
  status: StatusAcompanhamentoIndividual;
  /** Flag booleana independente do status pedagogico. Quando true, o backend projeta status='ARQUIVADO'. */
  arquivado?: boolean;
  arquivadoEm?: string | null;
  arquivadoPorId?: string | null;
  desarquivadoEm?: string | null;
  desarquivadoPorId?: string | null;
  motivoArquivamento?: string | null;
  motivoDesarquivamento?: string | null;
  dataInicio: string;
  dataFinalizacao?: string | null;
  resultadoFinal?: string | null;
  resumoFinal?: string | null;
  criadoEm: string;
  atualizadoEm: string;
  aluno?: { id: string; nomeCompleto: string; matricula?: string | null; statusAtivo?: boolean };
  professor?: { id: string; nome: string; matricula?: string | null; role?: string };
  atendimentos?: AtendimentoIndividual[];
  _count?: { atendimentos: number };
}

export interface CriarAcompanhamentoIndividualPayload {
  alunoId: string;
  professorId?: string;
  assuntoAtual: string;
  descricao?: string;
  primeiroAtendimento?: import('./atendimento-individual.model').CriarAtendimentoIndividualPayload;
}
