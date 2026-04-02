export interface AuditDiff {
  campo: string;
  de: string;
  para: string;
  alterado: boolean;
}

/**
 * Mapa de labels amigáveis para campos de auditoria.
 * Exportado como const para reutilização em testes e outros contextos sem importar funções.
 */
export const AUDIT_FIELD_LABELS: Record<string, string> = {
  presente:        'Presença',
  dataAula:        'Data da Aula',
  fechado:         'Diário Fechado',
  fechadoEm:       'Data de Fechamento',
  fechadoPor:      'Fechado por',
  observacao:      'Observação',
  nome:            'Nome',
  nomeCompleto:    'Nome Completo',
  dataNascimento:  'Data de Nascimento',
  email:           'E-mail',
  telefone:        'Telefone',
  status:          'Situação',
  cpf:             'CPF',
  rg:              'RG',
};

/**
 * Campos técnicos que não devem aparecer no diff de auditoria.
 * Exportado para uso em filtros externos e testes.
 */
export const AUDIT_IGNORED_FIELDS: ReadonlySet<string> = new Set([
  'id', 'alunoId', 'turmaId', 'criadoEm', 'atualizadoEm', 'senhaHash', 'professorId',
]);

/** Type guard: verifica se um valor é uma string ISO 8601 com parte de data e hora */
function isIsoDateString(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value);
}

/**
 * Formata um valor bruto em string amigável para exibição em diffs de auditoria.
 * Usa `unknown` no lugar de `any` — obriga type guards explícitos (SonarQube).
 */
function formatarValorAmigavel(chave: string, valor: unknown): string {
  if (valor === null || valor === undefined) return '—';
  if (typeof valor === 'boolean') return valor ? 'Sim' : 'Não';

  if (isIsoDateString(valor)) {
    const d = new Date(valor);
    if (chave.toLowerCase().includes('data') && valor.includes('T00:00:00')) {
      return d.toLocaleDateString('pt-BR');
    }
    return d.toLocaleString('pt-BR');
  }

  if (valor === '') return 'Vazio';
  return String(valor);
}

/**
 * Identifica e normaliza graficamente os deltas JSON de payload dos Logs de Auditoria.
 *
 * @param oldVal - Estado anterior do objeto (pode ser null em ações de CRIAR)
 * @param newVal - Estado novo do objeto
 * @returns Lista de diferenças com labels amigáveis e flag de alteração
 */
export function gerarDiferencas(oldVal: Record<string, unknown> | null, newVal: Record<string, unknown> | null): AuditDiff[] {
  const oldObj: Record<string, unknown> = oldVal ?? {};
  const newObj: Record<string, unknown> = newVal ?? {};

  // Proteção anti-Prototype Pollution: Object.keys() é seguro (não percorre protótipo)
  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
  const diferencas: AuditDiff[] = [];

  for (const key of allKeys) {
    if (AUDIT_IGNORED_FIELDS.has(key)) continue;

    const valNovo = newObj[key];

    // Em ações de CRIAR, ignora campos sem valor para não poluir o diff
    if (!oldVal && (valNovo === null || valNovo === undefined || valNovo === '')) continue;

    const labelAmigavel = AUDIT_FIELD_LABELS[key] ?? `${key.charAt(0).toUpperCase()}${key.slice(1)}`;
    const strAntigo = formatarValorAmigavel(key, oldObj[key]);
    const strNovo   = formatarValorAmigavel(key, valNovo);

    diferencas.push({
      campo:    labelAmigavel,
      de:       strAntigo,
      para:     strNovo,
      alterado: strAntigo !== strNovo,
    });
  }

  return diferencas;
}

/**
 * @deprecated Use a função `gerarDiferencas` diretamente.
 * Mantido como alias de retrocompatibilidade para consumers existentes.
 */
export const AuditDiffUtil = { gerarDiferencas };
