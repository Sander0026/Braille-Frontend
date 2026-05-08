import { ArquivoAtendimentoIndividual } from './arquivo-atendimento.model';

export type TipoRegistroAtendimentoIndividual =
  | 'ATENDIMENTO_REALIZADO'
  | 'FALTA_JUSTIFICADA'
  | 'FALTA_NAO_JUSTIFICADA'
  | 'CANCELADO';

export interface AtendimentoIndividual {
  id: string;
  acompanhamentoId: string;
  alunoId: string;
  professorId: string;
  dataAtendimento: string;
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
  assuntoDoDia?: string;
  observacao?: string;
  evolucao?: string;
  dificuldades?: string;
  pendencias?: string;
  recomendacoes?: string;
}
