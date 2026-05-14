import { Component, OnInit, computed, inject, signal } from '@angular/core';
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
  readonly acompanhamentos = signal<AcompanhamentoIndividual[]>([]);
  readonly criandoAcompanhamento = signal(false);

  readonly emAndamento = computed(() => this.acompanhamentos().filter(a => a.status === 'EM_ANDAMENTO').length);
  readonly finalizados = computed(() => this.acompanhamentos().filter(a => a.status === 'FINALIZADO').length);
  readonly arquivados = computed(() => this.acompanhamentos().filter(a => a.arquivado || a.status === 'ARQUIVADO').length);
  readonly alunosAcompanhados = computed(() => new Set(this.acompanhamentos().map(a => a.alunoId)).size);
  readonly canViewArquivados = computed(() => {
    const role = this.authService.getUser()?.role;
    return role === 'ADMIN' || role === 'SECRETARIA';
  });

  ngOnInit(): void {
    this.api.listar({ limit: 100 }).subscribe({ next: res => this.acompanhamentos.set(res.data) });
  }

  abrirModalCriacao(): void {
    this.criandoAcompanhamento.set(true);
  }

  fecharModalCriacao(): void {
    this.criandoAcompanhamento.set(false);
  }

  onCriacaoSalva(acomp: AcompanhamentoIndividual): void {
    this.fecharModalCriacao();
    this.acompanhamentos.update(list => [acomp, ...list]);
  }
}
