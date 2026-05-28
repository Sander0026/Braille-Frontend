export interface DashboardAtendimentoIndividual {
  periodo: {
    inicio: string;
    fim: string;
  };
  indicadores: {
    emAndamento: number;
    finalizados: number;
    arquivados: number;
    atendimentosNoMes: number;
    faltasJustificadasComComprovante: number;
    faltasJustificadasSemComprovante: number;
    mediaAtendimentosPorAcompanhamento: number;
  };
  atendimentosPorProfessor: Array<{
    professorId: string;
    nome: string;
    matricula?: string | null;
    total: number;
  }>;
  alunosMaisAtendidos: Array<{
    alunoId: string;
    nome: string;
    matricula?: string | null;
    total: number;
  }>;
}
