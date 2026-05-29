import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { RelatorioTurmasResponse, TurmaStatusRelatorio } from '../../../../../core/services/relatorios.service';

@Component({
  selector: 'app-relatorio-turmas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './relatorio-turmas.html',
  styleUrl: './relatorio-turmas.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelatorioTurmas {
  @Input() relatorio: RelatorioTurmasResponse | null = null;
  @Input() carregando = false;
  @Input() exportandoPdf = false;
  @Input() exportandoId: string | null = null;
  @Output() baixarPdf = new EventEmitter<void>();
  @Output() baixarPdfTurma = new EventEmitter<string>();

  formatarData(value?: string | null): string {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('pt-BR');
  }

  statusLabel(status: TurmaStatusRelatorio): string {
    const labels: Record<TurmaStatusRelatorio, string> = {
      PREVISTA: 'Prevista',
      ANDAMENTO: 'Em andamento',
      CONCLUIDA: 'Concluída',
      CANCELADA: 'Cancelada',
    };
    return labels[status] ?? status;
  }

  statusClass(status: TurmaStatusRelatorio): string {
    const classes: Record<TurmaStatusRelatorio, string> = {
      PREVISTA: 'badge-warning',
      ANDAMENTO: 'badge-info',
      CONCLUIDA: 'badge-success',
      CANCELADA: 'badge-danger',
    };
    return classes[status] ?? 'badge-muted';
  }

  formatarPercentual(value: number): string {
    return `${value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}%`;
  }
}
