import { Component, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
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

  constructor() {
    this.siteConfig.carregarConfigs().subscribe();
  }
}
