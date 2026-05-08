import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AtendimentosIndividuaisApiService } from '../../services/atendimentos-individuais-api.service';
import { AcompanhamentoIndividual } from '../../models/acompanhamento-individual.model';
import { AcompanhamentoCardComponent } from '../../components/acompanhamento-card/acompanhamento-card.component';
import { EmptyStateAtendimentosComponent } from '../../components/empty-state-atendimentos/empty-state-atendimentos.component';

@Component({
  selector: 'app-acompanhamentos-em-andamento',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AcompanhamentoCardComponent, EmptyStateAtendimentosComponent],
  templateUrl: './acompanhamentos-em-andamento.component.html',
  styleUrl: './acompanhamentos-em-andamento.component.scss',
})
export class AcompanhamentosEmAndamentoComponent implements OnInit {
  private readonly api = inject(AtendimentosIndividuaisApiService);
  readonly acompanhamentos = signal<AcompanhamentoIndividual[]>([]);
  readonly carregando = signal(true);
  busca = '';

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.api.listar({ status: 'EM_ANDAMENTO', busca: this.busca || undefined, limit: 100 }).subscribe({
      next: res => { this.acompanhamentos.set(res.data); this.carregando.set(false); },
      error: () => this.carregando.set(false),
    });
  }

  finalizar(acompanhamento: AcompanhamentoIndividual): void {
    if (!confirm(`Finalizar acompanhamento de ${acompanhamento.aluno?.nomeCompleto || 'aluno'}?`)) return;
    this.api.finalizar(acompanhamento.id, {}).subscribe({ next: () => this.carregar() });
  }
}
