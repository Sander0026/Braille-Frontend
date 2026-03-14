import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import DOMPurify from 'dompurify';

@Pipe({
    name: 'safeHtml',
    standalone: true
})
export class SafeHtmlPipe implements PipeTransform {
    constructor(private readonly sanitizer: DomSanitizer) { }

    transform(html: string | undefined | null): SafeHtml {
        if (!html) return '';

        // OWASP DOMPurify: sanitiza o HTML removendo scripts e handlers maliciosos
        const cleanHtml = DOMPurify.sanitize(html, {
            ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'br', 'span', 'div', 'img', 's', 'u', 'blockquote', 'pre'],
            ALLOWED_ATTR: ['href', 'title', 'target', 'src', 'alt', 'width', 'height', 'style', 'class']
        });

        // WCAG 1.1.1 – Proteção defensiva: garante que toda <img> tenha atributo alt.
        // Imagens inseridas via editor Quill podem não ter alt. Se o alt estiver ausente,
        // adicionamos alt="" para marcá-las como decorativas e evitar leitura do nome do arquivo.
        const doc = new DOMParser().parseFromString(cleanHtml, 'text/html');
        doc.querySelectorAll('img').forEach(img => {
            if (!img.hasAttribute('alt')) {
                img.setAttribute('alt', '');
            }
        });
        const safeHtml = doc.body.innerHTML;

        // Pede ao Angular para confiar na string (DOMPurify + nossa patching já limpou tudo)
        return this.sanitizer.bypassSecurityTrustHtml(safeHtml);
    }
}
