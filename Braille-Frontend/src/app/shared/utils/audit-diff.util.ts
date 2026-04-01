export interface AuditDiff {
  campo: string;
  de: string;
  para: string;
  alterado: boolean;
}

export class AuditDiffUtil {
  private static readonly dicionarioCampos: Record<string, string> = {
    'presente': 'Presença',
    'dataAula': 'Data da Aula',
    'fechado': 'Diário Fechado',
    'fechadoEm': 'Data de Fechamento',
    'fechadoPor': 'Fechado por',
    'observacao': 'Observação',
    'nome': 'Nome',
    'nomeCompleto': 'Nome Completo',
    'dataNascimento': 'Data de Nascimento',
    'email': 'E-mail',
    'telefone': 'Telefone',
    'status': 'Situação',
    'cpf': 'CPF',
    'rg': 'RG',
  };

  private static readonly camposIgnorados = ['id', 'alunoId', 'turmaId', 'criadoEm', 'atualizadoEm', 'senhaHash', 'professorId'];

  private static formatarValorAmigavel(chave: string, valor: any): string {
    if (valor === null || valor === undefined) return '—';
    if (typeof valor === 'boolean') return valor ? 'Sim' : 'Não';
    
    // Tratativa de Data ISO 8601
    if (typeof valor === 'string' && valor.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
      const d = new Date(valor);
      
      // Se for data pura ex '2024-12-31T00:00:00' sem tempo útil
      if (chave.toLowerCase().includes('data')) {
        if (valor.includes('T00:00:00')) return d.toLocaleDateString('pt-BR');
      }
      return d.toLocaleString('pt-BR');
    }
    
    if (valor === '') return 'Vazio';
    return String(valor);
  }

  /**
   * Identifica e normaliza graficamente os deltas JSON de payload dos Logs.
   */
  public static gerarDiferencas(oldVal: any, newVal: any): AuditDiff[] {
    const diferencas: AuditDiff[] = [];
    const oldObj = oldVal || {};
    const newObj = newVal || {};

    const allKeys = Array.from(new Set([...Object.keys(oldObj), ...Object.keys(newObj)]));

    for (const key of allKeys) {
      if (this.camposIgnorados.includes(key)) continue;

      const valAntigo = oldObj[key];
      const valNovo = newObj[key];

      // Se for acao CRIAR e o valor for null/vazio, pula para nao poluir o Diff.
      if (!oldVal && (valNovo === null || valNovo === undefined || valNovo === '')) continue;

      const labelAmigavel = this.dicionarioCampos[key] || (key.charAt(0).toUpperCase() + key.slice(1));
      const strAntigo = this.formatarValorAmigavel(key, valAntigo);
      const strNovo = this.formatarValorAmigavel(key, valNovo);

      diferencas.push({
        campo: labelAmigavel,
        de: strAntigo,
        para: strNovo,
        alterado: (strAntigo !== strNovo)
      });
    }

    return diferencas;
  }
}
