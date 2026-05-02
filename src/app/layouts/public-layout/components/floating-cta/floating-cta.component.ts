import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-floating-cta',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './floating-cta.component.html',
  styleUrl: './floating-cta.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FloatingCtaComponent {
  /**
   * Router paths devem ser validados via Guards ou Input sanitizado no destino.
   * O Component UI puro não acopla estado complexo (KISS/SRP).
   */
  @Input({ required: true }) path!: string;
  @Input({ required: true }) label!: string;
  @Input({ required: true }) icon!: string;
  @Input() ariaLabel?: string;

  get computedAriaLabel(): string {
    return this.ariaLabel || this.label;
  }
}
