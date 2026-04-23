import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'stripHtml',
  standalone: true,
  pure: true
})
/**
 * StripHtmlPipe — Remove todas as tags HTML e normaliza entidades comuns.
 * 
 * Proteção OWASP: não usa innerHTML nem DOMParser — evita execução de scripts
 * ao tratar o conteúdo puramente como string via regex segura.
 */
export class StripHtmlPipe implements PipeTransform {
  transform(value: string | undefined | null): string {
    if (!value) return '';

    return value
      // 1. Remove todas as tags HTML (incluindo self-closing e mal-formadas)
      .replace(/<\/?[^>]+(>|$)/g, '')
      // 2. Normaliza entidades HTML comuns vindas de editores WYSIWYG
      .replaceAll('&nbsp;',  ' ')
      .replaceAll('&amp;',   '&')
      .replaceAll('&lt;',    '<')
      .replaceAll('&gt;',    '>')
      .replaceAll('&quot;',  '"')
      .replaceAll('&#39;',   "'")
      // 3. Colapsa múltiplos espaços em branco em um único
      .replace(/\s{2,}/g,  ' ')
      .trim();
  }
}
