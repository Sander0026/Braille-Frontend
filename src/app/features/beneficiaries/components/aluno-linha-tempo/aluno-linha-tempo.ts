import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, finalize, takeUntil } from 'rxjs';
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
  private destruido = false;

  constructor(
    private readonly beneficiariosService: BeneficiariosService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['alunoId'] || changes['modo']) && this.alunoId && this.modo === 'completo') {
      this.carregarTurmas();
    }

    if ((changes['alunoId'] || changes['refreshKey']) && this.alunoId) {
      this.recarregar();
    }
  }

  ngOnDestroy(): void {
    this.destruido = true;
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
    this.atualizarTela();

    this.beneficiariosService
      .linhaTempoTurmas(this.alunoId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.carregandoTurmas = false;
          this.atualizarTela();
        }),
      )
      .subscribe({
        next: (turmas) => {
          this.turmas = turmas;
          if (this.turmaId && !turmas.some((turma) => turma.id === this.turmaId)) {
            this.turmaId = '';
          }
        },
        error: () => {
          this.turmas = [];
          this.turmaId = '';
        },
      });
  }

  private carregar(page: number, append: boolean): void {
    if (!this.alunoId) return;
    this.carregando = true;
    this.erro = '';
    this.atualizarTela();

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
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.carregando = false;
          this.atualizarTela();
        }),
      )
      .subscribe({
        next: (res) => {
          const eventos = Array.isArray(res?.data) ? res.data : [];
          const meta = res?.meta ?? { page, limit: this.limit, total: eventos.length, lastPage: 1 };

          this.eventos = append ? [...this.eventos, ...eventos] : eventos;
          this.page = meta.page ?? page;
          this.limit = meta.limit ?? this.limit;
          this.total = meta.total ?? this.eventos.length;
          this.lastPage = meta.lastPage ?? 1;
        },
        error: (err) => {
          this.erro = err?.error?.message || 'Nao foi possivel carregar a linha do tempo.';
        },
      });
  }

  private atualizarTela(): void {
    if (this.destruido) return;
    this.cdr.detectChanges();
  }
}
