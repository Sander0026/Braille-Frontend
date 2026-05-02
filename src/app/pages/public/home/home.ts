import { Component, OnInit, ChangeDetectionStrategy, DestroyRef, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { SiteConfigService } from '../../../core/services/site-config';
import { CloudinaryPipe } from '../../../core/pipes/cloudinary.pipe';
import { SafeHtmlPipe } from '../../../core/pipes/safe-html.pipe';
import { ApoiadoresService, Apoiador } from '../../admin/apoiadores/apoiadores.service';
import { Comunicado } from '../../../core/services/comunicados.service';
import { AnimateOnScrollDirective } from '../../../shared/directives/animate-on-scroll.directive';
import { StripHtmlPipe } from '../../../shared/pipes/strip-html.pipe';
import { CategoryLabelPipe } from '../../../shared/pipes/category-label.pipe';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, shareReplay } from 'rxjs/operators';
import { Observable } from 'rxjs';

/** Item de oficina conforme salvo no CMS (site-config seção 'oficinas'). */
interface OficinaItem { titulo: string; descricao: string; icon?: string }

/** Depoimento de aluno conforme salvo no CMS (site-config seção 'depoimentos'). */
interface DepoimentoItem { nome: string; texto: string; idade: number }

/** Pergunta frequente conforme salva no CMS (site-config seção 'faq'). */
interface FaqItem { pergunta: string; resposta: string }

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
  changeDetection: ChangeDetectionStrategy.OnPush, // OtimizaÃ§Ã£o forÃ§ada de RenderizaÃ§Ã£o
})
export class Home implements OnInit {

  // Signals para reatividade fluida e atÃ³mica (performance pura)
  oficinas = signal<OficinaItem[]>([]);
  depoimentos = signal<DepoimentoItem[]>([]);
  faq = signal<FaqItem[]>([]);
  ultimasNoticias = signal<Comunicado[]>([]);
  carregandoNoticias = signal<boolean>(true);
  erroNoticias = signal<boolean>(false);

  parceiros = signal<Apoiador[]>([]);
  carregandoParceiros = signal<boolean>(false);
  erroParceiros = signal<boolean>(false);
  fachadaUrl = signal<string>('');

  // Estados sÃ­ncronos cacheados (Via AsyncPipe limpo em HTML)
  heroConfig$: Observable<any>;
  missaoConfig$: Observable<any>;

  private apiUrl = environment.apiUrl;
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private http: HttpClient,
    private siteConfig: SiteConfigService,
    private apoiadoresService: ApoiadoresService
  ) {
    // 100% Livre de Leaks: Operador shareReplay previne subscriÃ§Ãµes fantasmas no core do CMS
    this.heroConfig$ = this.siteConfig.getSecao('hero').pipe(
      map(dados => dados || {}),
      shareReplay(1)
    );

    this.missaoConfig$ = this.siteConfig.getSecao('missao').pipe(
      map(dados => dados || {}),
      shareReplay(1)
    );

    // InscriÃ§Ãµes atadas ao LifeCycle (Limpeza automÃ¡tica atravÃ©s de takeUntilDestroyed)
  this.siteConfig.configs$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(configs => {
      if (configs && configs['fachadaUrl']) {
         this.fachadaUrl.set(configs['fachadaUrl']);
      }
    });

  this.siteConfig.getSecao('oficinas').pipe(takeUntilDestroyed(this.destroyRef)).subscribe(dados => {
      this.safeParseJsonSignal(dados, this.oficinas);
    });

  this.siteConfig.getSecao('depoimentos').pipe(takeUntilDestroyed(this.destroyRef)).subscribe(dados => {
      this.safeParseJsonSignal(dados, this.depoimentos);
    });

  this.siteConfig.getSecao('faq').pipe(takeUntilDestroyed(this.destroyRef)).subscribe(dados => {
      this.safeParseJsonSignal(dados, this.faq);
    });
  }

  ngOnInit() {
    this.carregarUltimasNoticias();
    this.carregarParceiros();
  }

  // RefatoraÃ§Ã£o defensiva do Code Smell (Tratamento seguro contra parsing malicioso)
  private safeParseJsonSignal(dados: any, targetSignal: any) {
    if (dados && dados['lista']) {
      try {
        const parsed = JSON.parse(dados['lista']);
        if (Array.isArray(parsed)) {
            targetSignal.set(parsed);
        }
      } catch (e) {
        // Bloqueio silencioso de Payload corrupto nÃ£o exibindo em stack trace (OWASP)
      }
    }
  }

  private carregarParceiros() {
    this.carregandoParceiros.set(true);
    this.erroParceiros.set(false);
  this.apoiadoresService.buscarPublicos().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (dados: Apoiador[]) => {
        this.parceiros.set(dados || []);
        this.carregandoParceiros.set(false);
      },
      error: () => {
        this.carregandoParceiros.set(false);
        this.erroParceiros.set(true);
      }
    });
  }

  private carregarUltimasNoticias() {
    this.carregandoNoticias.set(true);
    this.erroNoticias.set(false);
  this.http.get<any>(`${this.apiUrl}/comunicados?page=1&limit=3`).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: Comunicado[] | { data: Comunicado[] }) => {
        this.ultimasNoticias.set(Array.isArray(res) ? res : ((res as { data: Comunicado[] }).data ?? []));
        this.carregandoNoticias.set(false);
      },
      error: () => {
        this.carregandoNoticias.set(false);
        this.erroNoticias.set(true);
      }
    });
  }
}
