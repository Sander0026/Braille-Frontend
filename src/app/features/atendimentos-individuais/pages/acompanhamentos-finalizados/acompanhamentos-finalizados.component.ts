import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AtendimentosIndividuaisApiService } from '../../services/atendimentos-individuais-api.service';
import { AcompanhamentoIndividual } from '../../models/acompanhamento-individual.model';
import { AcompanhamentoCardComponent } from '../../components/acompanhamento-card/acompanhamento-card.component';
import { EmptyStateAtendimentosComponent } from '../../components/empty-state-atendimentos/empty-state-atendimentos.component';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-acompanhamentos-finalizados',
  standalone: true,
  imports: [CommonModule, FormsModule, AcompanhamentoCardComponent, EmptyStateAtendimentosComponent],
  templateUrl: './acompanhamentos-finalizados.component.html',
  styleUrl: '../acompanhamentos-em-andamento/acompanhamentos-em-andamento.component.scss',
})
export class AcompanhamentosFinalizadosComponent implements OnInit {
  private readonly api = inject(AtendimentosIndividuaisApiService);
  private readonly toast = inject(ToastService);
  readonly acompanhamentos = signal<AcompanhamentoIndividual[]>([]);
  readonly carregando = signal(true);
  readonly erro = signal('');
  busca = '';

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.erro.set('');
    this.api.listar({ status: 'FINALIZADO', busca: this.busca || undefined, limit: 100 }).subscribe({
      next: res => { this.acompanhamentos.set(res.data); this.carregando.set(false); },
      error: () => {
        this.carregando.set(false);
        this.erro.set('Nao foi possivel carregar os acompanhamentos finalizados.');
        this.toast.erro('Nao foi possivel carregar os acompanhamentos.');
      },
    });
  }
}
