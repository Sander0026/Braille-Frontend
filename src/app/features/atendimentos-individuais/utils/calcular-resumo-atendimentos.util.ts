import { AtendimentoIndividual } from '../models/atendimento-individual.model';

export function calcularResumoAtendimentos(atendimentos: AtendimentoIndividual[] = []) {
  return {
    atendimentosRealizados: atendimentos.filter(a => a.tipoRegistro === 'ATENDIMENTO_REALIZADO').length,
    faltasJustificadas: atendimentos.filter(a => a.tipoRegistro === 'FALTA_JUSTIFICADA').length,
    faltasNaoJustificadas: atendimentos.filter(a => a.tipoRegistro === 'FALTA_NAO_JUSTIFICADA').length,
    cancelados: atendimentos.filter(a => a.tipoRegistro === 'CANCELADO').length,
  };
}
