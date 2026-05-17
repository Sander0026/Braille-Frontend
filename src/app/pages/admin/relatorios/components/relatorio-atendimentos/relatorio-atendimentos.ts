import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RelatorioAtendimentosResponse } from '../../../../../core/services/relatorios.service';

@Component({
  selector: 'app-relatorio-atendimentos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './relatorio-atendimentos.html',
  styleUrl: './relatorio-atendimentos.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelatorioAtendimentos {
  @Input() relatorio: RelatorioAtendimentosResponse | null = null;
  @Input() carregando = false;

  formatarData(value?: string | null): string {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('pt-BR');
  }

  formatarEnum(value?: string | null): string {
    if (!value) return '-';
    return value
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  formatarHorario(minutos?: number | null): string {
    if (minutos === null || minutos === undefined) return '-';
    const horas = Math.floor(minutos / 60)
      .toString()
      .padStart(2, '0');
    const mins = (minutos % 60).toString().padStart(2, '0');
    return `${horas}:${mins}`;
  }
}
