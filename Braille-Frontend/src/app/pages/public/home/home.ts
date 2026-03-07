import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, NgClass } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { SiteConfigService } from '../../../core/services/site-config';
import { SafeHtmlPipe } from '../../../core/pipes/safe-html.pipe';
import { CloudinaryPipe } from '../../../core/pipes/cloudinary.pipe';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, NgClass, CommonModule, SafeHtmlPipe, CloudinaryPipe],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {

  oficinas: any[] = [];
  depoimentos: any[] = [];

  ultimasNoticias: any[] = [];
  carregandoNoticias = true;
  private apiUrl = environment.apiUrl;

  // Estados com suporte a fallback
  heroConfig: any = {};
  missaoConfig: any = {};

  constructor(
    private http: HttpClient,
    private siteConfig: SiteConfigService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit() {
    this.carregarUltimasNoticias();
    this.carregarConteudoCMS();
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

