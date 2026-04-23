import { Component, signal, inject, afterNextRender, Injector } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

import { SiteConfigService } from './core/services/site-config';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('Instituto Luiz Braille');

  private readonly siteConfig = inject(SiteConfigService);
  private readonly router     = inject(Router);
  private readonly injector   = inject(Injector);

  constructor() {
    // Carrega configurações globais do site na inicialização
    this.siteConfig.carregarConfigs().subscribe();
    this.siteConfig.carregarSecoes().subscribe();

    // WCAG 2.1 SC 2.4.3 — Anúncio de Mudança de Rota para Leitores de Tela.
    // takeUntilDestroyed() garante cancelamento automático — Zero Memory Leak.
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      takeUntilDestroyed()
    ).subscribe(() => {
      // afterNextRender aguarda o ciclo de renderização antes de mover o foco.
      // Substitui setTimeout(fn, 100) frágil — padrão Angular 17+ oficial.
      afterNextRender(() => {
        const h1 = document.querySelector<HTMLHeadingElement>('h1');
        if (h1) {
          h1.setAttribute('tabindex', '-1');
          h1.style.outline = 'none'; // Previne contorno visual indesejado ao receber foco via JS
          h1.focus();
        }
      }, { injector: this.injector });
    });
  }
}

