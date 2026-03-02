import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ui-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [type]="type"
      [disabled]="disabled"
      [attr.aria-label]="ariaLabel || label"
      class="
        px-6 py-3 rounded-lg font-bold transition-all
        focus:outline-none focus:ring-4 focus:ring-focus focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
      "
      [ngClass]="{
        'bg-primary text-white hover:bg-primary-dark': variant === 'primary',
        'bg-white text-primary border-2 border-primary hover:bg-primary-light': variant === 'outline',
        'bg-red-700 text-white hover:bg-red-800': variant === 'danger'
      }"
    >
      {{ label }}
    </button>
  `
})
export class UiButtonComponent {
  @Input() label: string = 'Botão';
  @Input() ariaLabel?: string; // Para leitores de tela (opcional)
  @Input() type: 'button' | 'submit' = 'button';
  @Input() variant: 'primary' | 'outline' | 'danger' = 'primary';
  @Input() disabled: boolean = false;
}