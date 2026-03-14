import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'cpfRg',
  standalone: true
})
export class CpfRgPipe implements PipeTransform {
  transform(value: string | number | null | undefined): string {
    if (!value) return '—';
    let doc = String(value).replace(/\D/g, '');
    if (!doc) return '—';

    if (doc.length === 11) {
      // CPF: 000.000.000-00
      return doc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else {
      // RG: 1.111.111 ou 11.111.111 (apenas pontuação de milhares, sem traço)
      return doc.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
  }
}
