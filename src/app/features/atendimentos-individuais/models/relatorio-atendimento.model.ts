import { AcompanhamentoIndividual } from './acompanhamento-individual.model';
import { FiltroRelatorioAtendimento } from './filtros-atendimento.model';

export interface RelatorioAtendimentoIndividual {
  filtros: FiltroRelatorioAtendimento;
  totalAcompanhamentos: number;
  totalRegistros: number;
  totais: {
    atendimentosRealizados: number;
    faltasJustificadas: number;
    faltasNaoJustificadas: number;
    cancelados: number;
  };
  acompanhamentos: AcompanhamentoIndividual[];
}
