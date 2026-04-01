/**
 * Utilitários de Máscaras e Formatação Isolados (Padrão SRP e DRY)
 * Impede vazamento e repetição de lógica de regex em diversos Components TS de View.
 */

export class MasksUtil {

    /** 
     * Aceita string suja, returna CPF ou CNPJ limpo e devidamente mascarado 
     */
    static formatarCpfCnpj(valorCru: string): string {
      if (!valorCru) return '';
      let valor = valorCru.replace(/\D/g, '');
      
      if (valor.length <= 11) {
        // CPF: 000.000.000-00
        valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
        valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
        valor = valor.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      } else {
        // CNPJ: 00.000.000/0000-00 (max 14 digitos numéricos)
        valor = valor.substring(0, 14);
        valor = valor.replace(/^(\d{2})(\d)/, '$1.$2');
        valor = valor.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
        valor = valor.replace(/\.(\d{3})(\d)/, '.$1/$2');
        valor = valor.replace(/(\d{4})(\d)/, '$1-$2');
      }
      return valor;
    }
  
    /** 
     * Formata e limpa strings de email. 
     */
    static limparEmail(valorCru: string): string {
      if (!valorCru) return '';
      return valorCru.replace(/\s/g, '').toLowerCase();
    }
  
    /**
     * Formata o telefone brasileiro (8 e 9 digitos). O ddd é obrigatorio na entrada bruta ou adaptada.
     */
    static formatarTelefone(valorCru: string): string {
      if (!valorCru) return '';
      let valor = valorCru.replace(/\D/g, '');
      valor = valor.substring(0, 11);
      
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
}
