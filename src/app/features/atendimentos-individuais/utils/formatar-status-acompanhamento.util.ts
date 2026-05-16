import { StatusAcompanhamentoIndividual } from '../models/acompanhamento-individual.model';

export function formatarStatusAcompanhamento(status: StatusAcompanhamentoIndividual): string {
  const labels: Record<StatusAcompanhamentoIndividual, string> = {
    EM_ANDAMENTO: 'Em andamento',
    FINALIZADO: 'Finalizado',
    ARQUIVADO: 'Arquivado',
  };
  return labels[status] ?? status;
}
