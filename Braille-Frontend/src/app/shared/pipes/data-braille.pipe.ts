import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'dataBraille',
    standalone: true
})
export class FormatDatePipe implements PipeTransform {
    transform(data: string | null | undefined): string {
        if (!data) return '—';
        const partes = data.substring(0, 10).split('-');
        if (partes.length !== 3) return '—';
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
}
