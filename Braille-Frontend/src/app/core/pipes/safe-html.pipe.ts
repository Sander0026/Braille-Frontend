import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import DOMPurify from 'dompurify';

@Pipe({
    name: 'safeHtml',
    standalone: true
})
export class SafeHtmlPipe implements PipeTransform {
    constructor(private sanitizer: DomSanitizer) { }

    transform(html: string | undefined | null): SafeHtml {
        if (!html) return '';
        // Owasp DOMPurify: Purifica os Nodes matando <script>, onClick/onError/onMouseOver
        const cleanHtml = DOMPurify.sanitize(html, {
            ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'br', 'span', 'div', 'img', 's', 'u', 'blockquote', 'pre'],
            ALLOWED_ATTR: ['href', 'title', 'target', 'src', 'alt', 'width', 'height', 'style', 'class'] // Mantém apenas atributos seguros
        });
        // Pede ao Angular confiar na string POIS NÓS MESMOS JÁ MATAMOS TUDO
        return this.sanitizer.bypassSecurityTrustHtml(cleanHtml);
    }
}
