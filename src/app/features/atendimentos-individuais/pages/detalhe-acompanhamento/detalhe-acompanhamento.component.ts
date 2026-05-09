import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AtendimentosIndividuaisApiService } from '../../services/atendimentos-individuais-api.service';
import { AcompanhamentoIndividual } from '../../models/acompanhamento-individual.model';
import { StatusAcompanhamentoBadgeComponent } from '../../components/status-acompanhamento-badge/status-acompanhamento-badge.component';
import { TimelineAtendimentosComponent } from '../../components/timeline-atendimentos/timeline-atendimentos.component';
import { ResumoAtendimentosComponent } from '../../components/resumo-atendimentos/resumo-atendimentos.component';
import { calcularResumoAtendimentos } from '../../utils/calcular-resumo-atendimentos.util';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-detalhe-acompanhamento',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, StatusAcompanhamentoBadgeComponent, TimelineAtendimentosComponent, ResumoAtendimentosComponent],
  templateUrl: './detalhe-acompanhamento.component.html',
  styleUrl: './detalhe-acompanhamento.component.scss',
})
export class DetalheAcompanhamentoComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(AtendimentosIndividuaisApiService);
  private readonly authService = inject(AuthService);
  readonly acompanhamento = signal<AcompanhamentoIndividual | null>(null);
  readonly resumo = computed(() => calcularResumoAtendimentos(this.acompanhamento()?.atendimentos ?? []));

  alterandoAssunto = false;
  finalizando = false;
  novoAssunto = '';
  motivoAlteracao = '';
  resultadoFinal = '';
  resumoFinal = '';

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.api.buscar(id).subscribe({ next: item => this.acompanhamento.set(item) });
  }

  salvarAssunto(): void {
    const item = this.acompanhamento();
    if (!item || !this.novoAssunto.trim() || !this.motivoAlteracao.trim()) return;
    this.api.atualizarAssunto(item.id, {
      assuntoAtual: this.novoAssunto,
      motivoAlteracao: this.motivoAlteracao,
    }).subscribe({
      next: atual => {
        this.acompanhamento.set(atual);
        this.alterandoAssunto = false;
      },
    });
  }

  finalizar(): void {
    const item = this.acompanhamento();
    if (!item) return;
    this.api.finalizar(item.id, {
      resultadoFinal: this.resultadoFinal || undefined,
      resumoFinal: this.resumoFinal || undefined,
    }).subscribe({
      next: atual => {
        this.acompanhamento.set(atual);
        this.finalizando = false;
      },
    });
  }

  canCreateAtendimento(item: AcompanhamentoIndividual): boolean {
    return item.status === 'EM_ANDAMENTO' && this.canMutate(item);
  }

  canUpdateSubject(item: AcompanhamentoIndividual): boolean {
    return item.status === 'EM_ANDAMENTO' && this.canMutate(item);
  }

  canFinish(item: AcompanhamentoIndividual): boolean {
    return item.status === 'EM_ANDAMENTO' && this.canMutate(item);
  }

  private canMutate(item: AcompanhamentoIndividual): boolean {
    const user = this.authService.getUser();
    if (user?.role === 'ADMIN') return true;
    return user?.role === 'PROFESSOR' && item.professorId === user.sub;
  }
}
