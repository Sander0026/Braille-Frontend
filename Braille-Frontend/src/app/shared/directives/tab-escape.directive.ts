import { Directive, HostListener } from '@angular/core';

/**
 * TabEscapeDirective — Acessibilidade (Standalone)
 *
 * Garante que Tab e Shift+Tab movem o foco para fora de <textarea>
 * em vez de inserir um caractere \t.
 *
 * WCAG 2.1 SC 2.1.1 (Teclado) e SC 2.1.2 (Sem armadilha de teclado).
 *
 * Aplicar nos textareas:
 *   <textarea tabEscape ...></textarea>
 */
@Directive({
  selector: 'textarea[tabEscape]',
  standalone: true,
})
export class TabEscapeDirective {
  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    event.preventDefault();

    const focusable = Array.from(
      document.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), ' +
        'select:not([disabled]), textarea:not([disabled]), ' +
        '[tabindex]:not([tabindex="-1"])',
      ),
    ).filter(el => !el.closest('[aria-hidden="true"]') && el.offsetParent !== null);

    const current = event.target as HTMLElement;
    const currentIndex = focusable.indexOf(current);
    if (currentIndex === -1) return;

    const nextIndex = event.shiftKey
      ? (currentIndex - 1 + focusable.length) % focusable.length
      : (currentIndex + 1) % focusable.length;

    focusable[nextIndex]?.focus();
  }
}
