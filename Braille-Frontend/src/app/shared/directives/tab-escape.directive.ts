import { Directive, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * TabEscapeDirective — Acessibilidade (WCAG 2.1 SC 2.1.1 e 2.1.2)
 *
 * Garante que Tab e Shift+Tab movem o foco para FORA de <textarea>
 * em vez de inserir um caractere \t — eliminando a "armadilha de teclado".
 *
 * @example
 *   <textarea tabEscape ...></textarea>
 */
@Directive({
  selector: 'textarea[tabEscape]',
  standalone: true,
  // host:{} nativo é mais eficiente que @HostListener em runtime
  host: { '(keydown)': 'onKeydown($event)' }
})
export class TabEscapeDirective {
  private readonly platformId = inject(PLATFORM_ID);

  onKeydown(event: KeyboardEvent): void {
    // 🔴 CORREÇÃO CRÍTICA: document não existe em SSR (Node.js). 
    // Sem esta guarda, ativar SSR derrubaria o servidor imediatamente.
    if (!isPlatformBrowser(this.platformId)) return;
    if (event.key !== 'Tab') return;

    event.preventDefault();

    // Query otimizada: usa seletor estrito e filtra elementos invisíveis
    const focusableSelector =
      'a[href], button:not([disabled]), input:not([disabled]), ' +
      'select:not([disabled]), textarea:not([disabled]), ' +
      '[tabindex]:not([tabindex="-1"])';

    const focusable = Array.from(
      document.querySelectorAll<HTMLElement>(focusableSelector)
    ).filter(el => !el.closest('[aria-hidden="true"]') && el.offsetParent !== null);

    const current      = event.target as HTMLElement;
    const currentIndex = focusable.indexOf(current);
    if (currentIndex === -1) return;

    // Navegação circular: Shift+Tab vai para anterior, Tab vai para próximo
    const nextIndex = event.shiftKey
      ? (currentIndex - 1 + focusable.length) % focusable.length
      : (currentIndex + 1) % focusable.length;

    focusable[nextIndex]?.focus();
  }
}
