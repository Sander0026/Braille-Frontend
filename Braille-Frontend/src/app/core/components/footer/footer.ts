import { Component, Input, inject, OnInit } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SiteConfigService } from '../../services/site-config';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, AsyncPipe, RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.scss'
})
export class FooterComponent implements OnInit {
  // Recebe 'public' ou 'admin' dependendo do Layout pai em que for invocado
  @Input() theme: 'public' | 'admin' = 'public';

  currentYear = new Date().getFullYear();

  private readonly siteConfig = inject(SiteConfigService);
  contatoConfig$!: Observable<any>;

  ngOnInit() {
    this.contatoConfig$ = this.siteConfig.secoes$.pipe(
      map((secoes: Record<string, any>) => secoes['contato_global'] || {})
    );
  }
}
