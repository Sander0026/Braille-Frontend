import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FooterComponent } from '../../core/components/footer/footer';
import { HeaderComponent } from '../../core/components/header/header';
import { AccessibilityService } from '../../core/services/accessibility.service';
import { FloatingCtaComponent } from './components/floating-cta/floating-cta.component';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, CommonModule, FooterComponent, HeaderComponent, FloatingCtaComponent],
  templateUrl: './public-layout.html',
  styleUrl: './public-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PublicLayout {
  /**
   * Performance: Utilizando Angular Signals para o estado UI local,
   * removendo a necessidade estrita de markForCheck no OnPush para variaveis primitivas triviais.
   */
  public isMobileMenuOpen = signal(false);

  // Injeção moderna e limpa de dependências
  public readonly a11y = inject(AccessibilityService);

  get altoContrasteAtivo(): boolean {
    return this.a11y.isAltoContraste;
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(v => !v);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }
}
