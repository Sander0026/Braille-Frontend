import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  MatriculaStatusRelatorio,
  MotivoEncerramentoMatricula,
  RelatorioEvasoesResponse,
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
  @Input() carregando = false;

  formatarData(value?: string | null): string {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('pt-BR');
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
