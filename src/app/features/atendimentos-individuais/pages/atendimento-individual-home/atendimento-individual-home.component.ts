import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AtendimentosIndividuaisApiService } from '../../services/atendimentos-individuais-api.service';
import { AcompanhamentoIndividual } from '../../models/acompanhamento-individual.model';
import { AuthService } from '../../../../core/services/auth.service';

import { CriarAcompanhamentoModalComponent } from '../../components/criar-acompanhamento-modal/criar-acompanhamento-modal.component';

@Component({
  selector: 'app-atendimento-individual-home',
  standalone: true,
  imports: [CommonModule, RouterLink, CriarAcompanhamentoModalComponent],
  templateUrl: './atendimento-individual-home.component.html',
  styleUrl: './atendimento-individual-home.component.scss',
})
export class AtendimentoIndividualHomeComponent implements OnInit {
  private readonly api = inject(AtendimentosIndividuaisApiService);
  private readonly authService = inject(AuthService);

  /** Lista de acompanhamentos em andamento para os cards da home */
  readonly acompanhamentos = signal<AcompanhamentoIndividual[]>([]);
  readonly criandoAcompanhamento = signal(false);

  // Contadores individuais por status — carregados com chamadas dedicadas
  // para garantir precisão mesmo quando o backend filtra arquivados por padrão
  readonly emAndamento        = signal(0);
  readonly finalizados        = signal(0);
  readonly arquivados         = signal(0);
  readonly alunosAcompanhados = signal(0);

  readonly canViewArquivados = computed(() => {
    const role = this.authService.getUser()?.role;
    return role === 'ADMIN' || role === 'SECRETARIA';
  });

  ngOnInit(): void {
    this.carregarTudo();
  }

  /** Carrega a lista de cards + contadores em paralelo */
  carregarTudo(): void {
    // Lista em andamento (para os cards da home)
    this.api.listar({ status: 'EM_ANDAMENTO', limit: 50 }).subscribe({
      next: res => {
        this.acompanhamentos.set(res.data);
        this.emAndamento.set(res.meta.total);
        this.alunosAcompanhados.set(
          new Set(res.data.map(a => a.alunoId)).size
        );
      },
    });

    // Contagem de finalizados via meta.total (não carrega os dados completos)
    this.api.listar({ status: 'FINALIZADO', limit: 1 }).subscribe({
      next: res => this.finalizados.set(res.meta.total),
    });

    // Contagem de arquivados — chamada explícita para não depender
    // do filtro padrão do backend, que pode excluir arquivados por omissão
    this.api.listar({ status: 'ARQUIVADO', limit: 1 }).subscribe({
      next: res => this.arquivados.set(res.meta.total),
    });
  }

  abrirModalCriacao(): void {
    this.criandoAcompanhamento.set(true);
  }

  fecharModalCriacao(): void {
    this.criandoAcompanhamento.set(false);
  }

  onCriacaoSalva(acomp: AcompanhamentoIndividual): void {
    this.fecharModalCriacao();
    // Atualiza localmente sem recarregar toda a página
    this.acompanhamentos.update(list => [acomp, ...list]);
    this.emAndamento.update(n => n + 1);
    this.alunosAcompanhados.set(
      new Set(this.acompanhamentos().map(a => a.alunoId)).size
    );
  }
}
