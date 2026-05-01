import { Pipe, PipeTransform } from '@angular/core';
import { formatarCep } from '../utils/masks.util';

@Pipe({
  name: 'cep',
  standalone: true,
  pure: true
})
export class CepPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '—';
    const formatted = formatarCep(value);
    return formatted || '—';
  }
}
