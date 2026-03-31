import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { CloudinaryPipe } from '../../../core/pipes/cloudinary.pipe';

export interface ComunicadoPublico {
  id: string;
  titulo: string;
  conteudo: string;
  categoria: string;
  imagemCapa?: string;
  fixado: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

@Component({
  selector: 'app-noticias-lista',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterModule, CloudinaryPipe],
  templateUrl: './noticias-lista.html',
  styleUrl: './noticias-lista.scss'
})
export class NoticiasLista implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private cdr = inject(ChangeDetectorRef);

  comunicados: ComunicadoPublico[] = [];
  carregando = true;

  // Filtros
  categoriaSelecionada: string | null = null;
  busca: string = '';

  // Paginação
  paginaAtual = 1;
  limite = 9; // 3 colunas x 3 linhas fica bonito
  totalItems = 0;
  temMais = false;

  categorias = [
    { valor: null, label: 'Todos' },
    { valor: 'NOTICIA', label: 'Notícias' },
    { valor: 'VAGA_EMPREGO', label: 'Vagas PCD' },
    { valor: 'SERVICO', label: 'Serviços' },
    { valor: 'EVENTO_CULTURAL', label: 'Eventos' },
    { valor: 'LEGISLACAO', label: 'Legislação' },
    { valor: 'GERAL', label: 'Avisos Gerais' }
  ];

  ngOnInit() {
    this.carregarComunicados(true);
  }

  carregarComunicados(reset = false) {
    if (reset) {
      this.paginaAtual = 1;
      this.comunicados = [];
      this.carregando = true;
    }

    let url = `${this.apiUrl}/comunicados?page=${this.paginaAtual}&limit=${this.limite}`;
    if (this.categoriaSelecionada) {
      url += `&categoria=${this.categoriaSelecionada}`;
    }
    if (this.busca) {
      url += `&titulo=${encodeURIComponent(this.busca)}`;
    }

    this.http.get<any>(url).subscribe({
      next: (res) => {
        const items = Array.isArray(res) ? res : (res.data ?? []);

        if (reset) {
          this.comunicados = items;
        } else {
          this.comunicados = [...this.comunicados, ...items];
        }

        this.totalItems = res.total ?? items.length;
        this.temMais = this.paginaAtual < (res.totalPages ?? 1);
        this.carregando = false;
        this.cdr.detectChanges(); // withFetch() roda fora do Zone.js
      },
      error: (err) => {
        console.error('Erro ao carregar comunicados', err);
        this.carregando = false;
        this.cdr.detectChanges();
      }
    });
  }

  filtrarPorCategoria(cat: string | null) {
    if (this.categoriaSelecionada === cat) return;
    this.categoriaSelecionada = cat;
    this.carregarComunicados(true);
  }

  buscar() {
    this.carregarComunicados(true);
  }

  carregarMais() {
    if (!this.temMais) return;
    this.paginaAtual++;
    this.carregarComunicados(false);
  }

  // Helper Seguro (Anti XSS) para extrair o Resumo na Pré-visualização do Card
  getTextoPuro(html: string): string {
    if (!html) return '';
    const comEspacos = html.replace(/<\/(p|div|h[1-6])>/gi, ' ').replace(/<br\s*[\/]?>/gi, ' ');
    const semTags = comEspacos.replace(/<\/?[^>]+(>|$)/g, '');
    return semTags.replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  }

  getLabelCategoria(cat: string): string {
    return this.categorias.find(c => c.valor === cat)?.label || 'Geral';
  }
}
