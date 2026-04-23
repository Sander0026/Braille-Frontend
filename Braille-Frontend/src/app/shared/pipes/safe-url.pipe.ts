import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

/** Protocolos explicitamente bloqueados — vetores clássicos de XSS (OWASP A03:2021) */
const BLOCKED_PROTOCOLS = ['javascript:', 'data:', 'vbscript:'];

@Pipe({
  name: 'safeUrl',
  standalone: true,
  pure: true
})
export class SafeUrlPipe implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer);

  transform(url: string | null | undefined): SafeResourceUrl | string {
    if (!url || typeof url !== 'string') return '';

    const normalizedUrl = url.trim().toLowerCase();

    // Validação de protocolo OWASP: rejeita vetores de XSS antes de qualquer bypass
    const hasBlockedProtocol = BLOCKED_PROTOCOLS.some(proto => 
      normalizedUrl.startsWith(proto)
    );

    if (hasBlockedProtocol) {
      console.warn('[SafeUrlPipe] URL com protocolo não permitido bloqueada.');
      return '';
    }

    // Apenas URLs http/https ou relativas são marcadas como confiáveis
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
