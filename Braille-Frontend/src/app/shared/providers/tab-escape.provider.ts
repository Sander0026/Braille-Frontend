import { inject, PLATFORM_ID, provideAppInitializer } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Provider de Acessibilidade de Teclado — Tab em Textareas e Editores Ricos
 *
 * Registra um listener global (capture=true) que intercepta Tab/Shift+Tab dentro de:
 *  - <textarea> nativo
 *  - div[contenteditable="true"] — Quill, TipTap, ProseMirror, etc.
 *
 * Move o foco para o próximo/anterior elemento focável sem prender o usuário.
 * WCAG 2.1 SC 2.1.1 (Teclado) e SC 2.1.2 (Sem armadilha de teclado).
 *
 * SINGLETON: Inclua apenas UMA vez no `app.config.ts`.
 *    O provider contém proteção interna contra registros duplicados.
 *
 * SSR-SAFE: O listener é registrado apenas em ambientes browser.
 */

/** Flag singleton: garante que o listener seja registrado apenas uma vez */
let tabEscapeRegistered = false;

/** KISS: verifica em linha única se o elemento deve capturar o TAB */
function isEditableTarget(el: HTMLElement): boolean {
  return el.tagName === 'TEXTAREA' || el.contentEditable === 'true';
}

function getFocusableElements(): HTMLElement[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), ' +
      'select:not([disabled]), textarea:not([disabled]), ' +
      '[contenteditable="true"], [tabindex]:not([tabindex="-1"])',
    ),
  ).filter(
    (el) =>
      !el.closest('[aria-hidden="true"]') &&
      el.offsetParent !== null &&
      !el.hasAttribute('disabled'),
  );
}

function registerTabEscape(): void {
  // CORREÇÃO CRÍTICA: document não existe em SSR (Node.js).
  // Verificado via flag singleton para evitar registros duplicados acidentais.
  if (tabEscapeRegistered) return;
  tabEscapeRegistered = true;

  document.addEventListener(
    'keydown',
    (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const target = event.target as HTMLElement;
      if (!isEditableTarget(target)) return;

      event.preventDefault();

      const focusable = getFocusableElements();
      const currentIndex = focusable.indexOf(target);
      if (currentIndex === -1) return;

      const nextIndex = event.shiftKey
        ? (currentIndex - 1 + focusable.length) % focusable.length
        : (currentIndex + 1) % focusable.length;

      focusable[nextIndex]?.focus();
    },
    true, // capture=true: intercepta antes de qualquer stopPropagation do Quill/TipTap
  );
}

/**
 * Registra o listener global de Tab em modo browser-only.
 * Inclua no providers do `app.config.ts`:
 * @example
 *   providers: [...provideTabEscapeForTextareas()]
 */
export function provideTabEscapeForTextareas() {
  return [
    provideAppInitializer(() => {
      // Injeção de PLATFORM_ID dentro do initializer — contexto de injeção válido
      const platformId = inject(PLATFORM_ID);

      if (isPlatformBrowser(platformId)) {
        registerTabEscape();
      }
    }),
  ];
}
