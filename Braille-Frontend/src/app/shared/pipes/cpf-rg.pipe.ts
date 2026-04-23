import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'cpfRg',
  standalone: true,
  pure: true // Declaração explícita: pipes fiscais NUNCA devem ser impure
})
/**
 * CpfRgPipe — Formata documentos fiscais brasileiros.
 *
 * - CPF (11 dígitos): 000.000.000-00
 * - RG  (< 11 dígitos): pontua por milhares (ex: 1.234.567)
 *
 * Retorna '—' para inputs nulos ou vazios.
 */
export class CpfRgPipe implements PipeTransform {
  transform(value: string | number | null | undefined): string {
    if (!value) return '—';

    const doc = String(value).replace(/\D/g, '');
    if (!doc) return '—';

    if (doc.length === 11) {
      // CPF: 000.000.000-00
      return doc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }

    // RG: pontua por milhares sem traço final
    return doc.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
}
