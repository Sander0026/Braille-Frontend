import { TipoRegistroAtendimentoIndividual } from '../models/atendimento-individual.model';

export function formatarTipoRegistro(tipo: TipoRegistroAtendimentoIndividual): string {
  const labels: Record<TipoRegistroAtendimentoIndividual, string> = {
    ATENDIMENTO_REALIZADO: 'Atendimento realizado',
    FALTA_JUSTIFICADA: 'Falta justificada',
    FALTA_NAO_JUSTIFICADA: 'Falta nao justificada',
    CANCELADO: 'Cancelado',
  };
  return labels[tipo] ?? tipo;
}
