import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AtendimentosIndividuaisApiService } from '../../services/atendimentos-individuais-api.service';
import { AcompanhamentoIndividual } from '../../models/acompanhamento-individual.model';
import { AcompanhamentoCardComponent } from '../../components/acompanhamento-card/acompanhamento-card.component';
import { EmptyStateAtendimentosComponent } from '../../components/empty-state-atendimentos/empty-state-atendimentos.component';

@Component({
  selector: 'app-acompanhamentos-finalizados',
  standalone: true,
  imports: [CommonModule, FormsModule, AcompanhamentoCardComponent, EmptyStateAtendimentosComponent],
  templateUrl: './acompanhamentos-finalizados.component.html',
  styleUrl: '../acompanhamentos-em-andamento/acompanhamentos-em-andamento.component.scss',
})
export class AcompanhamentosFinalizadosComponent implements OnInit {
  private readonly api = inject(AtendimentosIndividuaisApiService);
  readonly acompanhamentos = signal<AcompanhamentoIndividual[]>([]);
  readonly carregando = signal(true);
  busca = '';

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.api.listar({ status: 'FINALIZADO', busca: this.busca || undefined, limit: 100 }).subscribe({
      next: res => { this.acompanhamentos.set(res.data); this.carregando.set(false); },
      error: () => this.carregando.set(false),
    });
  }
}
