export type TipoModeloCertificado = 'ACADEMICO' | 'HONRARIA';
export type CertificadoTextAlign = 'left' | 'center' | 'right';
export type CertificadoLayoutElementType =
  | 'TEXT'
  | 'DYNAMIC_TEXT'
  | 'SIGNATURE_IMAGE'
  | 'SIGNATURE_BLOCK'
  | 'QR_CODE'
  | 'VALIDATION_CODE'
  | 'LINE'
  | 'RECTANGLE';

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
}

export interface CertificadoLayoutConfig {
  elements: CertificadoLayoutElement[];
}

export interface CertificadoEmitido {
  id: string;
  tituloCertificado?: string;
  dataEmissao: string;
  codigoValidacao?: string;
  pdfUrl?: string | null;
  modelo?: {
    nome: string;
  } | null;
  acao?: {
    descricaoAcao: string;
    dataEvento: string;
  } | null;
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
  elements: [
    {
      id: 'nome-aluno',
      type: 'TEXT',
      label: 'Nome do aluno',
      content: '{{ALUNO}}',
      x: 10,
      y: 45,
      width: 80,
      height: 8,
      fontFamily: 'Great Vibes',
      fontSize: 60,
      fontWeight: 'normal',
      textAlign: 'center',
      color: '#000000',
      zIndex: 1,
      visible: true,
    },
    {
      id: 'texto-principal',
      type: 'DYNAMIC_TEXT',
      label: 'Texto principal',
      content: '{{TEXTO_CERTIFICADO}}',
      x: 10,
      y: 20,
      width: 80,
      height: 22,
      fontFamily: 'Open Sans',
      fontSize: 32,
      fontWeight: 'normal',
      textAlign: 'center',
      color: '#1a1a00',
      lineHeight: 1.75,
      zIndex: 2,
      visible: true,
    },
    {
      id: 'assinatura-1',
      type: 'SIGNATURE_BLOCK',
      label: 'Assinatura 1',
      content: '{{NOME_RESPONSAVEL}}\n{{CARGO_RESPONSAVEL}}',
      x: 20,
      y: 70,
      width: 20,
      height: 12,
      zIndex: 3,
      visible: true,
    },
    {
      id: 'qrcode',
      type: 'QR_CODE',
      label: 'QR Code',
      x: 80,
      y: 80,
      width: 10,
      height: 10,
      zIndex: 4,
      visible: true,
    },
  ],
};

export function normalizarCertificadoLayoutConfig(
  layout?: Partial<CertificadoLayoutConfig> | null
): CertificadoLayoutConfig {
  const elements = Array.isArray(layout?.elements) && layout.elements.length > 0
    ? layout.elements.map((element, index) => normalizarCertificadoLayoutElement(element, index))
    : CERTIFICADO_LAYOUT_PADRAO.elements.map((element, index) => normalizarCertificadoLayoutElement(element, index));

  return { elements };
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
    textAlign: element.textAlign === 'left' || element.textAlign === 'right' ? element.textAlign : 'center',
    lineHeight: element.lineHeight || 1.4,
    zIndex: Number.isFinite(element.zIndex) ? Number(element.zIndex) : index + 1,
    visible: element.visible !== false,
  };
}
