import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { AcompanhamentoIndividual } from '../../../../../features/atendimentos-individuais/models/acompanhamento-individual.model';
import {
  AtendimentoIndividual,
  ModalidadeAtendimentoIndividual,
  TipoRegistroAtendimentoIndividual,
} from '../../../../../features/atendimentos-individuais/models/atendimento-individual.model';
import { RelatorioAtendimentoIndividual } from '../../../../../features/atendimentos-individuais/models/relatorio-atendimento.model';

type RegistroAtendimentoView = {
  atendimento: AtendimentoIndividual;
  acompanhamento: AcompanhamentoIndividual;
};

@Component({
  selector: 'app-relatorio-atendimentos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './relatorio-atendimentos.html',
  styleUrl: './relatorio-atendimentos.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelatorioAtendimentos {
  @Input() relatorio: RelatorioAtendimentoIndividual | null = null;
  @Input() carregando = false;
  @Input() exportandoPdf = false;

  @Output() baixarPdf = new EventEmitter<void>();

  registros(): RegistroAtendimentoView[] {
    return (this.relatorio?.acompanhamentos ?? []).flatMap((acompanhamento) =>
      (acompanhamento.atendimentos ?? []).map((atendimento) => ({ acompanhamento, atendimento })),
    );
  }

  grupoEntries(grupo?: Record<string, number>): Array<{ label: string; total: number }> {
    return Object.entries(grupo ?? {})
      .map(([label, total]) => ({ label, total }))
      .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label));
  }

  larguraBarra(total: number, grupo?: Record<string, number>): string {
    const maior = Math.max(...Object.values(grupo ?? {}), 0);
    if (!maior) return '0%';
    return `${Math.max(8, (total / maior) * 100)}%`;
  }

  larguraRanking(total: number, valores: Array<{ total: number }>): string {
    const maior = Math.max(...valores.map((item) => item.total), 0);
    if (!maior) return '0%';
    return `${Math.max(8, (total / maior) * 100)}%`;
  }

  formatarData(value?: string | null): string {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('pt-BR');
  }

  formatarDuracao(minutos?: number | null): string {
    if (minutos === null || minutos === undefined) return '-';
    if (minutos < 60) return `${minutos} min`;
    const horas = Math.floor(minutos / 60);
    const restante = minutos % 60;
    return restante ? `${horas}h ${restante}min` : `${horas}h`;
  }

  formatarStatus(status?: string | null): string {
    const labels: Record<string, string> = {
      EM_ANDAMENTO: 'Em andamento',
      FINALIZADO: 'Finalizado',
      ARQUIVADO: 'Arquivado',
    };
    return status ? (labels[status] ?? status) : '-';
  }

  formatarTipoRegistro(tipo?: TipoRegistroAtendimentoIndividual | string | null): string {
    const labels: Record<TipoRegistroAtendimentoIndividual, string> = {
      ATENDIMENTO_REALIZADO: 'Atendimento realizado',
      FALTA_JUSTIFICADA: 'Falta justificada',
      FALTA_NAO_JUSTIFICADA: 'Falta não justificada',
      CANCELADO: 'Cancelado',
    };
    return tipo ? (labels[tipo as TipoRegistroAtendimentoIndividual] ?? tipo) : '-';
  }

  formatarModalidade(modalidade?: ModalidadeAtendimentoIndividual | string | null): string {
    const labels: Record<ModalidadeAtendimentoIndividual, string> = {
      PRESENCIAL: 'Presencial',
      REMOTO: 'Remoto',
      TELEFONE: 'Telefone',
      OUTRO: 'Outro',
    };
    return modalidade ? (labels[modalidade as ModalidadeAtendimentoIndividual] ?? modalidade) : '-';
  }

  statusClass(status?: string | null): string {
    const classes: Record<string, string> = {
      EM_ANDAMENTO: 'badge-info',
      FINALIZADO: 'badge-success',
      ARQUIVADO: 'badge-muted',
    };
    return status ? (classes[status] ?? 'badge-muted') : 'badge-muted';
  }

  tipoClass(tipo?: string | null): string {
    const classes: Record<string, string> = {
      ATENDIMENTO_REALIZADO: 'badge-success',
      FALTA_JUSTIFICADA: 'badge-warning',
      FALTA_NAO_JUSTIFICADA: 'badge-danger',
      CANCELADO: 'badge-muted',
    };
    return tipo ? (classes[tipo] ?? 'badge-muted') : 'badge-muted';
  }
}
