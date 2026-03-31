import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AccessibilityService, FonteSize } from '../../core/services/accessibility.service';
import { FooterComponent } from '../../core/components/footer/footer';

@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, FooterComponent],
  templateUrl: './public-layout.html',
  styleUrl: './public-layout.scss',
})
export class PublicLayout {
  isMobileMenuOpen = false;

  // Acessibilidade Global (Herdado do service)
  public a11y = inject(AccessibilityService);

  get fonteAtual(): FonteSize {
    return this.a11y.fonteAtual;
  }

  get altoContrasteAtivo(): boolean {
    return this.a11y.isAltoContraste;
  }

  setFonte(tamanho: FonteSize) {
    this.a11y.setFonte(tamanho);
  }

  toggleAltoContraste() {
    this.a11y.toggleAltoContraste();
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
  }
}

