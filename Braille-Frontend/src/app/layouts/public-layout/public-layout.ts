import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FooterComponent } from '../../core/components/footer/footer';
import { HeaderComponent } from '../../core/components/header/header';
import { AccessibilityService } from '../../core/services/accessibility.service';

@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet, CommonModule, FooterComponent, HeaderComponent],
  templateUrl: './public-layout.html',
  styleUrl: './public-layout.scss',
})
export class PublicLayout {
  isMobileMenuOpen = false;

  public a11y = inject(AccessibilityService);

  get altoContrasteAtivo(): boolean {
    return this.a11y.isAltoContraste;
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
  }
}


