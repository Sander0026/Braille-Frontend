/**
 * Utilitários de Máscaras e Formatação — Funções Puras (SRP e DRY)
 *
 * Funções standalone exportadas diretamente (padrão TypeScript moderno).
 * Mais tree-shakeable e testáveis que classes com métodos estáticos.
 */

/**
 * Formata CPF (11 dígitos) ou CNPJ (14 dígitos) a partir de string crua.
 *
 * - CPF:  000.000.000-00
 * - CNPJ: 00.000.000/0000-00
 *
 * @param valorCru - String bruta podendo conter caracteres não numéricos
 * @returns String formatada ou vazia se input inválido
 */
export function formatarCpfCnpj(valorCru: string): string {
  if (!valorCru) return '';
  let valor = valorCru.replace(/\D/g, '');

  if (valor.length <= 11) {
    // CPF: 000.000.000-00
    valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
    valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
    valor = valor.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  } else {
    // CNPJ: 00.000.000/0000-00 (max 14 dígitos)
    valor = valor.substring(0, 14);
    valor = valor.replace(/^(\d{2})(\d)/, '$1.$2');
    valor = valor.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
    valor = valor.replace(/\.(\d{3})(\d)/, '.$1/$2');
    valor = valor.replace(/(\d{4})(\d)/, '$1-$2');
  }

  return valor;
}

/**
 * Normaliza um endereço de e-mail: remove espaços e converte para minúsculas.
 *
 * @param valorCru - E-mail bruto podendo conter espaços indevidos
 * @returns E-mail normalizado ou vazio se input inválido
 */
export function limparEmail(valorCru: string): string {
  if (!valorCru) return '';
  return valorCru.replace(/\s/g, '').toLowerCase();
}

/**
 * Formata telefone brasileiro com DDD obrigatório (8 ou 9 dígitos).
 *
 * - Celular (9 dígitos): (00) 00000-0000
 * - Fixo    (8 dígitos): (00) 0000-0000
 *
 * @param valorCru - String bruta podendo conter caracteres não numéricos
 * @returns Telefone formatado ou vazio se input inválido
 */
export function formatarTelefone(valorCru: string): string {
  if (!valorCru) return '';
  let valor = valorCru.replace(/\D/g, '').substring(0, 11);

  if (valor.length > 10) {
    valor = valor.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
  } else if (valor.length > 6) {
    valor = valor.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
  } else if (valor.length > 2) {
    valor = valor.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
  } else if (valor.length > 0) {
    valor = valor.replace(/^(\d{0,2})/, '($1');
  }

  return valor;
}

/**
 * Formata CEP brasileiro (8 dígitos).
 *
 * - CEP: 00000-000
 *
 * @param valorCru - String bruta podendo conter caracteres não numéricos
 * @returns CEP formatado ou vazio se input inválido
 */
export function formatarCep(valorCru: string): string {
  if (!valorCru) return '';
  let valor = valorCru.replace(/\D/g, '').substring(0, 8);
  if (valor.length > 5) {
    valor = valor.replace(/^(\d{5})(\d{1,3}).*/, '$1-$2');
  }
  return valor;
}

/**
 * @deprecated Use as funções diretamente (`formatarCpfCnpj`, `limparEmail`, `formatarTelefone`, `formatarCep`).
 * Mantido como alias de retrocompatibilidade para consumers existentes.
 */
export const MasksUtil = { formatarCpfCnpj, limparEmail, formatarTelefone, formatarCep };
