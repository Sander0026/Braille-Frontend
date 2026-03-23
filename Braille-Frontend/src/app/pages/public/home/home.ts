import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { SiteConfigService } from '../../../core/services/site-config';
import { CloudinaryPipe } from '../../../core/pipes/cloudinary.pipe';
import { SafeHtmlPipe } from '../../../core/pipes/safe-html.pipe';
import { ApoiadoresService, Apoiador } from '../../admin/apoiadores/apoiadores.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule, CloudinaryPipe, SafeHtmlPipe],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {

  oficinas: any[] = [];
  depoimentos: any[] = [];
  faq: any[] = [];

  ultimasNoticias: any[] = [];
  carregandoNoticias = true;
  private apiUrl = environment.apiUrl;

  // Estados com suporte a fallback
  heroConfig: any = {};
  missaoConfig: any = {};
  fachadaUrl: string = '';
  parceiros: Apoiador[] = [];
  carregandoParceiros = false;

  constructor(
    private http: HttpClient,
    private siteConfig: SiteConfigService,
    private cdr: ChangeDetectorRef,
    private apoiadoresService: ApoiadoresService
  ) { }

  ngOnInit() {
    this.carregarUltimasNoticias();
    this.carregarConteudoCMS();
    this.carregarFachada();
  }

  ngAfterViewInit() {
    this.initScrollAnimations();
  }

  initScrollAnimations() {
    if (typeof window === 'undefined' || !window.IntersectionObserver) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { root: null, rootMargin: '0px', threshold: 0.15 });

    // Observa os elementos que já existem e também os que forem chegando via API
    const observeElements = () => {
      const elements = document.querySelectorAll('.animate-on-scroll:not(.is-observed)');
      elements.forEach(el => {
        el.classList.add('is-observed');
        observer.observe(el);
      });
    };

    // Chamada inicial e observador de mutações do Angular
    setTimeout(observeElements, 100);

    const domObserver = new MutationObserver(() => observeElements());
    domObserver.observe(document.body, { childList: true, subtree: true });
  }
  carregarConteudoCMS() {
    this.siteConfig.getSecao('hero').subscribe({
      next: (dados) => this.heroConfig = dados || {},
      error: (e) => console.error('Erro CMS hero', e)
    });
    this.siteConfig.getSecao('missao').subscribe({
      next: (dados) => this.missaoConfig = dados || {},
      error: (e) => console.error('Erro CMS missao', e)
    });
    this.siteConfig.getSecao('oficinas').subscribe({
      next: (dados) => {
        if (dados && dados['lista']) {
          try { this.oficinas = JSON.parse(dados['lista']); } catch (e) { }
        }
      },
      error: (e) => console.error('Erro CMS oficinas', e)
    });
    this.siteConfig.getSecao('depoimentos').subscribe({
      next: (dados) => {
        if (dados && dados['lista']) {
          try { this.depoimentos = JSON.parse(dados['lista']); } catch (e) { }
        }
      },
      error: (e) => console.error('Erro CMS depoimentos', e)
    });
    this.siteConfig.getSecao('faq').subscribe({
      next: (dados) => {
        if (dados && dados['lista']) {
          try { this.faq = JSON.parse(dados['lista']); } catch (e) { }
        }
      },
      error: (e) => console.error('Erro CMS faq', e)
    });

    this.carregarParceiros();
  }

  carregarParceiros() {
    this.carregandoParceiros = true;
    this.apoiadoresService.buscarPublicos().subscribe({
      next: (dados: Apoiador[]) => {
        this.parceiros = dados;
        this.carregandoParceiros = false;
        this.cdr.detectChanges();
      },
      error: (e: any) => {
        console.error('Erro ao carregar parceiros públicos na home', e);
        this.carregandoParceiros = false;
        this.cdr.detectChanges();
      }
    });
  }

  carregarFachada() {
    this.siteConfig.configs$.subscribe({
      next: (configs) => {
        if (configs && configs['fachadaUrl']) {
          this.fachadaUrl = configs['fachadaUrl'];
          this.cdr.markForCheck();
        }
      }
    });
  }

  carregarUltimasNoticias() {
    this.http.get<any>(`${this.apiUrl}/comunicados?page=1&limit=3`).subscribe({
      next: (res) => {
        this.ultimasNoticias = Array.isArray(res) ? res : (res.data ?? []);
        this.carregandoNoticias = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Erro ao buscar as últimas notícias', err);
        this.carregandoNoticias = false;
        this.cdr.markForCheck();
      }
    });
  }


  getTextoPuro(html: string): string {
    if (!html) return '';
    // Proteção XSS (Fase 13): Regex Estrita extirpando 100% das Tags HTML sem instanciar/executar Nodes na Memória Angular
    return html.replace(/<\/?[^>]+(>|$)/g, '').replace(/&nbsp;/g, ' ');
  }

  getLabelCategoria(cat: string): string {
    const map: Record<string, string> = {
      'NOTICIA': 'Notícia',
      'VAGA_EMPREGO': 'Vaga PCD',
      'SERVICO': 'Serviço',
      'EVENTO_CULTURAL': 'Evento',
      'LEGISLACAO': 'Legislação',
      'TRABALHO_PCD': 'Trabalho PCD',
      'GERAL': 'Aviso'
    };
    return map[cat] || 'Geral';
  }
}

