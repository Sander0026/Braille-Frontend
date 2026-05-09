import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AtendimentosIndividuaisApiService } from '../../services/atendimentos-individuais-api.service';
import { AcompanhamentoIndividual } from '../../models/acompanhamento-individual.model';
import { AcompanhamentoCardComponent } from '../../components/acompanhamento-card/acompanhamento-card.component';
import { EmptyStateAtendimentosComponent } from '../../components/empty-state-atendimentos/empty-state-atendimentos.component';
import { PaginationComponent } from '../../components/pagination/pagination.component';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-acompanhamentos-arquivados',
  standalone: true,
  imports: [CommonModule, FormsModule, AcompanhamentoCardComponent, EmptyStateAtendimentosComponent, PaginationComponent],
  templateUrl: './acompanhamentos-arquivados.component.html',
  styleUrl: '../acompanhamentos-em-andamento/acompanhamentos-em-andamento.component.scss',
})
export class AcompanhamentosArquivadosComponent implements OnInit {
  private readonly api = inject(AtendimentosIndividuaisApiService);
  private readonly toast = inject(ToastService);
  readonly acompanhamentos = signal<AcompanhamentoIndividual[]>([]);
  readonly carregando = signal(true);
  readonly erro = signal('');
  readonly page = signal(1);
  readonly total = signal(0);
  readonly lastPage = signal(1);
  private readonly limit = 20;
  busca = '';

  ngOnInit(): void {
    this.carregar();
  }

  carregar(page = this.page()): void {
    this.carregando.set(true);
    this.erro.set('');
    this.page.set(page);
    this.api.listar({ status: 'ARQUIVADO', busca: this.busca || undefined, page, limit: this.limit }).subscribe({
      next: res => {
        this.acompanhamentos.set(res.data);
        this.total.set(res.meta.total);
        this.lastPage.set(res.meta.lastPage || 1);
        this.carregando.set(false);
      },
      error: () => {
        this.carregando.set(false);
        this.erro.set('Nao foi possivel carregar os acompanhamentos arquivados.');
        this.toast.erro('Nao foi possivel carregar os acompanhamentos.');
      },
    });
  }

  filtrar(): void {
    this.carregar(1);
  }

  paginaAnterior(): void {
    if (this.page() > 1) this.carregar(this.page() - 1);
  }

  proximaPagina(): void {
    if (this.page() < this.lastPage()) this.carregar(this.page() + 1);
  }
}
