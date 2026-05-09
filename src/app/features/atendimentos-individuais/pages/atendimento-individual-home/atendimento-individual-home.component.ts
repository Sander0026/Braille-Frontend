import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AtendimentosIndividuaisApiService } from '../../services/atendimentos-individuais-api.service';
import { AcompanhamentoIndividual } from '../../models/acompanhamento-individual.model';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-atendimento-individual-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './atendimento-individual-home.component.html',
  styleUrl: './atendimento-individual-home.component.scss',
})
export class AtendimentoIndividualHomeComponent implements OnInit {
  private readonly api = inject(AtendimentosIndividuaisApiService);
  private readonly authService = inject(AuthService);
  readonly acompanhamentos = signal<AcompanhamentoIndividual[]>([]);

  readonly emAndamento = computed(() => this.acompanhamentos().filter(a => a.status === 'EM_ANDAMENTO').length);
  readonly finalizados = computed(() => this.acompanhamentos().filter(a => a.status === 'FINALIZADO').length);
  readonly arquivados = computed(() => this.acompanhamentos().filter(a => a.status === 'ARQUIVADO').length);
  readonly alunosAcompanhados = computed(() => new Set(this.acompanhamentos().map(a => a.alunoId)).size);
  readonly canViewArquivados = computed(() => {
    const role = this.authService.getUser()?.role;
    return role === 'ADMIN' || role === 'SECRETARIA';
  });

  ngOnInit(): void {
    this.api.listar({ limit: 100 }).subscribe({ next: res => this.acompanhamentos.set(res.data) });
  }
}
