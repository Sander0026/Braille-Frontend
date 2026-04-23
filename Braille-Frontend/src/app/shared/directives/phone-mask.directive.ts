import { Directive, inject, PLATFORM_ID } from '@angular/core';
import { NgControl } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[appPhoneMask]',
  standalone: true,
  // Padrão moderno: host:{} no decorator é mais performático que @HostListener
  // Evita metadados extras carregados em runtime para cada instância da diretiva
  host: { '(input)': 'onInput($event)' }
})
export class PhoneMaskDirective {
  private readonly ngControl  = inject(NgControl);
  private readonly platformId = inject(PLATFORM_ID);

  onInput(event: Event): void {
    // Guarda SSR: event listeners DOM não existem em Node.js
    if (!isPlatformBrowser(this.platformId)) return;

    const target = event.target as HTMLInputElement;
    if (target) {
      this.applyMask(target.value);
    }
  }

  private applyMask(value: string): void {
    if (!value) return;

    // Remove tudo que não é dígito e limita ao máximo de 11 dígitos (celular BR)
    let digits = value.replace(/\D/g, '').slice(0, 11);

    // Aplica formatação progressiva conforme a quantidade de dígitos
    if (digits.length > 10) {
      digits = digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (digits.length > 6) {
      digits = digits.replace(/(\d{2})(\d{4})(\d+)/, '($1) $2-$3');
    } else if (digits.length > 2) {
      digits = digits.replace(/(\d{2})(\d+)/, '($1) $2');
    }

    // Atualiza o controle apenas se o valor sofreu transformação — previne loops infinitos
    if (this.ngControl.control && this.ngControl.control.value !== digits) {
      this.ngControl.control.setValue(digits, { emitEvent: false, emitModelToViewChange: true });
    }
  }
}
