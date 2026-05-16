export type CategoriaArquivoAtendimentoIndividual = 'ATESTADO' | 'LAUDO' | 'MATERIAL_PEDAGOGICO' | 'DOCUMENTO' | 'OUTRO';

export interface ArquivoAtendimentoIndividual {
  id: string;
  atendimentoId: string;
  nomeOriginal: string;
  nomeArquivo: string;
  downloadUrl: string;
  tipoArquivo: string;
  tamanho: number;
  categoria: CategoriaArquivoAtendimentoIndividual;
  criadoEm: string;
}
