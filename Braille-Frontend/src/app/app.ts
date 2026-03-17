import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { UiButtonComponent } from './shared/components/ui-button/ui-button';

import { SiteConfigService } from './core/services/site-config';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('Braille-Frontend');
  private siteConfig = inject(SiteConfigService);
  private router = inject(Router);

  constructor() {
    this.siteConfig.carregarConfigs().subscribe();
    this.siteConfig.carregarSecoes().subscribe();
    
    // WCAG #J002 - Anúncio de Mudança de Rota p/ Leitores de Tela
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe(() => {
      // Mover foco para o <h1> da nova página para dar contexto ao leitor
      setTimeout(() => {
        const h1 = document.querySelector('h1');
        if (h1) {
          h1.setAttribute('tabindex', '-1');
          h1.style.outline = 'none'; // Prevenir contorno visual estranho ao receber foco do JS
          h1.focus();
        }
      }, 100);
    });
  }
}
