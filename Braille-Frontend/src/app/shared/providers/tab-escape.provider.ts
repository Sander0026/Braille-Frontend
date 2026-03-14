import { provideAppInitializer } from '@angular/core';

/**
 * Acessibilidade de Teclado — Tab em Textareas e Editores Ricos
 *
 * Listener global (capture=true) que intercepta Tab/Shift+Tab dentro de:
 * - <textarea> nativo
 * - div[contenteditable="true"] — usado pelo Quill, TipTap, ProseMirror etc.
 *
 * Move o foco para o próximo/anterior elemento focável sem travar o usuário.
 * WCAG 2.1 SC 2.1.1 (Teclado) e SC 2.1.2 (Sem armadilha de teclado).
 */
function isEditableTarget(el: HTMLElement): boolean {
  if (el.tagName === 'TEXTAREA') return true;
  if (el.contentEditable === 'true') return true;
  return false;
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
    true, // capture=true: intercepta antes de qualquer stopPropagation do Quill
  );
}

/** Registra o listener global de Tab — inclua no app.config.ts */
export function provideTabEscapeForTextareas() {
  return [provideAppInitializer(registerTabEscape)];
}

