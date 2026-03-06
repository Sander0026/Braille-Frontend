import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AccessibilityService, FonteSize } from '../../core/services/accessibility.service';

@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './public-layout.html',
  styleUrl: './public-layout.scss',
})
export class PublicLayout {
  readonly currentYear = new Date().getFullYear();

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
}

