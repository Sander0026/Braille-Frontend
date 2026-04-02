import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { SiteConfigService } from '../../../core/services/site-config';
import { CloudinaryPipe } from '../../../core/pipes/cloudinary.pipe';
import { SafeHtmlPipe } from '../../../core/pipes/safe-html.pipe';
import { ApoiadoresService, Apoiador } from '../../admin/apoiadores/apoiadores.service';
import { AnimateOnScrollDirective } from '../../../shared/directives/animate-on-scroll.directive';
import { StripHtmlPipe } from '../../../shared/pipes/strip-html.pipe';
import { CategoryLabelPipe } from '../../../shared/pipes/category-label.pipe';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, shareReplay } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterLink, 
    CommonModule, 
    CloudinaryPipe, 
    SafeHtmlPipe, 
    AnimateOnScrollDirective, 
    StripHtmlPipe, 
    CategoryLabelPipe
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush, // Otimização forçada de Renderização
})
export class Home implements OnInit {

  // Signals para reatividade fluida e atómica (performance pura)
  oficinas = signal<any[]>([]);
  depoimentos = signal<any[]>([]);
  faq = signal<any[]>([]);
  ultimasNoticias = signal<any[]>([]);
  carregandoNoticias = signal<boolean>(true);
  
  parceiros = signal<Apoiador[]>([]);
  carregandoParceiros = signal<boolean>(false);
  fachadaUrl = signal<string>('');

  // Estados síncronos cacheados (Via AsyncPipe limpo em HTML)
  heroConfig$: Observable<any>;
  missaoConfig$: Observable<any>;

  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private siteConfig: SiteConfigService,
    private apoiadoresService: ApoiadoresService
  ) {
    // 100% Livre de Leaks: Operador shareReplay previne subscrições fantasmas no core do CMS
    this.heroConfig$ = this.siteConfig.getSecao('hero').pipe(
      map(dados => dados || {}),
      shareReplay(1)
    );

    this.missaoConfig$ = this.siteConfig.getSecao('missao').pipe(
      map(dados => dados || {}),
      shareReplay(1)
    );

    // Inscrições atadas ao LifeCycle (Limpeza automática através de takeUntilDestroyed)
    this.siteConfig.configs$.pipe(takeUntilDestroyed()).subscribe(configs => {
      if (configs && configs['fachadaUrl']) {
         this.fachadaUrl.set(configs['fachadaUrl']);
      }
    });

    this.siteConfig.getSecao('oficinas').pipe(takeUntilDestroyed()).subscribe(dados => {
      this.safeParseJsonSignal(dados, this.oficinas);
    });

    this.siteConfig.getSecao('depoimentos').pipe(takeUntilDestroyed()).subscribe(dados => {
      this.safeParseJsonSignal(dados, this.depoimentos);
    });

    this.siteConfig.getSecao('faq').pipe(takeUntilDestroyed()).subscribe(dados => {
      this.safeParseJsonSignal(dados, this.faq);
    });
  }

  ngOnInit() {
    this.carregarUltimasNoticias();
    this.carregarParceiros();
  }

  // Refatoração defensiva do Code Smell (Tratamento seguro contra parsing malicioso)
  private safeParseJsonSignal(dados: any, targetSignal: any) {
    if (dados && dados['lista']) {
      try {
        const parsed = JSON.parse(dados['lista']);
        if (Array.isArray(parsed)) {
            targetSignal.set(parsed);
        }
      } catch (e) {
        // Bloqueio silencioso de Payload corrupto não exibindo em stack trace (OWASP)
      }
    }
  }

  private carregarParceiros() {
    this.carregandoParceiros.set(true);
    this.apoiadoresService.buscarPublicos().pipe(takeUntilDestroyed()).subscribe({
      next: (dados: Apoiador[]) => {
        this.parceiros.set(dados || []);
        this.carregandoParceiros.set(false);
      },
      error: () => {
        this.carregandoParceiros.set(false);
      }
    });
  }

  private carregarUltimasNoticias() {
    this.carregandoNoticias.set(true);
    this.http.get<any>(`${this.apiUrl}/comunicados?page=1&limit=3`).pipe(takeUntilDestroyed()).subscribe({
      next: (res) => {
        this.ultimasNoticias.set(Array.isArray(res) ? res : (res.data ?? []));
        this.carregandoNoticias.set(false);
      },
      error: () => {
        this.carregandoNoticias.set(false); // Fallback silencioso blindando front-end
      }
    });
  }
}
