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
import { ToastService } from '../../../../core/services/toast.service';

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
  private readonly toast = inject(ToastService);
  readonly acompanhamento = signal<AcompanhamentoIndividual | null>(null);
  readonly resumo = computed(() => calcularResumoAtendimentos(this.acompanhamento()?.atendimentos ?? []));
  readonly carregando = signal(true);
  readonly erro = signal('');
  readonly salvandoAssunto = signal(false);
  readonly finalizandoAcompanhamento = signal(false);
  readonly alterandoArquivo = signal(false);

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
    this.carregando.set(true);
    this.erro.set('');
    this.api.buscar(id).subscribe({
      next: item => {
        this.acompanhamento.set(item);
        this.carregando.set(false);
      },
      error: () => {
        this.carregando.set(false);
        this.erro.set('Nao foi possivel carregar este acompanhamento.');
      },
    });
  }

  salvarAssunto(): void {
    const item = this.acompanhamento();
    if (!item || !this.novoAssunto.trim() || !this.motivoAlteracao.trim()) return;
    this.salvandoAssunto.set(true);
    this.api.atualizarAssunto(item.id, {
      assuntoAtual: this.novoAssunto,
      motivoAlteracao: this.motivoAlteracao,
    }).subscribe({
      next: atual => {
        this.acompanhamento.set(atual);
        this.alterandoAssunto = false;
        this.salvandoAssunto.set(false);
        this.toast.sucesso('Assunto atualizado com sucesso.');
      },
      error: () => {
        this.salvandoAssunto.set(false);
        this.toast.erro('Nao foi possivel atualizar o assunto.');
      },
    });
  }

  finalizar(): void {
    const item = this.acompanhamento();
    if (!item) return;
    this.finalizandoAcompanhamento.set(true);
    this.api.finalizar(item.id, {
      resultadoFinal: this.resultadoFinal || undefined,
      resumoFinal: this.resumoFinal || undefined,
    }).subscribe({
      next: atual => {
        this.acompanhamento.set(atual);
        this.finalizando = false;
        this.finalizandoAcompanhamento.set(false);
        this.toast.sucesso('Acompanhamento finalizado com sucesso.');
      },
      error: () => {
        this.finalizandoAcompanhamento.set(false);
        this.toast.erro('Nao foi possivel finalizar o acompanhamento.');
      },
    });
  }

  arquivar(): void {
    const item = this.acompanhamento();
    if (!item || !this.canArchive()) return;

    this.alterandoArquivo.set(true);
    this.api.arquivar(item.id).subscribe({
      next: atual => {
        this.acompanhamento.set(atual);
        this.alterandoArquivo.set(false);
        this.toast.sucesso('Acompanhamento arquivado com sucesso.');
      },
      error: () => {
        this.alterandoArquivo.set(false);
        this.toast.erro('Nao foi possivel arquivar o acompanhamento.');
      },
    });
  }

  desarquivar(): void {
    const item = this.acompanhamento();
    if (!item || !this.canArchive()) return;

    this.alterandoArquivo.set(true);
    this.api.desarquivar(item.id).subscribe({
      next: atual => {
        this.acompanhamento.set(atual);
        this.alterandoArquivo.set(false);
        this.toast.sucesso('Acompanhamento desarquivado com sucesso.');
      },
      error: () => {
        this.alterandoArquivo.set(false);
        this.toast.erro('Nao foi possivel desarquivar o acompanhamento.');
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

  canArchive(): boolean {
    return this.authService.getUser()?.role === 'ADMIN';
  }

  private canMutate(item: AcompanhamentoIndividual): boolean {
    const user = this.authService.getUser();
    if (user?.role === 'ADMIN') return true;
    return user?.role === 'PROFESSOR' && item.professorId === user.sub;
  }
}
