import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AsyncPipe, CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SiteConfigService } from '../../core/services/site-config';
import { AccessibilityService, FonteSize } from '../../core/services/accessibility.service';

@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AsyncPipe, CommonModule],
  templateUrl: './public-layout.html',
  styleUrl: './public-layout.scss',
})
export class PublicLayout implements OnInit {
  readonly currentYear = new Date().getFullYear();

  isMobileMenuOpen = false;

  // Serviço de Configuração da API
  private siteConfig = inject(SiteConfigService);
  contatoConfig$!: Observable<any>;

  ngOnInit() {
    this.contatoConfig$ = this.siteConfig.secoes$.pipe(
      map(secoes => secoes['contato_global'] || {})
    );
  }

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

