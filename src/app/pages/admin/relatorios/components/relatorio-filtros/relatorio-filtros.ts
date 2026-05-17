import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
  imports: [CommonModule, FormsModule],
  templateUrl: './relatorio-filtros.html',
  styleUrl: './relatorio-filtros.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelatorioFiltros implements OnChanges {
  @Input({ required: true }) filtros!: RelatorioFiltro;
  @Input() turmas: RelatorioFiltroOption[] = [];
  @Input() professores: RelatorioFiltroOption[] = [];
  @Input() alunos: RelatorioFiltroOption[] = [];
  @Input() carregando = false;
  @Input() modoPublico = false;

  @Output() aplicar = new EventEmitter<RelatorioFiltro>();
  @Output() limpar = new EventEmitter<void>();

  form: RelatorioFiltro = { statusAluno: 'TODOS' };

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

  ngOnChanges(): void {
    this.form = { statusAluno: 'TODOS', ...this.filtros };
  }

  aplicarFiltros(): void {
    this.aplicar.emit({ ...this.form });
  }

  limparFiltros(): void {
    this.form = { statusAluno: 'TODOS' };
    this.limpar.emit();
  }
}
