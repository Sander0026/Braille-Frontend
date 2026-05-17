import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  MatriculaStatusRelatorio,
  MotivoEncerramentoMatricula,
  RelatorioEvasoesResponse,
  RelatorioRiscoEvasaoItem,
  RelatorioRiscoEvasaoResponse,
  StatusAcaoRiscoEvasao,
  TipoAcaoRiscoEvasao,
} from '../../../../../core/services/relatorios.service';
import { RiscoEvasaoService, AcaoRiscoEvasao } from '../../../../../core/services/risco-evasao.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { Usuario, UsuariosService } from '../../../../../core/services/usuarios.service';

type AcaoRiscoForm = {
  tipoAcao: TipoAcaoRiscoEvasao;
  motivoRisco: string;
  responsavelId: string;
  prazo: string;
  descricao: string;
};

type ResolverAcaoForm = {
  resultado: string;
};

@Component({
  selector: 'app-relatorio-evasoes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './relatorio-evasoes.html',
  styleUrl: './relatorio-evasoes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelatorioEvasoes {
  private readonly riscoEvasaoService = inject(RiscoEvasaoService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  @Input() relatorio: RelatorioEvasoesResponse | null = null;
  @Input() risco: RelatorioRiscoEvasaoResponse | null = null;
  @Input() carregando = false;
  @Output() acaoRiscoAtualizada = new EventEmitter<void>();

  readonly itemCriacaoAcao = signal<RelatorioRiscoEvasaoItem | null>(null);
  readonly acaoDetalhe = signal<AcaoRiscoEvasao | null>(null);
  readonly acaoResolucao = signal<RelatorioRiscoEvasaoItem | null>(null);
  readonly responsaveis = signal<Usuario[]>([]);
  readonly carregandoAcao = signal(false);
  readonly salvandoAcao = signal(false);
  readonly erroAcao = signal('');

  readonly tiposAcao: Array<{ value: TipoAcaoRiscoEvasao; label: string }> = [
    { value: 'CONTATO_TELEFONICO', label: 'Contato telefônico' },
    { value: 'WHATSAPP', label: 'WhatsApp' },
    { value: 'REUNIAO_PRESENCIAL', label: 'Reunião presencial' },
    { value: 'ENCAMINHAMENTO_ASSISTENCIAL', label: 'Encaminhamento assistencial' },
    { value: 'AJUSTE_DE_HORARIO', label: 'Ajuste de horário' },
    { value: 'TRANSFERENCIA_DE_TURMA', label: 'Transferência de turma' },
    { value: 'JUSTIFICATIVA_DE_FALTA', label: 'Justificativa de falta' },
    { value: 'VISITA_DOMICILIAR', label: 'Visita domiciliar' },
    { value: 'OUTRO', label: 'Outro' },
  ];

  formAcao: AcaoRiscoForm = this.criarFormAcaoVazio();
  formResolucao: ResolverAcaoForm = { resultado: '' };

  grupoEntries(grupo?: Record<string, number>): Array<{ label: string; total: number }> {
    return Object.entries(grupo ?? {})
      .map(([label, total]) => ({ label, total }))
      .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label));
  }

  rankingTurmas(): Array<{ label: string; total: number }> {
    return (this.relatorio?.indicadores.rankingTurmas ?? []).map((item) => ({
      label: item.nome,
      total: item.total,
    }));
  }

  larguraBarra(total: number, grupo?: Record<string, number>): string {
    const maior = Math.max(...Object.values(grupo ?? {}), 0);
    if (!maior) return '0%';
    return `${Math.max(8, (total / maior) * 100)}%`;
  }

  larguraRanking(total: number): string {
    const maior = Math.max(...(this.relatorio?.indicadores.rankingTurmas ?? []).map((item) => item.total), 0);
    if (!maior) return '0%';
    return `${Math.max(8, (total / maior) * 100)}%`;
  }

  formatarData(value?: string | null): string {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('pt-BR');
  }

  formatarMes(value: string): string {
    if (!/^\d{4}-\d{2}$/.test(value)) return value;
    const date = new Date(`${value}-01T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' }).format(date);
  }

  formatarDias(value?: number | null): string {
    if (value === null || value === undefined) return '-';
    const formatado = value.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
    return `${formatado} dia${value === 1 ? '' : 's'}`;
  }

  formatarPercentual(value?: number | null): string {
    if (value === null || value === undefined) return '-';
    return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
  }

  nivelRiscoLabel(nivel: string): string {
    const labels: Record<string, string> = {
      ALTO: 'Alto',
      MEDIO: 'Médio',
      BAIXO: 'Baixo',
    };
    return labels[nivel] ?? nivel;
  }

  statusAcaoLabel(status?: string | null): string {
    const labels: Record<StatusAcaoRiscoEvasao, string> = {
      PENDENTE: 'Pendente',
      EM_ANDAMENTO: 'Em andamento',
      RESOLVIDA: 'Resolvida',
      SEM_CONTATO: 'Sem contato',
      CANCELADA: 'Cancelada',
    };
    return status ? (labels[status as StatusAcaoRiscoEvasao] ?? status) : '-';
  }

  tipoAcaoLabel(tipo?: string | null): string {
    return this.tiposAcao.find((item) => item.value === tipo)?.label ?? tipo ?? '-';
  }

  abrirCriarAcao(item: RelatorioRiscoEvasaoItem): void {
    this.erroAcao.set('');
    this.itemCriacaoAcao.set(item);
    this.formAcao = {
      tipoAcao: 'CONTATO_TELEFONICO',
      motivoRisco: item.criterios[0] ?? 'Risco de evasão',
      responsavelId: '',
      prazo: this.dataPadraoPrazo(),
      descricao: item.criterios.join('; '),
    };
    this.carregarResponsaveis();
  }

  fecharCriarAcao(): void {
    this.itemCriacaoAcao.set(null);
    this.formAcao = this.criarFormAcaoVazio();
    this.erroAcao.set('');
  }

  salvarCriarAcao(): void {
    const item = this.itemCriacaoAcao();
    if (!item || this.salvandoAcao()) return;
    if (!this.formAcao.motivoRisco.trim()) {
      this.erroAcao.set('Informe o motivo do risco.');
      return;
    }

    this.salvandoAcao.set(true);
    this.riscoEvasaoService
      .criar({
        alunoId: item.alunoId,
        turmaId: item.turmaId,
        nivel: item.nivel,
        tipoAcao: this.formAcao.tipoAcao,
        motivoRisco: this.formAcao.motivoRisco,
        responsavelId: this.formAcao.responsavelId,
        prazo: this.formAcao.prazo,
        descricao: this.formAcao.descricao,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.sucesso('Ação de intervenção criada.');
          this.salvandoAcao.set(false);
          this.fecharCriarAcao();
          this.acaoRiscoAtualizada.emit();
        },
        error: (err) => {
          this.erroAcao.set(err?.error?.message || 'Não foi possível criar a ação.');
          this.toast.erro(this.erroAcao());
          this.salvandoAcao.set(false);
        },
      });
  }

  abrirVerAcao(item: RelatorioRiscoEvasaoItem): void {
    if (!item.acaoAberta?.id) return;
    this.carregandoAcao.set(true);
    this.erroAcao.set('');
    this.riscoEvasaoService
      .buscar(item.acaoAberta.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (acao) => {
          this.acaoDetalhe.set(acao);
          this.carregandoAcao.set(false);
        },
        error: () => {
          this.toast.erro('Não foi possível carregar a ação.');
          this.carregandoAcao.set(false);
        },
      });
  }

  fecharVerAcao(): void {
    this.acaoDetalhe.set(null);
  }

  abrirResolverAcao(item: RelatorioRiscoEvasaoItem): void {
    if (!item.acaoAberta?.id) return;
    this.acaoResolucao.set(item);
    this.formResolucao = { resultado: '' };
    this.erroAcao.set('');
  }

  fecharResolverAcao(): void {
    this.acaoResolucao.set(null);
    this.formResolucao = { resultado: '' };
    this.erroAcao.set('');
  }

  resolverAcao(): void {
    const item = this.acaoResolucao();
    if (!item?.acaoAberta?.id || this.salvandoAcao()) return;
    if (!this.formResolucao.resultado.trim()) {
      this.erroAcao.set('Informe o resultado da intervenção.');
      return;
    }

    this.salvandoAcao.set(true);
    this.riscoEvasaoService
      .atualizarStatus(item.acaoAberta.id, 'RESOLVIDA', this.formResolucao.resultado)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.sucesso('Ação marcada como resolvida.');
          this.salvandoAcao.set(false);
          this.fecharResolverAcao();
          this.acaoRiscoAtualizada.emit();
        },
        error: (err) => {
          this.erroAcao.set(err?.error?.message || 'Não foi possível resolver a ação.');
          this.toast.erro(this.erroAcao());
          this.salvandoAcao.set(false);
        },
      });
  }

  private carregarResponsaveis(): void {
    if (this.responsaveis().length) return;
    this.usuariosService
      .listarResumo(1, 100)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => this.responsaveis.set(res.data ?? []),
        error: () => this.responsaveis.set([]),
      });
  }

  private criarFormAcaoVazio(): AcaoRiscoForm {
    return {
      tipoAcao: 'CONTATO_TELEFONICO',
      motivoRisco: '',
      responsavelId: '',
      prazo: '',
      descricao: '',
    };
  }

  private dataPadraoPrazo(): string {
    const date = new Date();
    date.setDate(date.getDate() + 2);
    return date.toISOString().slice(0, 10);
  }

  formatarResumoAtendimento(item: RelatorioEvasoesResponse['data'][number]): string {
    const resumo = item.atendimentosIndividuais;
    if (!resumo.possuiAtendimento) return 'Sem acompanhamento';
    return `${resumo.totalAtendimentos} atendimento${resumo.totalAtendimentos === 1 ? '' : 's'}`;
  }

  formatarResumoAcompanhamento(item: RelatorioEvasoesResponse['data'][number]): string {
    const resumo = item.atendimentosIndividuais;
    if (!resumo.acompanhamentosTotal) return '-';
    const partes = [
      resumo.acompanhamentosEmAndamento ? `${resumo.acompanhamentosEmAndamento} em andamento` : null,
      resumo.acompanhamentosFinalizados ? `${resumo.acompanhamentosFinalizados} finalizado(s)` : null,
      resumo.acompanhamentosArquivados ? `${resumo.acompanhamentosArquivados} arquivado(s)` : null,
    ].filter(Boolean);
    return partes.join(', ') || `${resumo.acompanhamentosTotal} acompanhamento(s)`;
  }

  formatarFaltasAtendimento(item: RelatorioEvasoesResponse['data'][number]): string {
    const resumo = item.atendimentosIndividuais;
    const total = resumo.faltasJustificadas + resumo.faltasNaoJustificadas;
    if (!total) return '-';
    return `${total} falta${total === 1 ? '' : 's'}`;
  }

  statusLabel(status: MatriculaStatusRelatorio): string {
    const labels: Record<MatriculaStatusRelatorio, string> = {
      ATIVA: 'Ativa',
      CONCLUIDA: 'Concluída',
      EVADIDA: 'Evadida',
      CANCELADA: 'Cancelada',
      TRANSFERIDA: 'Transferida',
    };
    return labels[status] ?? status;
  }

  motivoLabel(motivo?: MotivoEncerramentoMatricula | null): string {
    const labels: Record<MotivoEncerramentoMatricula, string> = {
      CONCLUSAO: 'Conclusão',
      EVASAO_SEM_JUSTIFICATIVA: 'Evasão sem justificativa',
      MUDANCA_DE_TURNO: 'Mudança de turno',
      TRANSFERENCIA_DE_TURMA: 'Transferência de turma',
      MUDANCA_DE_CIDADE: 'Mudança de cidade',
      DIFICULDADE_TRANSPORTE: 'Dificuldade de transporte',
      PROBLEMA_SAUDE: 'Problema de saúde',
      PROBLEMA_FAMILIAR: 'Problema familiar',
      INCOMPATIBILIDADE_HORARIO: 'Incompatibilidade de horário',
      FALTA_DE_CONTATO: 'Falta de contato',
      DESISTENCIA_VOLUNTARIA: 'Desistência voluntária',
      CANCELAMENTO_DA_TURMA: 'Cancelamento da turma',
      OUTRO: 'Outro',
    };
    return motivo ? (labels[motivo] ?? motivo) : '-';
  }

  motivoGrupoLabel(motivo: string): string {
    const motivos: MotivoEncerramentoMatricula[] = [
      'CONCLUSAO',
      'EVASAO_SEM_JUSTIFICATIVA',
      'MUDANCA_DE_TURNO',
      'TRANSFERENCIA_DE_TURMA',
      'MUDANCA_DE_CIDADE',
      'DIFICULDADE_TRANSPORTE',
      'PROBLEMA_SAUDE',
      'PROBLEMA_FAMILIAR',
      'INCOMPATIBILIDADE_HORARIO',
      'FALTA_DE_CONTATO',
      'DESISTENCIA_VOLUNTARIA',
      'CANCELAMENTO_DA_TURMA',
      'OUTRO',
    ];
    return motivos.includes(motivo as MotivoEncerramentoMatricula)
      ? this.motivoLabel(motivo as MotivoEncerramentoMatricula)
      : motivo;
  }

  statusClass(status: MatriculaStatusRelatorio): string {
    const classes: Record<MatriculaStatusRelatorio, string> = {
      ATIVA: 'badge-success',
      CONCLUIDA: 'badge-success',
      EVADIDA: 'badge-danger',
      CANCELADA: 'badge-muted',
      TRANSFERIDA: 'badge-warning',
    };
    return classes[status] ?? 'badge-muted';
  }
}
