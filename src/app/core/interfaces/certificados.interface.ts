export type TipoModeloCertificado = 'ACADEMICO' | 'HONRARIA';
export type CertificadoTextAlign = 'left' | 'center' | 'right' | 'justify';
export type CertificadoLayoutElementType =
  | 'TEXT'
  | 'DYNAMIC_TEXT'
  | 'SIGNATURE_IMAGE'
  | 'SIGNATURE_BLOCK'
  | 'QR_CODE'
  | 'VALIDATION_CODE'
  | 'LINE';

export interface CertificadoFonte {
  label: string;
  value: string;
  category: 'Padrao' | 'Sem serifa' | 'Serifada' | 'Cursiva';
}

export const CERTIFICADO_FONTES: CertificadoFonte[] = [
  { label: 'Helvetica', value: 'Helvetica', category: 'Padrao' },
  { label: 'Times Roman', value: 'TimesRoman', category: 'Padrao' },
  { label: 'Courier', value: 'Courier', category: 'Padrao' },
  { label: 'Roboto', value: 'Roboto', category: 'Sem serifa' },
  { label: 'Open Sans', value: 'Open Sans', category: 'Sem serifa' },
  { label: 'Montserrat', value: 'Montserrat', category: 'Sem serifa' },
  { label: 'Merriweather', value: 'Merriweather', category: 'Serifada' },
  { label: 'Cinzel', value: 'Cinzel', category: 'Serifada' },
  { label: 'Playfair Display', value: 'Playfair Display', category: 'Serifada' },
  { label: 'Great Vibes', value: 'Great Vibes', category: 'Cursiva' },
  { label: 'Parisienne', value: 'Parisienne', category: 'Cursiva' },
  { label: 'Dancing Script', value: 'Dancing Script', category: 'Cursiva' },
  { label: 'Pacifico', value: 'Pacifico', category: 'Cursiva' },
];

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
  elements?: CertificadoLayoutElement[];
}

export type CertificadoLayoutCampo = keyof CertificadoLayoutConfig;

export interface CertificadoLayoutElement {
  id: string;
  type: CertificadoLayoutElementType;
  label: string;
  content?: string;
  x: number;
  y: number;
  width: number;
  height?: number;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  color?: string;
  textAlign?: CertificadoTextAlign;
  lineHeight?: number;
  zIndex?: number;
  visible?: boolean;
  legacyField?: Exclude<CertificadoLayoutCampo, 'elements'>;
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
  dataEvento?: string;
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
  elements: [],
};

export function normalizarCertificadoLayoutConfig(
  layout?: Partial<CertificadoLayoutConfig> | null
): CertificadoLayoutConfig {
  const normalizado: CertificadoLayoutConfig = {
    textoPronto: { ...CERTIFICADO_LAYOUT_PADRAO.textoPronto, ...layout?.textoPronto },
    nomeAluno: { ...CERTIFICADO_LAYOUT_PADRAO.nomeAluno, ...layout?.nomeAluno },
    assinatura1: { ...CERTIFICADO_LAYOUT_PADRAO.assinatura1, ...layout?.assinatura1 },
    assinatura2: { ...CERTIFICADO_LAYOUT_PADRAO.assinatura2, ...layout?.assinatura2 },
    qrCode: { ...CERTIFICADO_LAYOUT_PADRAO.qrCode, ...layout?.qrCode },
  };

  normalizado.elements = Array.isArray(layout?.elements) && layout.elements.length > 0
    ? layout.elements.map((element, index) => normalizarCertificadoLayoutElement(element, index))
    : criarElementosLayoutPadrao(normalizado);

  return normalizado;
}

export function criarElementosLayoutPadrao(layout: CertificadoLayoutConfig): CertificadoLayoutElement[] {
  return [
    {
      id: 'legacy-nome-aluno',
      type: 'TEXT',
      label: 'Nome do aluno',
      content: '{{ALUNO}}',
      x: layout.nomeAluno.x,
      y: layout.nomeAluno.y,
      width: layout.nomeAluno.maxWidth || 80,
      height: 8,
      fontFamily: layout.nomeAluno.fontFamily || 'Great Vibes',
      fontSize: layout.nomeAluno.fontSize || 60,
      fontWeight: 'normal',
      color: layout.nomeAluno.color || '#000000',
      textAlign: layout.nomeAluno.textAlign || 'center',
      zIndex: 2,
      visible: true,
      legacyField: 'nomeAluno',
    },
    {
      id: 'legacy-texto-principal',
      type: 'DYNAMIC_TEXT',
      label: 'Texto principal',
      content: '{{TEXTO_CERTIFICADO}}',
      x: layout.textoPronto.x,
      y: layout.textoPronto.y,
      width: layout.textoPronto.maxWidth || 80,
      height: 22,
      fontFamily: layout.textoPronto.fontFamily || 'Helvetica',
      fontSize: layout.textoPronto.fontSize || 32,
      fontWeight: 'normal',
      color: layout.textoPronto.color || '#1a1a00',
      textAlign: layout.textoPronto.textAlign || 'justify',
      lineHeight: 1.75,
      zIndex: 3,
      visible: true,
      legacyField: 'textoPronto',
    },
    {
      id: 'legacy-assinatura-1',
      type: 'SIGNATURE_BLOCK',
      label: 'Assinatura 1',
      x: layout.assinatura1.x,
      y: layout.assinatura1.y,
      width: layout.assinatura1.width || 20,
      height: 12,
      zIndex: 4,
      visible: true,
      legacyField: 'assinatura1',
    },
    {
      id: 'legacy-assinatura-2',
      type: 'SIGNATURE_BLOCK',
      label: 'Assinatura 2',
      x: layout.assinatura2.x,
      y: layout.assinatura2.y,
      width: layout.assinatura2.width || 20,
      height: 12,
      zIndex: 5,
      visible: true,
      legacyField: 'assinatura2',
    },
    {
      id: 'legacy-qrcode',
      type: 'QR_CODE',
      label: 'QR Code',
      x: layout.qrCode.x,
      y: layout.qrCode.y,
      width: layout.qrCode.size || 10,
      height: layout.qrCode.size || 10,
      zIndex: 6,
      visible: true,
      legacyField: 'qrCode',
    },
  ];
}

export function normalizarCertificadoLayoutElement(
  element: Partial<CertificadoLayoutElement>,
  index = 0
): CertificadoLayoutElement {
  return {
    id: element.id || `element-${Date.now()}-${index}`,
    type: element.type || 'TEXT',
    label: element.label || 'Elemento',
    content: element.content || '',
    x: Number.isFinite(element.x) ? Number(element.x) : 10,
    y: Number.isFinite(element.y) ? Number(element.y) : 10,
    width: Number.isFinite(element.width) ? Number(element.width) : 30,
    height: Number.isFinite(element.height) ? Number(element.height) : 8,
    fontFamily: element.fontFamily || 'Helvetica',
    fontSize: element.fontSize || 16,
    fontWeight: element.fontWeight || 'normal',
    color: element.color || '#000000',
    textAlign: element.textAlign || 'center',
    lineHeight: element.lineHeight || 1.4,
    zIndex: Number.isFinite(element.zIndex) ? Number(element.zIndex) : index + 1,
    visible: element.visible !== false,
    legacyField: element.legacyField,
  };
}
