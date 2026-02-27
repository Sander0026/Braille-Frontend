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
export class Home {
  readonly oficinas = [
    {
      icon: '⠿',
      titulo: 'Leitura e Escrita Braille',
      descricao: 'Aprenda o sistema de leitura e escrita tátil criado por Louis Braille, base fundamental para a autonomia educacional.',
    },
    {
      icon: '💻',
      titulo: 'Informática Acessível',
      descricao: 'Uso de computadores com leitores de tela (NVDA, JAWS), navegação na internet e ferramentas de acessibilidade digital.',
    },
    {
      icon: '🎭',
      titulo: 'Artes e Expressão Cultural',
      descricao: 'Atividades de teatro, música e artesanato adaptado, estimulando criatividade e integração social.',
    },
    {
      icon: '🧶',
      titulo: 'Artesanato e Trabalhos Manuais',
      descricao: 'Cerâmica, tricô, crochê e outras atividades manuais que desenvolvem coordenação e geração de renda.',
    },
    {
      icon: '🏃',
      titulo: 'Orientação e Mobilidade',
      descricao: 'Técnicas de locomoção com bengala, reconhecimento de ambientes e uso seguro do espaço público.',
    },
    {
      icon: '📚',
      titulo: 'Reforço Escolar',
      descricao: 'Apoio pedagógico em matemática, português e outras disciplinas, com materiais didáticos adaptados.',
    },
  ];

  readonly depoimentos = [
    {
      texto: 'O instituto mudou minha vida. Aprendi Braille e hoje consigo ler e escrever com independência total.',
      nome: 'Maria Aparecida',
      idade: 52,
    },
    {
      texto: 'As aulas de informática me abriram portas no mercado de trabalho. Nunca imaginei que poderia usar um computador.',
      nome: 'João Carlos',
      idade: 34,
    },
    {
      texto: 'Encontrei amigos, aprendi coisas novas e me sinto parte da sociedade. O instituto é minha segunda família.',
      nome: 'Sandra Lima',
      idade: 41,
    },
  ];

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
  }

  carregarUltimasNoticias() {
    this.http.get<any>(`${this.apiUrl}/comunicados?page=1&limit=3`).subscribe({
      next: (res) => {
        this.ultimasNoticias = res.data;
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

