import { Directive, HostListener } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appPhoneMask]',
  standalone: true
})
export class PhoneMaskDirective {

  constructor(private ngControl: NgControl) {}

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target != null) {
      this.applyMask(target.value);
    }
  }

  private applyMask(value: string): void {
    if (!value) return;
    
    // Remove tudo que não for dígito e limita o tamanho base
    let digits = value.replace(/\D/g, '').slice(0, 11);

    // Formatações customizadas baseadas na quantidade de dígitos (Brasil)
    if (digits.length > 10) {
      digits = digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (digits.length > 6) {
      digits = digits.replace(/(\d{2})(\d{4})(\d+)/, '($1) $2-$3');
    } else if (digits.length > 2) {
      digits = digits.replace(/(\d{2})(\d+)/, '($1) $2');
    }

    // Prevê loops infinitos emitindo o change sem triggerEvents duplicados
    if (this.ngControl.control && this.ngControl.control.value !== digits) {
      this.ngControl.control.setValue(digits, { emitEvent: false, emitModelToViewChange: true });
    }
  }
}
