import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import {
  RelatorioAlunoItem,
  RelatorioAlunosDistribuicoes,
  RelatorioAlunosListaResponse,
  RelatorioAlunosResumo,
  RelatorioRankingItem,
} from '../../../../../core/services/relatorios.service';

@Component({
  selector: 'app-relatorio-alunos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './relatorio-alunos.html',
  styleUrl: './relatorio-alunos.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelatorioAlunos {
  @Input() resumo: RelatorioAlunosResumo | null = null;
  @Input() distribuicoes: RelatorioAlunosDistribuicoes | null = null;
  @Input() lista: RelatorioAlunosListaResponse | null = null;
  @Input() carregando = false;
  @Input() carregandoLista = false;
  @Input() listaAberta = false;

  @Output() abrirLista = new EventEmitter<void>();
  @Output() verMais = new EventEmitter<void>();

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

  possuiLaudo(aluno: RelatorioAlunoItem): boolean {
    return aluno.possuiLaudo || Boolean(aluno.laudoUrl);
  }

  simNao(value: boolean): string {
    return value ? 'Sim' : 'Não';
  }

  ranking(items?: RelatorioRankingItem[] | null): RelatorioRankingItem[] {
    return items ?? [];
  }

  podeVerMais(): boolean {
    const meta = this.lista?.meta;
    return Boolean(meta && meta.page < meta.lastPage);
  }

  totalCarregado(): number {
    return this.lista?.data.length ?? 0;
  }
}
