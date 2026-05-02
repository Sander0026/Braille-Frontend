import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  signal,
  inject,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LiveAnnouncer } from '@angular/cdk/a11y';

import { ComunicadosService, Comunicado } from '../../../../core/services/comunicados.service';
import { CloudinaryPipe } from '../../../../core/pipes/cloudinary.pipe';
import { StripHtmlPipe } from '../../../../shared/pipes/strip-html.pipe';
import { CategoryLabelPipe } from '../../../../shared/pipes/category-label.pipe';

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
    CategoryLabelPipe,
  ],
  templateUrl: './noticias-lista.html',
  styleUrl:    './noticias-lista.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoticiasLista implements OnInit {

  // ── Infraestrutura de DI (campo-level = injection context válido) ────────────
  private readonly comunicadosService = inject(ComunicadosService);
  private readonly destroyRef          = inject(DestroyRef);
  private readonly liveAnnouncer       = inject(LiveAnnouncer);

  // ── Estado reativo ───────────────────────────────────────────────────────────
  comunicados          = signal<Comunicado[]>([]);
  carregando           = signal<boolean>(true);
  erroCarregamento     = signal<boolean>(false);
  categoriaSelecionada = signal<string | null>(null);
  busca                = signal<string>('');
  paginaAtual          = signal<number>(1);
  readonly limite      = 9; // Grid 3×3
  totalItems           = signal<number>(0);
  temMais              = signal<boolean>(false);

  // ── Dados estáticos ──────────────────────────────────────────────────────────
  readonly categorias = [
    { valor: null,            label: 'Todos'          },
    { valor: 'NOTICIA',       label: 'Notícias'       },
    { valor: 'VAGA_EMPREGO',  label: 'Vagas PCD'      },
    { valor: 'SERVICO',       label: 'Serviços'       },
    { valor: 'EVENTO_CULTURAL',label: 'Eventos'       },
    { valor: 'LEGISLACAO',    label: 'Legislação'     },
    { valor: 'GERAL',         label: 'Avisos Gerais'  },
  ] as const;

  ngOnInit(): void {
    this.carregarComunicados(true);
  }

  carregarComunicados(reset = false): void {
    if (reset) {
      this.paginaAtual.set(1);
      this.comunicados.set([]);
      this.carregando.set(true);
      this.erroCarregamento.set(false);
    }

    const cat  = this.categoriaSelecionada() ?? undefined;
    const term = this.busca()                ?? undefined;

    /**
     * takeUntilDestroyed(this.destroyRef) é o padrão correto quando chamado
     * FORA do contexto de injeção (i.e., dentro de um método regular).
     * Passar o DestroyRef explicitamente é o contrato público da API Angular
     * para esse caso de uso — evita NG0203 e garante clean-up automático.
     */
    this.comunicadosService
      .listar(this.paginaAtual(), this.limite, cat, term)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          const items: Comunicado[] = Array.isArray(res) ? res : (res.data ?? []);

          if (reset) {
            this.comunicados.set(items);
          } else {
            this.comunicados.update(curr => [...curr, ...items]);
          }

          this.totalItems.set(res.total      ?? items.length);
          this.temMais.set(this.paginaAtual() < (res.totalPages ?? 1));
          this.carregando.set(false);

          if (reset) {
            this.liveAnnouncer.announce(`${this.totalItems()} notícias encontradas.`, 'polite');
          } else {
            this.liveAnnouncer.announce(`Mais comunicados carregados. Total visível: ${this.comunicados().length}.`, 'polite');
          }
        },
        error: () => {
          // Silencia stack-trace no console (DevSecOps) — exibe fallback visual ao usuário
          this.carregando.set(false);
          this.erroCarregamento.set(true);
          this.liveAnnouncer.announce(
            'Não foi possível carregar os comunicados. Por favor, tente novamente.',
            'assertive'
          );
        },
      });
  }

  filtrarPorCategoria(cat: string | null): void {
    if (this.categoriaSelecionada() === cat) return;
    this.categoriaSelecionada.set(cat);
    this.liveAnnouncer.announce('Aplicando filtro de categoria...', 'polite');
    this.carregarComunicados(true);
  }

  executarBuscar(): void {
    this.liveAnnouncer.announce('Buscando comunicados...', 'polite');
    this.carregarComunicados(true);
  }

  carregarMais(): void {
    if (!this.temMais()) return;
    this.paginaAtual.update(v => v + 1);
    this.carregarComunicados(false);
  }
}
