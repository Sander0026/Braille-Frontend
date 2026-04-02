import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'categoryLabel',
  standalone: true
})
export class CategoryLabelPipe implements PipeTransform {
  private readonly map: Record<string, string> = {
    'NOTICIA': 'Notícia',
    'VAGA_EMPREGO': 'Vaga PCD',
    'SERVICO': 'Serviço',
    'EVENTO_CULTURAL': 'Evento',
    'LEGISLACAO': 'Legislação',
    'TRABALHO_PCD': 'Trabalho PCD',
    'GERAL': 'Aviso'
  };

  transform(value: string | undefined | null): string {
    if (!value) return 'Geral';
    return this.map[value.toUpperCase().trim()] || 'Geral';
  }
}
