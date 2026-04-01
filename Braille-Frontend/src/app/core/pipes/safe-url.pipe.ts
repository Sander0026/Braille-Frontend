import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Pipe({
  name: 'safeUrl',
  standalone: true,
  pure: true
})
export class SafeUrlPipe implements PipeTransform {
  constructor(private readonly sanitizer: DomSanitizer) {}

  transform(url: string | null | undefined): SafeResourceUrl {
    if (!url || typeof url !== 'string') return '';

    // OWASP A03:2021 Security Misconfiguration & XSS Mitigation
    // Validação restrita de Whitelisting. Só aceita Protocolos Identificados (Evita scripts injetados)
    const urlLimpa = url.trim();
    if (urlLimpa.startsWith('http://') || urlLimpa.startsWith('https://') || urlLimpa.startsWith('assets/')) {
        return this.sanitizer.bypassSecurityTrustResourceUrl(urlLimpa);
    }
    
    console.warn(`[SafeUrlPipe] Uma URL possivelmente maliciosa ou não tratada foi bloqueada: ${url}`);
    return '';
  }
}