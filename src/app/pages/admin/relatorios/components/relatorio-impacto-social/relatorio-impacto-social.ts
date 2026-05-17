import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  RelatorioComparativoItem,
  RelatorioImpactoMetricas,
  RelatorioImpactoSocialResponse,
} from '../../../../../core/services/relatorios.service';

type ImpactoKey = keyof RelatorioImpactoMetricas;

@Component({
  selector: 'app-relatorio-impacto-social',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './relatorio-impacto-social.html',
  styleUrl: './relatorio-impacto-social.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelatorioImpactoSocial {
  @Input() relatorio: RelatorioImpactoSocialResponse | null = null;
  @Input() carregando = false;

  readonly metricas: Array<{ key: ImpactoKey; label: string; icon: string; percentual?: boolean }> = [
    { key: 'totalAlunosAtendidos', label: 'Alunos atendidos', icon: 'groups' },
    { key: 'totalAtendimentosIndividuais', label: 'Atendimentos individuais', icon: 'clinical_notes' },
    { key: 'totalTurmasOfertadas', label: 'Turmas ofertadas', icon: 'school' },
    { key: 'totalCertificadosEmitidos', label: 'Certificados emitidos', icon: 'workspace_premium' },
    { key: 'totalAlunosDeficienciaVisualAtendidos', label: 'Alunos com deficiência visual', icon: 'visibility' },
    { key: 'totalCidadesAlcancadas', label: 'Cidades alcançadas', icon: 'location_city' },
    { key: 'totalBairrosAlcancados', label: 'Bairros alcançados', icon: 'map' },
    { key: 'taxaPermanencia', label: 'Taxa de permanência', icon: 'timeline', percentual: true },
    { key: 'taxaConclusao', label: 'Taxa de conclusão', icon: 'task_alt', percentual: true },
  ];

  valor(key: ImpactoKey): string {
    if (!this.relatorio) return '-';
    const valor = this.relatorio.metricas[key];
    const metrica = this.metricas.find((item) => item.key === key);
    return metrica?.percentual ? `${this.numero(valor)}%` : this.numero(valor);
  }

  comparativo(key: ImpactoKey): RelatorioComparativoItem | null {
    return this.relatorio?.comparativo[key] ?? null;
  }

  classeComparativo(item: RelatorioComparativoItem | null): string {
    if (!item) return 'comparativo--neutro';
    return item.direcao === 'SUBIU'
      ? 'comparativo--subiu'
      : item.direcao === 'DESCEU'
        ? 'comparativo--desceu'
        : 'comparativo--neutro';
  }

  textoComparativo(item: RelatorioComparativoItem | null): string {
    if (!item) return 'Sem comparação';
    const sinal = item.variacaoPercentual > 0 ? '+' : '';
    return `${sinal}${this.numero(item.variacaoPercentual)}% vs período anterior`;
  }

  periodoAtual(): string {
    if (!this.relatorio) return '';
    return `${this.formatarData(this.relatorio.periodo.atual.dataInicio)} a ${this.formatarData(this.relatorio.periodo.atual.dataFim)}`;
  }

  periodoAnterior(): string {
    if (!this.relatorio) return '';
    return `${this.formatarData(this.relatorio.periodo.anterior.dataInicio)} a ${this.formatarData(this.relatorio.periodo.anterior.dataFim)}`;
  }

  private numero(value: number): string {
    return value.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
  }

  private formatarData(value: string): string {
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('pt-BR');
  }
}
