import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

export type ButtonVariant = 'primary' | 'outline' | 'danger';
export type ButtonType = 'button' | 'submit';

@Component({
  selector: 'app-ui-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush, // Performance Extrema UI
  template: `
    <button
      [type]="type()"
      [disabled]="disabled()"
      [attr.aria-label]="ariaLabel() || label()"
      [class]="botaoClasses()"
    >
      <!-- Transclusão SRP -->
      <ng-content></ng-content>
      
      <!-- Renderização text-node nativa reativa caso label seja passada diretamente -->
      @if (label()) {
        <span>{{ label() }}</span>
      }
    </button>
  `
})
export class UiButtonComponent {
  
  /** Matriz Type-Safe Funcional. Evita quebra de tipagem do `@Input` no runtime */
  label = input<string>('');
  ariaLabel = input<string | undefined>(); // Fallback seguro para Leitores de Tela WAI-ARIA
  type = input<ButtonType>('button');
  variant = input<ButtonVariant>('primary');
  disabled = input<boolean>(false);

  /**
   * Computed puro do Tailwindcss.
   * Elimina completamente a diretiva pesada NgClass, resolvendo todas as condições num Signal só no OnPush.
   */
  botaoClasses = computed(() => {
    const defaultClasses = 'inline-flex justify-center items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all focus:outline-none focus:ring-4 focus:ring-focus focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    switch (this.variant()) {
      case 'outline':
        return `${defaultClasses} bg-white text-primary border-2 border-primary hover:bg-primary-light`;
      case 'danger':
        return `${defaultClasses} bg-red-700 text-white hover:bg-red-800`;
      case 'primary':
      default:
        return `${defaultClasses} bg-primary text-white hover:bg-primary-dark`;
    }
  });

}