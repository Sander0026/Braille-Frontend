import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { normalizarUrlRecursoConfiavel } from '../utils/safe-resource-url.util';

@Pipe({
  name: 'safeUrl',
  standalone: true,
  pure: true
})
export class SafeUrlPipe implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer);

  transform(url: string | null | undefined): SafeResourceUrl | string {
    const urlLimpa = normalizarUrlRecursoConfiavel(url);
    if (urlLimpa) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(urlLimpa);
    }

    console.warn('[SafeUrlPipe] URL de recurso nao permitida bloqueada.');
    return this.sanitizer.bypassSecurityTrustResourceUrl('');
  }
}
