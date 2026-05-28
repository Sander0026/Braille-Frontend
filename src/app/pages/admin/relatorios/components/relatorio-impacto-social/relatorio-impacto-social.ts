import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
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
export class RelatorioImpactoSocial implements OnChanges {
  @Input() relatorio: RelatorioImpactoSocialResponse | null = null;
  @Input() carregando = false;
  @Input() comparativoInicio = '';
  @Input() comparativoFim = '';
  @Input() erroLocal = '';
  @Output() periodoComparativoChange = new EventEmitter<{ inicio: string; fim: string }>();

  /** Mês selecionado (1–12); 0 = nenhum */
  localMes = 0;
  /** Ano selecionado (ex.: 2026); 0 = nenhum */
  localAno = 0;

  readonly meses = [
    { valor: 1,  label: 'Janeiro'   },
    { valor: 2,  label: 'Fevereiro' },
    { valor: 3,  label: 'Março'     },
    { valor: 4,  label: 'Abril'     },
    { valor: 5,  label: 'Maio'      },
    { valor: 6,  label: 'Junho'     },
    { valor: 7,  label: 'Julho'     },
    { valor: 8,  label: 'Agosto'    },
    { valor: 9,  label: 'Setembro'  },
    { valor: 10, label: 'Outubro'   },
    { valor: 11, label: 'Novembro'  },
    { valor: 12, label: 'Dezembro'  },
  ];

  readonly anos: number[];

  readonly metricas: Array<{ key: ImpactoKey; label: string; icon: string; percentual?: boolean }> = [
    { key: 'totalAlunosAtendidos',                label: 'Alunos atendidos',              icon: 'groups'            },
    { key: 'totalAtendimentosIndividuais',         label: 'Atendimentos individuais',       icon: 'clinical_notes'    },
    { key: 'totalTurmasOfertadas',                 label: 'Turmas ofertadas',               icon: 'school'            },
    { key: 'totalCertificadosEmitidos',            label: 'Certificados emitidos',          icon: 'workspace_premium' },
    { key: 'totalAlunosDeficienciaVisualAtendidos',label: 'Alunos com deficiência visual',  icon: 'visibility'        },
    { key: 'totalCidadesAlcancadas',               label: 'Cidades alcançadas',             icon: 'location_city'     },
    { key: 'totalBairrosAlcancados',               label: 'Bairros alcançados',             icon: 'map'               },
    { key: 'taxaPermanencia',                      label: 'Taxa de permanência',            icon: 'timeline',           percentual: true },
    { key: 'taxaConclusao',                        label: 'Taxa de conclusão',              icon: 'task_alt',           percentual: true },
  ];

  constructor() {
    const atual = new Date().getFullYear();
    // Ano atual + 1 ano à frente, até 6 anos atrás — ordem decrescente (mais recente primeiro)
    this.anos = Array.from({ length: 8 }, (_, i) => atual + 1 - i);
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Sincroniza o seletor local quando o pai reseta o comparativo (ex.: "Limpar filtros")
    if (changes['comparativoInicio']) {
      if (this.comparativoInicio) {
        const partes = this.comparativoInicio.split('-');
        if (partes.length === 3) {
          this.localAno = parseInt(partes[0], 10);
          this.localMes = parseInt(partes[1], 10);
        }
      } else {
        this.localMes = 0;
        this.localAno = 0;
      }
    }
  }

  onMesChange(event: Event): void {
    this.localMes = parseInt((event.target as HTMLSelectElement).value, 10);
    this.emitirSeCompleto();
  }

  onAnoChange(event: Event): void {
    this.localAno = parseInt((event.target as HTMLSelectElement).value, 10);
    this.emitirSeCompleto();
  }

  limparComparativo(): void {
    this.localMes = 0;
    this.localAno = 0;
    this.periodoComparativoChange.emit({ inicio: '', fim: '' });
  }

  /** Intervalo completo do mês selecionado formatado para exibição */
  get intervaloCalculado(): string {
    if (!this.localMes || !this.localAno) return '';
    return `${this.formatarData(this.primeiroDiaMes())} a ${this.formatarData(this.ultimoDiaMes())}`;
  }

  valor(key: ImpactoKey): string {
    if (!this.relatorio) return '-';
    return this.formatarValorBase(key, this.relatorio.metricas[key]);
  }

  formatarValorBase(key: ImpactoKey, value: number): string {
    const metrica = this.metricas.find((m) => m.key === key);
    return metrica?.percentual ? `${this.numero(value)}%` : this.numero(value);
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

  /** Emite o intervalo completo apenas quando mês E ano estiverem selecionados */
  private emitirSeCompleto(): void {
    if (this.localMes && this.localAno) {
      this.periodoComparativoChange.emit({
        inicio: this.primeiroDiaMes(),
        fim: this.ultimoDiaMes(),
      });
    }
  }

  /** Retorna "AAAA-MM-01" */
  private primeiroDiaMes(): string {
    const m = String(this.localMes).padStart(2, '0');
    return `${this.localAno}-${m}-01`;
  }

  /**
   * Retorna "AAAA-MM-DD" com o último dia real do mês,
   * considerando anos bissextos (Fevereiro/2024 = 29 dias).
   * new Date(ano, mes, 0) = dia 0 do mês seguinte = último dia do mês atual.
   */
  private ultimoDiaMes(): string {
    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    const mesAtual = hoje.getMonth() + 1;

    let lastDay = new Date(this.localAno, this.localMes, 0).getDate();
    
    // Se for o mês e ano atual, limita o último dia à data de hoje
    if (this.localAno === anoAtual && this.localMes === mesAtual) {
      lastDay = Math.min(lastDay, hoje.getDate());
    }

    const m = String(this.localMes).padStart(2, '0');
    const d = String(lastDay).padStart(2, '0');
    return `${this.localAno}-${m}-${d}`;
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
