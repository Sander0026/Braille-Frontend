import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dataBraille',
  standalone: true,
  pure: true
})
/**
 * DataBraillePipe — Formatação de datas ISO para DD/MM/AAAA.
 * 
 * Aceita strings ISO (ex: "2024-03-15" ou "2024-03-15T10:00:00.000Z").
 * Retorna '—' em caso de input inválido ou nulo.
 */
export class DataBraillePipe implements PipeTransform {
  transform(data: string | null | undefined): string {
    if (!data) return '—';

    // Extrai apenas os primeiros 10 caracteres (YYYY-MM-DD) — seguro contra timezones e microsegundos
    const partes = data.substring(0, 10).split('-');
    if (partes.length !== 3 || partes.some(p => p === '')) return '—';

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
}
