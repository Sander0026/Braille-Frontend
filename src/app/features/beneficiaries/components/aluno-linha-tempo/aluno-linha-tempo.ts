import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import {
  BeneficiariosService,
  LinhaTempoAlunoItem,
  LinhaTempoTurmaResumo,
  TipoEventoLinhaTempoAluno,
} from '../../../../core/services/beneficiarios.service';
import { DataBraillePipe } from '../../../../shared/pipes/data-braille.pipe';

type FiltroLinhaTempo = {
  id: string;
  label: string;
  tipos?: TipoEventoLinhaTempoAluno[];
};

@Component({
  selector: 'app-aluno-linha-tempo',
  standalone: true,
  imports: [CommonModule, FormsModule, DataBraillePipe],
  templateUrl: './aluno-linha-tempo.html',
  styleUrl: './aluno-linha-tempo.scss',
})
export class AlunoLinhaTempoComponent implements OnChanges, OnDestroy {
  @Input() alunoId?: string;
  @Input() modo: 'compacto' | 'completo' = 'compacto';
  @Input() refreshKey = 0;

  readonly filtros: FiltroLinhaTempo[] = [
    { id: 'TODOS', label: 'Todos' },
    { id: 'MATRICULAS', label: 'Matriculas', tipos: ['MATRICULA_TURMA', 'ENCERRAMENTO_MATRICULA'] },
    { id: 'FREQUENCIA', label: 'Frequencia', tipos: ['FREQUENCIA_PRESENTE', 'FREQUENCIA_FALTA', 'FREQUENCIA_FALTA_JUSTIFICADA'] },
    { id: 'ATENDIMENTOS', label: 'Atendimentos', tipos: ['ATENDIMENTO_INDIVIDUAL', 'FALTA_ATENDIMENTO'] },
    { id: 'PDI', label: 'PDI', tipos: ['PDI_CRIADO', 'PDI_META_CRIADA', 'PDI_META_ATUALIZADA', 'PDI_EVOLUCAO'] },
    { id: 'DOCUMENTOS', label: 'Documentos', tipos: ['ATESTADO', 'LAUDO'] },
    { id: 'CERTIFICADOS', label: 'Certificados', tipos: ['CERTIFICADO'] },
    { id: 'RISCO', label: 'Risco/Evasao', tipos: ['ACAO_RISCO_EVASAO', 'ACAO_RISCO_RESOLVIDA', 'INATIVACAO', 'REATIVACAO'] },
  ];

  filtroAtivo = 'TODOS';
  eventos: LinhaTempoAlunoItem[] = [];
  carregando = false;
  erro = '';
  page = 1;
  limit = 20;
  total = 0;
  lastPage = 1;
  dataInicio = '';
  dataFim = '';
  turmaId = '';
  turmas: LinhaTempoTurmaResumo[] = [];
  carregandoTurmas = false;

  private readonly destroy$ = new Subject<void>();

  constructor(private readonly beneficiariosService: BeneficiariosService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['alunoId'] || changes['modo']) && this.alunoId && this.modo === 'completo') {
      this.carregarTurmas();
    }

    if ((changes['alunoId'] || changes['refreshKey']) && this.alunoId) {
      this.recarregar();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  selecionarFiltro(filtroId: string): void {
    if (this.filtroAtivo === filtroId) return;
    this.filtroAtivo = filtroId;
    this.recarregar();
  }

  verMais(): void {
    if (this.carregando || this.page >= this.lastPage) return;
    this.carregar(this.page + 1, true);
  }

  aplicarFiltrosAvancados(): void {
    this.recarregar();
  }

  limparFiltrosAvancados(): void {
    this.dataInicio = '';
    this.dataFim = '';
    this.turmaId = '';
    this.recarregar();
  }

  mostrarAno(index: number): boolean {
    if (index === 0) return true;
    return this.ano(this.eventos[index]?.data) !== this.ano(this.eventos[index - 1]?.data);
  }

  mostrarMes(index: number): boolean {
    if (index === 0) return true;
    return this.mesAno(this.eventos[index]?.data) !== this.mesAno(this.eventos[index - 1]?.data);
  }

  ano(data?: string): string {
    if (!data) return '';
    return new Date(data).getFullYear().toString();
  }

  mesAno(data?: string): string {
    if (!data) return '';
    const date = new Date(data);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date);
  }

  tipoLabel(tipo: TipoEventoLinhaTempoAluno): string {
    const labels: Record<TipoEventoLinhaTempoAluno, string> = {
      CADASTRO: 'Cadastro',
      ATUALIZACAO_CADASTRO: 'Cadastro',
      MATRICULA_TURMA: 'Matricula',
      ENCERRAMENTO_MATRICULA: 'Matricula',
      FREQUENCIA_PRESENTE: 'Frequencia',
      FREQUENCIA_FALTA: 'Frequencia',
      FREQUENCIA_FALTA_JUSTIFICADA: 'Frequencia',
      ATENDIMENTO_INDIVIDUAL: 'Atendimento',
      FALTA_ATENDIMENTO: 'Atendimento',
      ATESTADO: 'Documento',
      LAUDO: 'Documento',
      CERTIFICADO: 'Certificado',
      PDI_CRIADO: 'PDI',
      PDI_META_CRIADA: 'PDI',
      PDI_META_ATUALIZADA: 'PDI',
      PDI_EVOLUCAO: 'PDI',
      ACAO_RISCO_EVASAO: 'Risco/Evasao',
      ACAO_RISCO_RESOLVIDA: 'Risco/Evasao',
      INATIVACAO: 'Situacao',
      REATIVACAO: 'Situacao',
      OBSERVACAO_MANUAL: 'Observacao',
    };
    return labels[tipo];
  }

  classeTipo(tipo: TipoEventoLinhaTempoAluno): string {
    if (tipo.startsWith('FREQUENCIA')) return 'timeline-event--frequencia';
    if (tipo.startsWith('PDI')) return 'timeline-event--pdi';
    if (tipo.includes('MATRICULA')) return 'timeline-event--matricula';
    if (tipo === 'CERTIFICADO') return 'timeline-event--certificado';
    if (tipo === 'ACAO_RISCO_EVASAO' || tipo === 'ACAO_RISCO_RESOLVIDA' || tipo === 'INATIVACAO') return 'timeline-event--risco';
    if (tipo === 'ATESTADO' || tipo === 'LAUDO') return 'timeline-event--documento';
    if (tipo.includes('ATENDIMENTO')) return 'timeline-event--atendimento';
    return 'timeline-event--cadastro';
  }

  private recarregar(): void {
    this.eventos = [];
    this.page = 1;
    this.total = 0;
    this.lastPage = 1;
    this.carregar(1, false);
  }

  private carregarTurmas(): void {
    if (!this.alunoId) return;
    this.carregandoTurmas = true;

    this.beneficiariosService
      .linhaTempoTurmas(this.alunoId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (turmas) => {
          this.turmas = turmas;
          if (this.turmaId && !turmas.some((turma) => turma.id === this.turmaId)) {
            this.turmaId = '';
          }
          this.carregandoTurmas = false;
        },
        error: () => {
          this.turmas = [];
          this.turmaId = '';
          this.carregandoTurmas = false;
        },
      });
  }

  private carregar(page: number, append: boolean): void {
    if (!this.alunoId) return;
    this.carregando = true;
    this.erro = '';

    const filtro = this.filtros.find((item) => item.id === this.filtroAtivo);
    const tipo = filtro?.tipos?.join(',');

    this.beneficiariosService
      .linhaTempo(this.alunoId, {
        page,
        limit: this.limit,
        tipo,
        dataInicio: this.dataInicio,
        dataFim: this.dataFim,
        turmaId: this.turmaId.trim(),
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.eventos = append ? [...this.eventos, ...res.data] : res.data;
          this.page = res.meta.page;
          this.limit = res.meta.limit;
          this.total = res.meta.total;
          this.lastPage = res.meta.lastPage;
          this.carregando = false;
        },
        error: (err) => {
          this.erro = err?.error?.message || 'Nao foi possivel carregar a linha do tempo.';
          this.carregando = false;
        },
      });
  }
}
