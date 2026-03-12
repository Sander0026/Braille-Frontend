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

    if (doc.length <= 9) {
      if (doc.length === 9) {
        return doc.replace(/(\d{2})(\d{3})(\d{3})(\d{1})/, '$1.$2.$3-$4');
      } else {
        return doc.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
      }
    } else {
      let val = doc;
      val = val.replace(/(\d{3})(\d)/, '$1.$2');
      val = val.replace(/(\d{3})(\d)/, '$1.$2');
      val = val.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      return val;
    }
  }
}
