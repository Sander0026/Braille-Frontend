import { Directive, ElementRef, Input } from '@angular/core';
import { FocusableOption } from '@angular/cdk/a11y';

// Diretiva de acessibilidade isolada para evitar Dependência Circular
@Directive({
  selector: '[appTabelaTrFocavel]',
  standalone: true
})
export class TabelaTrFocavelDirective implements FocusableOption {
  @Input() disabled = false;

  constructor(public element: ElementRef<HTMLElement>) { }

  focus(): void {
    this.element.nativeElement.focus();
  }
}
