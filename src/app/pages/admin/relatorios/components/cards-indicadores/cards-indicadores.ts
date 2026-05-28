import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RelatorioResumo } from '../../../../../core/services/relatorios.service';

interface IndicadorCard {
  label: string;
  valor: number | string;
  icon: string;
  tone: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
}

@Component({
  selector: 'app-cards-indicadores',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cards-indicadores.html',
  styleUrl: './cards-indicadores.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardsIndicadores {
  @Input() resumo: RelatorioResumo | null = null;
  @Input() carregando = false;

  get cards(): IndicadorCard[] {
    if (!this.resumo) return [];
    return [
      { label: 'Alunos', valor: this.resumo.alunos.total, icon: 'groups', tone: 'neutral' },
      { label: 'Ativos', valor: this.resumo.alunos.ativos, icon: 'verified_user', tone: 'success' },
      { label: 'Novos no período', valor: this.resumo.alunos.novosNoPeriodo, icon: 'person_add', tone: 'info' },
      { label: 'Turmas', valor: this.resumo.turmas.total, icon: 'school', tone: 'neutral' },
      { label: 'Em andamento', valor: this.resumo.turmas.andamento, icon: 'play_circle', tone: 'info' },
      { label: 'Concluídas', valor: this.resumo.turmas.concluidas, icon: 'task_alt', tone: 'success' },
      { label: 'Matrículas', valor: this.resumo.matriculas.total, icon: 'assignment_ind', tone: 'neutral' },
      { label: 'Ativas', valor: this.resumo.matriculas.ativas, icon: 'how_to_reg', tone: 'success' },
      { label: 'Evadidas', valor: this.resumo.matriculas.evadidas, icon: 'warning', tone: 'danger' },
      { label: 'Evasão', valor: `${this.resumo.indicadores.taxaEvasao}%`, icon: 'trending_down', tone: 'danger' },
      { label: 'Conclusão', valor: `${this.resumo.indicadores.taxaConclusao}%`, icon: 'workspace_premium', tone: 'success' },
      { label: 'Permanência', valor: `${this.resumo.indicadores.taxaPermanencia}%`, icon: 'timeline', tone: 'warning' },
    ];
  }
}
