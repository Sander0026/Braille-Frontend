import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RelatorioAlunosResponse } from '../../../../../core/services/relatorios.service';

@Component({
  selector: 'app-relatorio-alunos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './relatorio-alunos.html',
  styleUrl: './relatorio-alunos.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelatorioAlunos {
  @Input() relatorio: RelatorioAlunosResponse | null = null;
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

  possuiLaudo(aluno: RelatorioAlunosResponse['data'][number]): boolean {
    return aluno.possuiLaudo || Boolean(aluno.laudoUrl);
  }

  simNao(value: boolean): string {
    return value ? 'Sim' : 'Não';
  }

  grupoEntries(grupo: Record<string, number>): Array<{ label: string; total: number }> {
    return Object.entries(grupo)
      .map(([label, total]) => ({ label, total }))
      .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label));
  }
}
