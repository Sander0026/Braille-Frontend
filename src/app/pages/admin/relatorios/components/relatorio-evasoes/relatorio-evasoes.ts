import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  MatriculaStatusRelatorio,
  MotivoEncerramentoMatricula,
  RelatorioEvasoesResponse,
  RelatorioRiscoEvasaoResponse,
} from '../../../../../core/services/relatorios.service';

@Component({
  selector: 'app-relatorio-evasoes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './relatorio-evasoes.html',
  styleUrl: './relatorio-evasoes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelatorioEvasoes {
  @Input() relatorio: RelatorioEvasoesResponse | null = null;
  @Input() risco: RelatorioRiscoEvasaoResponse | null = null;
  @Input() carregando = false;

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
