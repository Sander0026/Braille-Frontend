import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';

export interface ComunicadoPublico {
  id: string;
  titulo: string;
  conteudo: string; // Vem com HTML do editor rico
  categoria: string;
  imagemCapa?: string;
  fixado: boolean;
  criadoEm: string;
}

@Component({
  selector: 'app-noticias-lista',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
    { valor: 'TRABALHO_PCD', label: 'Trabalho PCD' },
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

  // Helper para mostrar apenas texto puro nos cards (remove tags HTML do editor rico)
  getTextoPuro(html: string): string {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  }

  getLabelCategoria(cat: string): string {
    return this.categorias.find(c => c.valor === cat)?.label || 'Geral';
  }
}
