import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { SiteConfigService } from '../../../core/services/site-config';

@Component({
  selector: 'app-home',
  imports: [RouterLink, CommonModule],
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

  constructor(private http: HttpClient, private siteConfig: SiteConfigService) { }

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
      },
      error: (err) => {
        console.error('Erro ao buscar as últimas notícias', err);
        this.carregandoNoticias = false;
      }
    });
  }

  getTextoPuro(html: string): string {
    if (!html) return '';
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
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

