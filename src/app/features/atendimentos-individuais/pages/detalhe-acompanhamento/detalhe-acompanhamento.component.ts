import { Component, ElementRef, HostListener, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
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
  readonly confirmacaoArquivo = signal<'arquivar' | 'desarquivar' | null>(null);
  @ViewChild('confirmacaoDialog') private confirmacaoDialog?: ElementRef<HTMLElement>;
  @ViewChild('confirmacaoCancelar') private confirmacaoCancelar?: ElementRef<HTMLButtonElement>;
  @ViewChild('assuntoDialog') private assuntoDialog?: ElementRef<HTMLElement>;
  @ViewChild('assuntoPrimeiroFoco') private assuntoPrimeiroFoco?: ElementRef<HTMLElement>;
  @ViewChild('finalizacaoDialog') private finalizacaoDialog?: ElementRef<HTMLElement>;
  @ViewChild('finalizacaoPrimeiroFoco') private finalizacaoPrimeiroFoco?: ElementRef<HTMLElement>;
  private ultimoBotaoConfirmacao: HTMLElement | null = null;
  private ultimoBotaoAssunto: HTMLElement | null = null;
  private ultimoBotaoFinalizacao: HTMLElement | null = null;

  alterandoAssunto = false;
  finalizando = false;
  novoAssunto = '';
  motivoAlteracao = '';
  resultadoFinal = '';
  resumoFinal = '';
  motivoArquivamentoTexto = '';

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

  abrirModalAssunto(assuntoAtual: string, event: Event): void {
    this.ultimoBotaoAssunto = event.currentTarget as HTMLElement;
    this.novoAssunto = assuntoAtual;
    this.motivoAlteracao = '';
    this.alterandoAssunto = true;
    window.setTimeout(() => this.assuntoPrimeiroFoco?.nativeElement.focus());
  }

  fecharModalAssunto(): void {
    if (this.salvandoAssunto()) return;
    this.alterandoAssunto = false;
    window.setTimeout(() => this.ultimoBotaoAssunto?.focus());
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
        this.fecharModalAssunto();
        this.salvandoAssunto.set(false);
        this.toast.sucesso('Assunto atualizado com sucesso.');
      },
      error: () => {
        this.salvandoAssunto.set(false);
        this.toast.erro('Nao foi possivel atualizar o assunto.');
      },
    });
  }

  abrirModalFinalizacao(event: Event): void {
    this.ultimoBotaoFinalizacao = event.currentTarget as HTMLElement;
    this.resultadoFinal = '';
    this.resumoFinal = '';
    this.finalizando = true;
    window.setTimeout(() => this.finalizacaoPrimeiroFoco?.nativeElement.focus());
  }

  fecharModalFinalizacao(): void {
    if (this.finalizandoAcompanhamento()) return;
    this.finalizando = false;
    window.setTimeout(() => this.ultimoBotaoFinalizacao?.focus());
  }

  finalizar(): void {
    const item = this.acompanhamento();
    if (!item || !this.resultadoFinal.trim()) return;
    this.finalizandoAcompanhamento.set(true);
    this.api.finalizar(item.id, {
      resultadoFinal: this.resultadoFinal || undefined,
      resumoFinal: this.resumoFinal || undefined,
    }).subscribe({
      next: atual => {
        this.acompanhamento.set(atual);
        this.fecharModalFinalizacao();
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
    if (!item || !this.canArchive() || !this.motivoArquivamentoTexto.trim()) return;

    this.alterandoArquivo.set(true);
    this.api.arquivar(item.id, this.motivoArquivamentoTexto.trim()).subscribe({
      next: atual => {
        this.acompanhamento.set(atual);
        this.alterandoArquivo.set(false);
        this.motivoArquivamentoTexto = '';
        this.fecharConfirmacaoArquivo();
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
    if (!item || !this.canArchive() || !this.motivoArquivamentoTexto.trim()) return;

    this.alterandoArquivo.set(true);
    this.api.desarquivar(item.id, this.motivoArquivamentoTexto.trim()).subscribe({
      next: atual => {
        this.acompanhamento.set(atual);
        this.alterandoArquivo.set(false);
        this.motivoArquivamentoTexto = '';
        this.fecharConfirmacaoArquivo();
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

  solicitarConfirmacaoArquivo(acao: 'arquivar' | 'desarquivar', event: Event): void {
    this.ultimoBotaoConfirmacao = event.currentTarget as HTMLElement;
    this.confirmacaoArquivo.set(acao);
    window.setTimeout(() => this.confirmacaoDialog?.nativeElement.focus());
  }

  fecharConfirmacaoArquivo(): void {
    this.confirmacaoArquivo.set(null);
    this.motivoArquivamentoTexto = '';
    window.setTimeout(() => this.ultimoBotaoConfirmacao?.focus());
  }

  /** Trap de teclado reutilizável para todos os dialogs da página. */
  onDialogKeydown(event: KeyboardEvent, dialog: 'confirmacao' | 'assunto' | 'finalizacao'): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      if (dialog === 'confirmacao' && !this.alterandoArquivo()) this.fecharConfirmacaoArquivo();
      if (dialog === 'assunto') this.fecharModalAssunto();
      if (dialog === 'finalizacao') this.fecharModalFinalizacao();
      return;
    }

    if (event.key !== 'Tab') return;

    const root = event.currentTarget as HTMLElement;
    const focusable = Array.from(root.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ));
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (document.activeElement === root) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
      return;
    }
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
      return;
    }
    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  /** Mantido para o dialog de confirmação que usa (keydown) separado. */
  onConfirmacaoKeydown(event: KeyboardEvent): void {
    this.onDialogKeydown(event, 'confirmacao');
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.alterandoAssunto && !this.salvandoAssunto()) { this.fecharModalAssunto(); return; }
    if (this.finalizando && !this.finalizandoAcompanhamento()) { this.fecharModalFinalizacao(); return; }
    if (this.confirmacaoArquivo() && !this.alterandoArquivo()) this.fecharConfirmacaoArquivo();
  }

  private canMutate(item: AcompanhamentoIndividual): boolean {
    const user = this.authService.getUser();
    if (user?.role === 'ADMIN') return true;
    return user?.role === 'PROFESSOR' && item.professorId === user.sub;
  }
}
