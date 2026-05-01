export type TipoModeloCertificado = 'ACADEMICO' | 'HONRARIA';
export type CertificadoTextAlign = 'left' | 'center' | 'right' | 'justify';

export interface CertificadoElementoTexto {
  x: number;
  y: number;
  fontSize?: number;
  color?: string;
  maxWidth?: number;
  fontFamily?: string;
  textAlign?: CertificadoTextAlign;
}

export interface CertificadoElementoImagem {
  x: number;
  y: number;
  width?: number;
}

export interface CertificadoQrCode {
  x: number;
  y: number;
  size?: number;
}

export interface CertificadoLayoutConfig {
  textoPronto: CertificadoElementoTexto;
  nomeAluno: CertificadoElementoTexto;
  assinatura1: CertificadoElementoImagem;
  assinatura2: CertificadoElementoImagem;
  qrCode: CertificadoQrCode;
}

export type CertificadoLayoutCampo = keyof CertificadoLayoutConfig;

export interface TesteGeracaoCertificadoPayload {
  nome?: string;
  tipo?: TipoModeloCertificado;
  textoTemplate: string;
  layoutConfig: CertificadoLayoutConfig;
  nomeAssinante?: string;
  cargoAssinante?: string;
  nomeAssinante2?: string;
  cargoAssinante2?: string;
}

export interface CertificadoEmitido {
  id: string;
  tituloCertificado?: string;
  dataEmissao: string;
  codigoValidacao?: string;
  pdfUrl?: string | null;
  emitidoPor?: {
    id?: string;
    nome?: string;
    nomeCompleto?: string;
  } | null;
}

export interface EmitirCertificadoApoiadorPayload {
  modeloId: string;
  acaoId?: string;
  motivoPersonalizado?: string;
  dataEmissao?: string;
}

export interface EmitirCertificadoApoiadorResponse {
  certificado: CertificadoEmitido;
  pdfBase64?: string;
  pdfUrl?: string;
  codigoValidacao?: string;
}

export interface PdfCertificadoResponse {
  pdfUrl: string;
  codigoValidacao: string;
}

export const CERTIFICADO_LAYOUT_PADRAO: CertificadoLayoutConfig = {
  textoPronto: { x: 10, y: 20, fontSize: 32, color: '#1a1a00', maxWidth: 80, fontFamily: 'Helvetica', textAlign: 'justify' },
  nomeAluno: { x: 10, y: 45, fontSize: 60, color: '#000000', maxWidth: 80, fontFamily: 'Great Vibes' },
  assinatura1: { x: 20, y: 70, width: 20 },
  assinatura2: { x: 60, y: 70, width: 20 },
  qrCode: { x: 80, y: 80, size: 10 },
};

export function normalizarCertificadoLayoutConfig(
  layout?: Partial<CertificadoLayoutConfig> | null
): CertificadoLayoutConfig {
  return {
    textoPronto: { ...CERTIFICADO_LAYOUT_PADRAO.textoPronto, ...layout?.textoPronto },
    nomeAluno: { ...CERTIFICADO_LAYOUT_PADRAO.nomeAluno, ...layout?.nomeAluno },
    assinatura1: { ...CERTIFICADO_LAYOUT_PADRAO.assinatura1, ...layout?.assinatura1 },
    assinatura2: { ...CERTIFICADO_LAYOUT_PADRAO.assinatura2, ...layout?.assinatura2 },
    qrCode: { ...CERTIFICADO_LAYOUT_PADRAO.qrCode, ...layout?.qrCode },
  };
}
