import { Component, Input, inject, OnInit } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ContatoGlobalConfig, SecoesMap, SiteConfigService } from '../../services/site-config';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, AsyncPipe],
  templateUrl: './footer.html',
  styleUrl: './footer.scss'
})
export class FooterComponent implements OnInit {
  // Recebe 'public' ou 'admin' dependendo do Layout pai em que for invocado
  @Input() theme: 'public' | 'admin' = 'public';

  currentYear = new Date().getFullYear();

  private readonly siteConfig = inject(SiteConfigService);
  contatoConfig$!: Observable<ContatoGlobalConfig>;

  ngOnInit() {
    this.contatoConfig$ = this.siteConfig.secoes$.pipe(
      map((secoes: SecoesMap) => secoes['contato_global'] as ContatoGlobalConfig || {})
    );
  }
}
