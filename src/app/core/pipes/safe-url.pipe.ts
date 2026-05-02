import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { normalizarUrlRecursoConfiavel } from '../../shared/utils/safe-resource-url.util';

@Pipe({
  name: 'safeUrl',
  standalone: true,
  pure: true
})
export class SafeUrlPipe implements PipeTransform {
  constructor(private readonly sanitizer: DomSanitizer) {}

  transform(url: string | null | undefined): SafeResourceUrl | string {
    const urlLimpa = normalizarUrlRecursoConfiavel(url);
    if (urlLimpa) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(urlLimpa);
    }

    console.warn('[SafeUrlPipe] URL de recurso nao permitida bloqueada. Verifique o valor passado ao pipe safeUrl.');
    return this.sanitizer.bypassSecurityTrustResourceUrl('');
  }
}
