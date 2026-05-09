import { ArquivoAtendimentoIndividual } from './arquivo-atendimento.model';

export type TipoRegistroAtendimentoIndividual =
  | 'ATENDIMENTO_REALIZADO'
  | 'FALTA_JUSTIFICADA'
  | 'FALTA_NAO_JUSTIFICADA'
  | 'CANCELADO';

export type ModalidadeAtendimentoIndividual = 'PRESENCIAL' | 'REMOTO' | 'TELEFONE' | 'OUTRO';

export interface AtendimentoIndividual {
  id: string;
  acompanhamentoId: string;
  alunoId: string;
  professorId: string;
  dataAtendimento: string;
  horaInicio?: string | null;
  horaFim?: string | null;
  duracaoMinutos?: number | null;
  modalidade?: ModalidadeAtendimentoIndividual | null;
  localAtendimento?: string | null;
  tipoRegistro: TipoRegistroAtendimentoIndividual;
  assuntoDoDia?: string | null;
  observacao?: string | null;
  evolucao?: string | null;
  dificuldades?: string | null;
  pendencias?: string | null;
  recomendacoes?: string | null;
  arquivos?: ArquivoAtendimentoIndividual[];
}

export interface CriarAtendimentoIndividualPayload {
  dataAtendimento: string;
  tipoRegistro: TipoRegistroAtendimentoIndividual;
  horaInicio?: string;
  horaFim?: string;
  duracaoMinutos?: number;
  modalidade?: ModalidadeAtendimentoIndividual;
  localAtendimento?: string;
  assuntoDoDia?: string;
  observacao?: string;
  evolucao?: string;
  dificuldades?: string;
  pendencias?: string;
  recomendacoes?: string;
}
