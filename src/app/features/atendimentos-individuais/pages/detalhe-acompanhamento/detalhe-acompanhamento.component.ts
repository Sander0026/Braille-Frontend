import { Component, ElementRef, HostListener, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AtendimentosIndividuaisApiService } from '../../services/atendimentos-individuais-api.service';
import { RelatorioAtendimentoApiService } from '../../services/relatorio-atendimento-api.service';
import { AcompanhamentoIndividual } from '../../models/acompanhamento-individual.model';
import { StatusAcompanhamentoBadgeComponent } from '../../components/status-acompanhamento-badge/status-acompanhamento-badge.component';
import { TimelineAtendimentosComponent } from '../../components/timeline-atendimentos/timeline-atendimentos.component';
import { ResumoAtendimentosComponent } from '../../components/resumo-atendimentos/resumo-atendimentos.component';
import { AlunoAutocompleteComponent } from '../../components/aluno-autocomplete/aluno-autocomplete.component';
import { calcularResumoAtendimentos } from '../../utils/calcular-resumo-atendimentos.util';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmDialogService } from '../../../../core/services/confirm-dialog.service';
import { BeneficiarioResumo, BeneficiariosService } from '../../../../core/services/beneficiarios.service';
import { Usuario, UsuariosService } from '../../../../core/services/usuarios.service';
import { ComponenteComDescarte } from '../../../../core/interfaces/componente-com-descarte.interface';

@Component({
  selector: 'app-detalhe-acompanhamento',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    StatusAcompanhamentoBadgeComponent,
    TimelineAtendimentosComponent,
    ResumoAtendimentosComponent,
    AlunoAutocompleteComponent,
  ],
  templateUrl: './detalhe-acompanhamento.component.html',
  styleUrl: './detalhe-acompanhamento.component.scss',
})
export class DetalheAcompanhamentoComponent implements OnInit, ComponenteComDescarte {
  private readonly route            = inject(ActivatedRoute);
  private readonly api              = inject(AtendimentosIndividuaisApiService);
  private readonly relatorioApi     = inject(RelatorioAtendimentoApiService);
  private readonly authService      = inject(AuthService);
  private readonly toast            = inject(ToastService);
  private readonly confirmDialog    = inject(ConfirmDialogService);
  private readonly beneficiariosService = inject(BeneficiariosService);
  private readonly usuariosService  = inject(UsuariosService);

  // ── Signals ──────────────────────────────────────────────
  readonly acompanhamento = signal<AcompanhamentoIndividual | null>(null);
  readonly resumo = computed(() => calcularResumoAtendimentos(this.acompanhamento()?.atendimentos ?? []));
  readonly carregando              = signal(true);
  readonly erro                    = signal('');
  readonly salvandoAssunto         = signal(false);
  readonly finalizandoAcompanhamento = signal(false);
  readonly alterandoArquivo        = signal(false);
  readonly confirmacaoArquivo      = signal<'arquivar' | 'desarquivar' | null>(null);
  readonly alunos                  = signal<BeneficiarioResumo[]>([]);
  readonly alunoSelecionado        = signal<BeneficiarioResumo | null>(null);
  readonly professores             = signal<Usuario[]>([]);

  // ── ViewChild refs ────────────────────────────────────────
  @ViewChild('confirmacaoDialog')    private confirmacaoDialog?:    ElementRef<HTMLElement>;
  @ViewChild('assuntoDialog')        private assuntoDialog?:        ElementRef<HTMLElement>;
  @ViewChild('assuntoPrimeiroFoco')  private assuntoPrimeiroFoco?:  ElementRef<HTMLElement>;
  @ViewChild('finalizacaoDialog')    private finalizacaoDialog?:    ElementRef<HTMLElement>;
  @ViewChild('finalizacaoPrimeiroFoco') private finalizacaoPrimeiroFoco?: ElementRef<HTMLElement>;
  @ViewChild('relatorioDialog')      private relatorioDialog?:      ElementRef<HTMLElement>;
  @ViewChild('relatorioPrimeiroFoco') private relatorioPrimeiroFoco?: ElementRef<HTMLElement>;

  private ultimoBotaoConfirmacao: HTMLElement | null = null;
  private ultimoBotaoAssunto:     HTMLElement | null = null;
  private ultimoBotaoFinalizacao: HTMLElement | null = null;
  private ultimoBotaoRelatorio:   HTMLElement | null = null;

  // ── Estado dos modais ─────────────────────────────────────
  alterandoAssunto   = false;
  finalizando        = false;
  exibindoRelatorio  = false;

  novoAssunto         = '';
  private assuntoOriginal = '';
  motivoAlteracao     = '';
  resultadoFinal      = '';
  resumoFinal         = '';
  motivoArquivamentoTexto = '';

  buscandoAlunos       = false;
  exportandoPdfRelatorio = false;
  readonly isProfessor = this.authService.getUser()?.role === 'PROFESSOR';

  filtrosRelatorio = { alunoId: '', professorId: '', dataInicio: '', dataFim: '', status: '', tipoRegistro: '' };

  // ── Ciclo de vida ─────────────────────────────────────────
  ngOnInit(): void {
    this.carregar();
    if (!this.isProfessor) {
      this.usuariosService.listarResumo(1, 100, undefined, 'PROFESSOR').subscribe({
        next: res => this.professores.set(res.data),
      });
    }
  }

  carregar(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.carregando.set(true);
    this.erro.set('');
    this.api.buscar(id).subscribe({
      next: item => { this.acompanhamento.set(item); this.carregando.set(false); },
      error: () => { this.carregando.set(false); this.erro.set('Nao foi possivel carregar este acompanhamento.'); },
    });
  }

  // ── ASSUNTO ───────────────────────────────────────────────
  abrirModalAssunto(assuntoAtual: string, event: Event): void {
    this.ultimoBotaoAssunto = event.currentTarget as HTMLElement;
    this.assuntoOriginal    = assuntoAtual;
    this.novoAssunto        = assuntoAtual;
    this.motivoAlteracao    = '';
    this.alterandoAssunto   = true;
    window.setTimeout(() => this.assuntoPrimeiroFoco?.nativeElement.focus());
  }

  async fecharModalAssunto(): Promise<void> {
    if (this.salvandoAssunto()) return;
    if (this.temAlteracoesAssunto() && !(await this.confirmarDescarte())) return;
    this.alterandoAssunto = false;
    window.setTimeout(() => this.ultimoBotaoAssunto?.focus());
  }

  salvarAssunto(): void {
    const item = this.acompanhamento();
    if (!item || !this.novoAssunto.trim() || !this.motivoAlteracao.trim()) return;
    this.salvandoAssunto.set(true);
    this.api.atualizarAssunto(item.id, { assuntoAtual: this.novoAssunto, motivoAlteracao: this.motivoAlteracao }).subscribe({
      next: atual => {
        this.acompanhamento.set(atual);
        this.alterandoAssunto = false;
        this.salvandoAssunto.set(false);
        window.setTimeout(() => this.ultimoBotaoAssunto?.focus());
        this.toast.sucesso('Assunto atualizado com sucesso.');
      },
      error: () => { this.salvandoAssunto.set(false); this.toast.erro('Nao foi possivel atualizar o assunto.'); },
    });
  }

  temAlteracoesAssunto(): boolean {
    return this.novoAssunto !== this.assuntoOriginal || this.motivoAlteracao.trim() !== '';
  }

  // ── FINALIZAÇÃO ───────────────────────────────────────────
  abrirModalFinalizacao(event: Event): void {
    this.ultimoBotaoFinalizacao = event.currentTarget as HTMLElement;
    this.resultadoFinal = '';
    this.resumoFinal    = '';
    this.finalizando    = true;
    window.setTimeout(() => this.finalizacaoPrimeiroFoco?.nativeElement.focus());
  }

  async fecharModalFinalizacao(): Promise<void> {
    if (this.finalizandoAcompanhamento()) return;
    if (this.temAlteracoesFinalizacao() && !(await this.confirmarDescarte())) return;
    this.finalizando = false;
    window.setTimeout(() => this.ultimoBotaoFinalizacao?.focus());
  }

  finalizar(): void {
    const item = this.acompanhamento();
    if (!item || !this.resultadoFinal.trim()) return;
    this.finalizandoAcompanhamento.set(true);
    this.api.finalizar(item.id, { resultadoFinal: this.resultadoFinal || undefined, resumoFinal: this.resumoFinal || undefined }).subscribe({
      next: atual => {
        this.acompanhamento.set(atual);
        this.finalizando = false;
        this.finalizandoAcompanhamento.set(false);
        window.setTimeout(() => this.ultimoBotaoFinalizacao?.focus());
        this.toast.sucesso('Acompanhamento finalizado com sucesso.');
      },
      error: () => { this.finalizandoAcompanhamento.set(false); this.toast.erro('Nao foi possivel finalizar o acompanhamento.'); },
    });
  }

  temAlteracoesFinalizacao(): boolean {
    return this.resultadoFinal.trim() !== '' || this.resumoFinal.trim() !== '';
  }

  // ── ARQUIVAMENTO ──────────────────────────────────────────
  solicitarConfirmacaoArquivo(acao: 'arquivar' | 'desarquivar', event: Event): void {
    this.ultimoBotaoConfirmacao    = event.currentTarget as HTMLElement;
    this.motivoArquivamentoTexto   = '';
    this.confirmacaoArquivo.set(acao);
    window.setTimeout(() => this.confirmacaoDialog?.nativeElement.focus());
  }

  async fecharConfirmacaoArquivo(forcado = false): Promise<void> {
    if (this.alterandoArquivo()) return;
    if (!forcado && this.motivoArquivamentoTexto.trim() && !(await this.confirmarDescarte())) return;
    this.confirmacaoArquivo.set(null);
    this.motivoArquivamentoTexto = '';
    window.setTimeout(() => this.ultimoBotaoConfirmacao?.focus());
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
        this.fecharConfirmacaoArquivo(true);
        this.toast.sucesso('Acompanhamento arquivado com sucesso.');
      },
      error: () => { this.alterandoArquivo.set(false); this.toast.erro('Nao foi possivel arquivar o acompanhamento.'); },
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
        this.fecharConfirmacaoArquivo(true);
        this.toast.sucesso('Acompanhamento desarquivado com sucesso.');
      },
      error: () => { this.alterandoArquivo.set(false); this.toast.erro('Nao foi possivel desarquivar o acompanhamento.'); },
    });
  }

  // ── RELATÓRIO ─────────────────────────────────────────────
  abrirModalRelatorio(event: Event): void {
    this.ultimoBotaoRelatorio  = event.currentTarget as HTMLElement;
    this.filtrosRelatorio      = { alunoId: '', professorId: '', dataInicio: '', dataFim: '', status: '', tipoRegistro: '' };
    this.alunoSelecionado.set(null);
    this.alunos.set([]);
    this.exibindoRelatorio     = true;
    window.setTimeout(() => this.relatorioPrimeiroFoco?.nativeElement.focus());
  }

  async fecharModalRelatorio(): Promise<void> {
    if (this.exportandoPdfRelatorio) return;
    if (this.temAlteracoesRelatorio() && !(await this.confirmarDescarte())) return;
    this.exibindoRelatorio = false;
    window.setTimeout(() => this.ultimoBotaoRelatorio?.focus());
  }

  selecionarAlunoRelatorio(aluno: BeneficiarioResumo | null): void {
    this.alunoSelecionado.set(aluno);
    this.filtrosRelatorio.alunoId = aluno?.id ?? '';
  }

  buscarAlunos(termo: string): void {
    this.buscandoAlunos = true;
    this.beneficiariosService.buscarResumo(termo).subscribe({
      next: alunos => { this.alunos.set(alunos); this.buscandoAlunos = false; },
      error: () => { this.buscandoAlunos = false; this.toast.erro('Nao foi possivel buscar alunos.'); },
    });
  }

  exportarPdfRelatorio(): void {
    if (!this.validarPeriodoRelatorio() || this.exportandoPdfRelatorio) return;
    this.exportandoPdfRelatorio = true;
    this.relatorioApi.exportarPdf({
      alunoId:      this.filtrosRelatorio.alunoId || undefined,
      professorId:  this.filtrosRelatorio.professorId || undefined,
      dataInicio:   this.filtrosRelatorio.dataInicio || undefined,
      dataFim:      this.filtrosRelatorio.dataFim || undefined,
      status:       (this.filtrosRelatorio.status as any) || undefined,
      tipoRegistro: (this.filtrosRelatorio.tipoRegistro as any) || undefined,
    }).subscribe({
      next: blob => {
        const url  = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `relatorio-atendimento-${new Date().toISOString().slice(0, 10)}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
        this.exportandoPdfRelatorio = false;
        this.exibindoRelatorio = false;
        window.setTimeout(() => this.ultimoBotaoRelatorio?.focus());
        this.toast.sucesso('Relatorio exportado com sucesso.');
      },
      error: () => { this.exportandoPdfRelatorio = false; this.toast.erro('Nao foi possivel exportar o PDF.'); },
    });
  }

  temAlteracoesRelatorio(): boolean {
    return Object.values(this.filtrosRelatorio).some(v => v !== '') || this.alunoSelecionado() !== null;
  }

  private validarPeriodoRelatorio(): boolean {
    if (this.filtrosRelatorio.dataInicio && this.filtrosRelatorio.dataFim &&
        this.filtrosRelatorio.dataInicio > this.filtrosRelatorio.dataFim) {
      this.toast.erro('A data inicial deve ser menor ou igual a data final.');
      return false;
    }
    return true;
  }

  // ── PERMISSÕES ────────────────────────────────────────────
  canCreateAtendimento(item: AcompanhamentoIndividual): boolean { return item.status === 'EM_ANDAMENTO' && this.canMutate(item); }
  canUpdateSubject(item: AcompanhamentoIndividual): boolean     { return item.status === 'EM_ANDAMENTO' && this.canMutate(item); }
  canFinish(item: AcompanhamentoIndividual): boolean            { return item.status === 'EM_ANDAMENTO' && this.canMutate(item); }
  canArchive(): boolean { return this.authService.getUser()?.role === 'ADMIN'; }

  // ── ACESSIBILIDADE ────────────────────────────────────────
  onConfirmacaoKeydown(event: KeyboardEvent): void { this.onDialogKeydown(event, 'confirmacao'); }

  onDialogKeydown(event: KeyboardEvent, modal: 'confirmacao' | 'assunto' | 'finalizacao' | 'relatorio'): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      if (modal === 'confirmacao') this.fecharConfirmacaoArquivo();
      if (modal === 'assunto')     this.fecharModalAssunto();
      if (modal === 'finalizacao') this.fecharModalFinalizacao();
      if (modal === 'relatorio')   this.fecharModalRelatorio();
      return;
    }
    if (event.key !== 'Tab') return;
    this.trapFocus(event);
  }

  private trapFocus(event: KeyboardEvent): void {
    const root = event.currentTarget as HTMLElement;
    const sel  = 'button:not([disabled]),[href],input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';
    const focusable = Array.from(root.querySelectorAll<HTMLElement>(sel));
    if (!focusable.length) return;
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (document.activeElement === root)           { event.preventDefault(); (event.shiftKey ? last : first).focus(); return; }
    if (event.shiftKey  && document.activeElement === first) { event.preventDefault(); last.focus();  return; }
    if (!event.shiftKey && document.activeElement === last)  { event.preventDefault(); first.focus(); }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.exibindoRelatorio && !this.exportandoPdfRelatorio) { this.fecharModalRelatorio();   return; }
    if (this.alterandoAssunto  && !this.salvandoAssunto())      { this.fecharModalAssunto();     return; }
    if (this.finalizando       && !this.finalizandoAcompanhamento()) { this.fecharModalFinalizacao(); return; }
    if (this.confirmacaoArquivo() && !this.alterandoArquivo())  { this.fecharConfirmacaoArquivo(); }
  }

  // ── DESCARTE (descarteGuard) ──────────────────────────────
  async podeDescartar(): Promise<boolean> {
    const temAlteracao =
      (this.alterandoAssunto   && this.temAlteracoesAssunto()) ||
      (this.finalizando        && this.temAlteracoesFinalizacao()) ||
      (this.exibindoRelatorio  && this.temAlteracoesRelatorio()) ||
      (!!this.confirmacaoArquivo() && this.motivoArquivamentoTexto.trim() !== '');
    return temAlteracao ? this.confirmarDescarte() : true;
  }

  private confirmarDescarte(): Promise<boolean> {
    return this.confirmDialog.confirmar({
      titulo: 'Descartar alterações?',
      mensagem: 'Existem alterações não salvas. Deseja realmente sair e descartar as informações preenchidas?',
      textoBotaoConfirmar: 'Descartar alterações',
      textoBotaoCancelar: 'Continuar editando',
      tipo: 'warning',
    });
  }

  private canMutate(item: AcompanhamentoIndividual): boolean {
    const user = this.authService.getUser();
    if (user?.role === 'ADMIN') return true;
    return user?.role === 'PROFESSOR' && item.professorId === user.sub;
  }
}
