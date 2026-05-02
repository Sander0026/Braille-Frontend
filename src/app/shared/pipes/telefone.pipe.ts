import { Pipe, PipeTransform } from '@angular/core';
import { formatarTelefone } from '../utils/masks.util';

@Pipe({
  name: 'telefone',
  standalone: true,
  pure: true
})
export class TelefonePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '—';
    const formatted = formatarTelefone(value);
    return formatted || '—';
  }
}
