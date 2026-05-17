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
import { FormsModule } from '@angular/forms';
import { A11yModule } from '@angular/cdk/a11y';
import {
  MatriculaStatusRelatorio,
  ModalidadeAtendimentoRelatorio,
  MotivoEncerramentoMatricula,
  RelatorioFiltro,
  StatusAcompanhamentoRelatorio,
  StatusAlunoRelatorio,
  TipoRegistroAtendimentoRelatorio,
  TurmaStatusRelatorio,
} from '../../../../../core/services/relatorios.service';

export interface RelatorioFiltroOption {
  id: string;
  label: string;
}

type LabelOption<T extends string = string> = {
  value: T;
  label: string;
};

@Component({
  selector: 'app-relatorio-filtros',
  standalone: true,
  imports: [CommonModule, FormsModule, A11yModule],
  templateUrl: './relatorio-filtros.html',
  styleUrl: './relatorio-filtros.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelatorioFiltros implements OnChanges {
  @Input({ required: true }) filtros!: RelatorioFiltro;
  @Input() turmas: RelatorioFiltroOption[] = [];
  @Input() professores: RelatorioFiltroOption[] = [];
  @Input() alunos: RelatorioFiltroOption[] = [];
  @Input() cidades: RelatorioFiltroOption[] = [];
  @Input() bairros: RelatorioFiltroOption[] = [];
  @Input() carregando = false;
  @Input() modoPublico = false;
  /** Controla abertura/fechamento do drawer */
  @Input() aberto = false;

  @Output() aplicar = new EventEmitter<RelatorioFiltro>();
  @Output() limpar = new EventEmitter<void>();
  @Output() buscarTurmas = new EventEmitter<string>();
  @Output() buscarProfessores = new EventEmitter<string>();
  @Output() buscarAlunos = new EventEmitter<string>();
  @Output() buscarCidades = new EventEmitter<string>();
  @Output() buscarBairros = new EventEmitter<{ busca: string; cidade?: string }>();
  /** Emitido quando o usuário fecha o drawer */
  @Output() aoFechar = new EventEmitter<void>();

  form: RelatorioFiltro = { statusAluno: 'TODOS' };
  buscaTurma = '';
  buscaProfessor = '';
  buscaAluno = '';
  buscaCidade = '';
  buscaBairro = '';

  /** Elemento que abriu o drawer — foco restaurado ao fechar (WCAG 2.4.3) */
  private lastFocus: HTMLElement | null = null;

  readonly statusAlunoOptions: LabelOption<StatusAlunoRelatorio>[] = [
    { value: 'TODOS', label: 'Todos' },
    { value: 'ATIVO', label: 'Ativo' },
    { value: 'INATIVO', label: 'Inativo' },
  ];

  readonly statusTurmaOptions: LabelOption<TurmaStatusRelatorio>[] = [
    { value: 'PREVISTA', label: 'Prevista' },
    { value: 'ANDAMENTO', label: 'Em andamento' },
    { value: 'CONCLUIDA', label: 'Concluída' },
    { value: 'CANCELADA', label: 'Cancelada' },
  ];

  readonly statusMatriculaOptions: LabelOption<MatriculaStatusRelatorio>[] = [
    { value: 'ATIVA', label: 'Ativa' },
    { value: 'CONCLUIDA', label: 'Concluída' },
    { value: 'EVADIDA', label: 'Evadida' },
    { value: 'CANCELADA', label: 'Cancelada' },
    { value: 'TRANSFERIDA', label: 'Transferida' },
  ];

  readonly motivoOptions: LabelOption<MotivoEncerramentoMatricula>[] = [
    { value: 'CONCLUSAO', label: 'Conclusão' },
    { value: 'EVASAO_SEM_JUSTIFICATIVA', label: 'Evasão sem justificativa' },
    { value: 'MUDANCA_DE_TURNO', label: 'Mudança de turno' },
    { value: 'TRANSFERENCIA_DE_TURMA', label: 'Transferência de turma' },
    { value: 'MUDANCA_DE_CIDADE', label: 'Mudança de cidade' },
    { value: 'DIFICULDADE_TRANSPORTE', label: 'Dificuldade de transporte' },
    { value: 'PROBLEMA_SAUDE', label: 'Problema de saúde' },
    { value: 'PROBLEMA_FAMILIAR', label: 'Problema familiar' },
    { value: 'INCOMPATIBILIDADE_HORARIO', label: 'Incompatibilidade de horário' },
    { value: 'FALTA_DE_CONTATO', label: 'Falta de contato' },
    { value: 'DESISTENCIA_VOLUNTARIA', label: 'Desistência voluntária' },
    { value: 'CANCELAMENTO_DA_TURMA', label: 'Cancelamento da turma' },
    { value: 'OUTRO', label: 'Outro' },
  ];

  readonly statusAcompanhamentoOptions: LabelOption<StatusAcompanhamentoRelatorio>[] = [
    { value: 'EM_ANDAMENTO', label: 'Em andamento' },
    { value: 'FINALIZADO', label: 'Finalizado' },
    { value: 'ARQUIVADO', label: 'Arquivado' },
  ];

  readonly tipoRegistroAtendimentoOptions: LabelOption<TipoRegistroAtendimentoRelatorio>[] = [
    { value: 'ATENDIMENTO_REALIZADO', label: 'Atendimento realizado' },
    { value: 'FALTA_JUSTIFICADA', label: 'Falta justificada' },
    { value: 'FALTA_NAO_JUSTIFICADA', label: 'Falta não justificada' },
    { value: 'CANCELADO', label: 'Cancelado' },
  ];

  readonly modalidadeAtendimentoOptions: LabelOption<ModalidadeAtendimentoRelatorio>[] = [
    { value: 'PRESENCIAL', label: 'Presencial' },
    { value: 'REMOTO', label: 'Remoto' },
    { value: 'TELEFONE', label: 'Telefone' },
    { value: 'OUTRO', label: 'Outro' },
  ];

  readonly tipoDeficienciaOptions: LabelOption[] = [
    { value: 'CEGUEIRA_TOTAL', label: 'Cegueira total' },
    { value: 'BAIXA_VISAO', label: 'Baixa visão' },
    { value: 'VISAO_MONOCULAR', label: 'Visão monocular' },
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['filtros']) {
      this.form = { statusAluno: 'TODOS', ...this.filtros };
      this.buscaCidade = this.form.cidade ?? '';
      this.buscaBairro = this.form.bairro ?? '';
    }

    if (changes['aberto']?.currentValue) {
      // Captura elemento focado antes de abrir (WCAG 2.4.3)
      this.lastFocus = document.activeElement as HTMLElement;
    }
  }

  onBuscaTurma(termo: string): void {
    this.buscaTurma = termo;
    this.form.turmaId = undefined;
    this.buscarTurmas.emit(termo);
  }

  onBuscaProfessor(termo: string): void {
    this.buscaProfessor = termo;
    this.form.professorId = undefined;
    this.buscarProfessores.emit(termo);
  }

  onBuscaAluno(termo: string): void {
    this.buscaAluno = termo;
    this.form.alunoId = undefined;
    this.buscarAlunos.emit(termo);
  }

  onBuscaCidade(termo: string): void {
    this.buscaCidade = termo;
    this.form.cidade = undefined;
    this.form.bairro = undefined;
    this.buscaBairro = '';
    this.buscarCidades.emit(termo);
    this.buscarBairros.emit({ busca: '' });
  }

  onBuscaBairro(termo: string): void {
    this.buscaBairro = termo;
    this.form.bairro = undefined;
    this.buscarBairros.emit({ busca: termo, cidade: this.form.cidade });
  }

  selecionarTurma(opcao: RelatorioFiltroOption): void {
    this.form.turmaId = opcao.id;
    this.buscaTurma = opcao.label;
  }

  selecionarProfessor(opcao: RelatorioFiltroOption): void {
    this.form.professorId = opcao.id;
    this.buscaProfessor = opcao.label;
  }

  selecionarAluno(opcao: RelatorioFiltroOption): void {
    this.form.alunoId = opcao.id;
    this.buscaAluno = opcao.label;
  }

  selecionarCidade(opcao: RelatorioFiltroOption): void {
    this.form.cidade = opcao.label;
    this.form.bairro = undefined;
    this.buscaCidade = opcao.label;
    this.buscaBairro = '';
    this.buscarBairros.emit({ busca: '' });
  }

  selecionarBairro(opcao: RelatorioFiltroOption): void {
    this.form.bairro = opcao.label;
    this.buscaBairro = opcao.label;
  }

  limparTurma(): void {
    this.form.turmaId = undefined;
    this.buscaTurma = '';
    this.buscarTurmas.emit('');
  }

  limparProfessor(): void {
    this.form.professorId = undefined;
    this.buscaProfessor = '';
    this.buscarProfessores.emit('');
  }

  limparAluno(): void {
    this.form.alunoId = undefined;
    this.buscaAluno = '';
    this.buscarAlunos.emit('');
  }

  limparCidade(): void {
    this.form.cidade = undefined;
    this.form.bairro = undefined;
    this.buscaCidade = '';
    this.buscaBairro = '';
    this.buscarCidades.emit('');
    this.buscarBairros.emit({ busca: '' });
  }

  limparBairro(): void {
    this.form.bairro = undefined;
    this.buscaBairro = '';
    this.buscarBairros.emit({ busca: '', cidade: this.form.cidade });
  }

  aplicarFiltros(): void {
    this.aplicar.emit({ ...this.form });
    this.fechar();
  }

  limparFiltros(): void {
    this.form = { statusAluno: 'TODOS' };
    this.buscaTurma = '';
    this.buscaProfessor = '';
    this.buscaAluno = '';
    this.buscaCidade = '';
    this.buscaBairro = '';
    this.buscarTurmas.emit('');
    this.buscarProfessores.emit('');
    this.buscarAlunos.emit('');
    this.buscarCidades.emit('');
    this.buscarBairros.emit({ busca: '' });
    this.limpar.emit();
  }

  fechar(): void {
    this.aoFechar.emit();
    // Restaura foco ao elemento que abriu (WCAG 2.4.3)
    setTimeout(() => this.lastFocus?.focus(), 0);
  }
}
