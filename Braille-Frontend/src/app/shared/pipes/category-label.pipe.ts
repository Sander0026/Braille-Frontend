import { Pipe, PipeTransform } from '@angular/core';

/**
 * Mapa de categorias extraído como const exportada (SRP).
 * Reutilizável em testes unitários e outros contextos sem importar o Pipe inteiro.
 */
export const CATEGORY_LABELS: Record<string, string> = {
  NOTICIA:        'Notícia',
  VAGA_EMPREGO:   'Vaga PCD',
  SERVICO:        'Serviço',
  EVENTO_CULTURAL: 'Evento',
  LEGISLACAO:     'Legislação',
  TRABALHO_PCD:   'Trabalho PCD',
  GERAL:          'Aviso',
};

@Pipe({
  name: 'categoryLabel',
  standalone: true,
  pure: true
})
export class CategoryLabelPipe implements PipeTransform {
  transform(value: string | undefined | null): string {
    if (!value) return 'Geral';
    return CATEGORY_LABELS[value.toUpperCase().trim()] ?? 'Geral';
  }
}
