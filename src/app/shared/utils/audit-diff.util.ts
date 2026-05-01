export interface AuditDiff {
  campo: string;
  de: string;
  para: string;
  alterado: boolean;
  sensivel: boolean;
}

export const AUDIT_FIELD_LABELS: Record<string, string> = {
  presente: 'Presenca',
  dataAula: 'Data da Aula',
  fechado: 'Diario Fechado',
  fechadoEm: 'Data de Fechamento',
  fechadoPor: 'Fechado por',
  observacao: 'Observacao',
  nome: 'Nome',
  nomeCompleto: 'Nome Completo',
  dataNascimento: 'Data de Nascimento',
  email: 'E-mail',
  telefone: 'Telefone',
  status: 'Situacao',
  cpf: 'CPF',
  rg: 'RG',
  cpfCnpj: 'CPF/CNPJ',
  documento: 'Documento',
};

export const AUDIT_IGNORED_FIELDS: ReadonlySet<string> = new Set([
  'id',
  'alunoId',
  'turmaId',
  'criadoEm',
  'atualizadoEm',
  'senhaHash',
  'professorId',
]);

const SENSITIVE_FIELD_PATTERNS = [
  /cpf/i,
  /cnpj/i,
  /\brg\b/i,
  /documento/i,
  /telefone/i,
  /email/i,
  /senha/i,
  /token/i,
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isIsoDateString(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value);
}

function isCampoSensivel(chave: string): boolean {
  return SENSITIVE_FIELD_PATTERNS.some(pattern => pattern.test(chave));
}

function formatarValorAmigavel(chave: string, valor: unknown): string {
  if (valor === null || valor === undefined) return '-';
  if (typeof valor === 'boolean') return valor ? 'Sim' : 'Nao';

  if (isCampoSensivel(chave)) {
    return mascararValorSensivel(chave, valor);
  }

  if (isIsoDateString(valor)) {
    const data = new Date(valor);
    if (chave.toLowerCase().includes('data') && valor.includes('T00:00:00')) {
      return data.toLocaleDateString('pt-BR');
    }
    return data.toLocaleString('pt-BR');
  }

  if (valor === '') return 'Vazio';
  return String(valor);
}

function mascararValorSensivel(chave: string, valor: unknown): string {
  const texto = String(valor).trim();
  if (!texto) return 'Vazio';

  if (/email/i.test(chave)) {
    const [usuario, dominio] = texto.split('@');
    if (!usuario || !dominio) return 'Valor protegido';
    return `${usuario.slice(0, 1)}***@${dominio}`;
  }

  const digitos = texto.replace(/\D/g, '');
  if (digitos.length >= 4) {
    return `Final ${digitos.slice(-4)}`;
  }

  return 'Valor protegido';
}

export function gerarDiferencas(oldVal: unknown, newVal: unknown): AuditDiff[] {
  const oldObj = isRecord(oldVal) ? oldVal : {};
  const newObj = isRecord(newVal) ? newVal : {};
  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
  const diferencas: AuditDiff[] = [];

  for (const key of allKeys) {
    if (AUDIT_IGNORED_FIELDS.has(key)) continue;

    const valNovo = newObj[key];
    if (!isRecord(oldVal) && (valNovo === null || valNovo === undefined || valNovo === '')) continue;

    const sensivel = isCampoSensivel(key);
    const strAntigo = formatarValorAmigavel(key, oldObj[key]);
    const strNovo = formatarValorAmigavel(key, valNovo);

    diferencas.push({
      campo: AUDIT_FIELD_LABELS[key] ?? `${key.charAt(0).toUpperCase()}${key.slice(1)}`,
      de: strAntigo,
      para: strNovo,
      alterado: strAntigo !== strNovo,
      sensivel,
    });
  }

  return diferencas;
}

export const AuditDiffUtil = { gerarDiferencas };
