import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import DOMPurify from 'dompurify';

@Pipe({
    name: 'safeHtml',
    standalone: true,
    pure: true
})
export class SafeHtmlPipe implements PipeTransform {
    // RAM Cache local. Memory Leak Control: O uso de um LRU ou mapa pequeno mantém alta velocidade de UI
    private readonly cache = new Map<string, SafeHtml>();

    constructor(private readonly sanitizer: DomSanitizer) { }

    transform(html: string | undefined | null): SafeHtml {
        if (!html) return '';

        // Optimization: Se já calculamos o AST desse HTML recentemente, evite travar a View
        if (this.cache.has(html)) {
            return this.cache.get(html)!;
        }

        // OWASP DOMPurify: Limpa handlers injetados (Script injection/Prototype pollution prevention)
        const cleanHtml = DOMPurify.sanitize(html, {
            ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'br', 'span', 'div', 'img', 's', 'u', 'blockquote', 'pre'],
            ALLOWED_ATTR: ['href', 'title', 'target', 'src', 'alt', 'width', 'height', 'style', 'class']
        });

        // WCAG 2.1 AA: Injection Forçado de Atributos Decorativos e Descritivos de Imagem
        // Manipulação síncrona evitada para renderizações que já visitaram o cache (A11y Preservada e Rápida)
        const doc = new DOMParser().parseFromString(cleanHtml, 'text/html');
        doc.querySelectorAll('img').forEach(img => {
            if (!img.hasAttribute('alt')) {
                img.setAttribute('alt', ''); // Esconde nativamente do Screen Reader
            }
        });

        const safeHtml = this.sanitizer.bypassSecurityTrustHtml(doc.body.innerHTML);
        
        // Caching
        this.cache.set(html, safeHtml);
        
        // Memory Leak Prevention: Limita o cache a 50 blocos de HTML únicos para não estrangular RAM Single-Page
        if (this.cache.size > 50) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey) this.cache.delete(firstKey);
        }

        return safeHtml;
    }
}
