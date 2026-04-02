import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ComunicadosService, Comunicado } from '../../../core/services/comunicados.service';
import { CloudinaryPipe } from '../../../core/pipes/cloudinary.pipe';
import { StripHtmlPipe } from '../../../shared/pipes/strip-html.pipe';
import { CategoryLabelPipe } from '../../../shared/pipes/category-label.pipe';

@Component({
  selector: 'app-noticias-lista',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterLink, 
    RouterModule, 
    CloudinaryPipe, 
    StripHtmlPipe, 
    CategoryLabelPipe
  ],
  templateUrl: './noticias-lista.html',
  styleUrl: './noticias-lista.scss',
  changeDetection: ChangeDetectionStrategy.OnPush // Otimização profunda em matrizes (Listas)
})
export class NoticiasLista implements OnInit {

  // Estrutura Reativa Total
  comunicados = signal<Comunicado[]>([]);
  carregando = signal<boolean>(true);

  // Filtros Reativos Blindados Contra Mutação
  categoriaSelecionada = signal<string | null>(null);
  busca = signal<string>('');

  // Paginação Limpa
  paginaAtual = signal<number>(1);
  limite = 9; // Grid bonito (3x3)
  totalItems = signal<number>(0);
  temMais = signal<boolean>(false);

  // Apenas layout render para toolbar nativa
  categorias = [
    { valor: null, label: 'Todos' },
    { valor: 'NOTICIA', label: 'Notícias' },
    { valor: 'VAGA_EMPREGO', label: 'Vagas PCD' },
    { valor: 'SERVICO', label: 'Serviços' },
    { valor: 'EVENTO_CULTURAL', label: 'Eventos' },
    { valor: 'LEGISLACAO', label: 'Legislação' },
    { valor: 'GERAL', label: 'Avisos Gerais' }
  ];

  // Injeção Oficial SRP
  constructor(private comunicadosService: ComunicadosService) {}

  ngOnInit() {
    this.carregarComunicados(true);
  }

  carregarComunicados(reset = false) {
    if (reset) {
      this.paginaAtual.set(1);
      this.comunicados.set([]);
      this.carregando.set(true);
    }

    const cat = this.categoriaSelecionada() || undefined;
    const term = this.busca() || undefined;

    // Acesso limpo isolado (API restrita HTTP do Serviço SRP) prevenindo Mem-Leak
    this.comunicadosService.listar(this.paginaAtual(), this.limite, cat, term)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (res: any) => {
          const items = Array.isArray(res) ? res : (res.data ?? []);

          if (reset) {
            this.comunicados.set(items);
          } else {
            this.comunicados.update(curr => [...curr, ...items]);
          }

          this.totalItems.set(res.total ?? items.length);
          this.temMais.set(this.paginaAtual() < (res.totalPages ?? 1));
          this.carregando.set(false);
        },
        error: () => {
          // Engolindo o erro silenciosamente perante a renderização DevSecOps
          this.carregando.set(false);
        }
      });
  }

  filtrarPorCategoria(cat: string | null) {
    if (this.categoriaSelecionada() === cat) return;
    this.categoriaSelecionada.set(cat);
    this.carregarComunicados(true);
  }

  executarBuscar() {
    this.carregarComunicados(true);
  }

  carregarMais() {
    if (!this.temMais()) return;
    this.paginaAtual.update(v => v + 1);
    this.carregarComunicados(false);
  }
}
