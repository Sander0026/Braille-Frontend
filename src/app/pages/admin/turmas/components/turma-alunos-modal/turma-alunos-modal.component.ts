import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, OnInit, ViewChildren, QueryList, HostListener, signal, inject, DestroyRef, OnChanges, SimpleChanges, Directive, ElementRef, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { A11yModule, ActiveDescendantKeyManager, Highlightable } from '@angular/cdk/a11y';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  MatriculaOficinaResumo,
  MotivoEncerramentoMatricula,
  StatusEncerramentoMatricula,
  Turma,
  TurmasService,
} from '../../../../../core/services/turmas.service';
import { Beneficiario } from '../../../../../core/services/beneficiarios.service';
import { ToastService } from '../../../../../core/services/toast.service';

@Directive({
  selector: '[appBuscaItem]',
  standalone: true
})
export class BuscaResultadoItemDirective implements Highlightable {
  @Input() disabled = false;
  @Input() itemData: any; 
  @HostBinding('class.active-item') isActive = false;

  constructor(private element: ElementRef<HTMLElement>) { }

  setActiveStyles(): void {
    this.isActive = true;
    this.element.nativeElement.scrollIntoView({ block: 'nearest' });
  }

  setInactiveStyles(): void {
    this.isActive = false;
  }

  getLabel?(): string {
    return this.itemData?.nomeCompleto || '';
  }
}

@Component({
  selector: 'app-turma-alunos-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, A11yModule, BuscaResultadoItemDirective],
  templateUrl: './turma-alunos-modal.component.html',
  styleUrl: '../../turmas-lista/turmas-lista.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TurmaAlunosModalComponent implements OnInit, OnChanges {
  private readonly turmasService = inject(TurmasService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  @Input() aberto = false;
  @Input() turmaOriginal: Turma | null = null;
  @Input() isProfessor = false;

  @Output() fechar = new EventEmitter<void>();
  @Output() recarregarGrade = new EventEmitter<void>(); // Se houve alterações bem sucedidas

  readonly abaAtual              = signal<'adicionar' | 'remover'>('remover');
  readonly carregandoDetalhes     = signal<boolean>(false);
  readonly buscandoAlunos         = signal<boolean>(false);
  readonly operacaoEmProgresso    = signal<boolean>(false);

  readonly turmaDetalhes                    = signal<Turma | null>(null);
  readonly alunosBuscaRestado               = signal<Beneficiario[]>([]);
  readonly alunosSelecionadosParaMatricula  = signal<string[]>([]);
  readonly modalEncerramentoAberto          = signal<boolean>(false);
  readonly matriculaEmEncerramento          = signal<MatriculaOficinaResumo | null>(null);

  /** Elemento que abriu o modal — foco retorna a ele ao fechar (WCAG 2.4.3) */
  private lastFocusBeforeModal: HTMLElement | null = null;

  buscaAlunoCtrl = new FormControl('');

  readonly encerramentoForm = new FormGroup({
    status: new FormControl<StatusEncerramentoMatricula>('CANCELADA', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    motivoEncerramento: new FormControl<MotivoEncerramentoMatricula>('DESISTENCIA_VOLUNTARIA', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    observacao: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(1000)],
    }),
    dataEncerramento: new FormControl(this.hojeIso(), {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  readonly statusEncerramentoOptions: { value: StatusEncerramentoMatricula; label: string }[] = [
    { value: 'CONCLUIDA', label: 'Conclusão' },
    { value: 'EVADIDA', label: 'Evasão' },
    { value: 'CANCELADA', label: 'Cancelamento' },
    { value: 'TRANSFERIDA', label: 'Transferência' },
  ];

  readonly motivoEncerramentoOptions: { value: MotivoEncerramentoMatricula; label: string }[] = [
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

  @ViewChildren(BuscaResultadoItemDirective) buscaItems!: QueryList<BuscaResultadoItemDirective>;
  private keyManager!: ActiveDescendantKeyManager<BuscaResultadoItemDirective>;

  ngOnInit(): void {
    this.buscaAlunoCtrl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(termo => {
      this.buscarAlunosParaMatricula(termo || '');
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['aberto']) {
      if (this.aberto && this.turmaOriginal) {
        // WCAG 2.4.3: salva elemento focado antes de abrir o modal
        this.lastFocusBeforeModal = document.activeElement as HTMLElement;
        this.verAlunos(this.turmaOriginal.id);
      } else {
        this.turmaDetalhes.set(null);
        this.alunosBuscaRestado.set([]);
        this.alunosSelecionadosParaMatricula.set([]);
        this.modalEncerramentoAberto.set(false);
        this.matriculaEmEncerramento.set(null);
        this.buscaAlunoCtrl.setValue('', { emitEvent: false });
      }
    }
  }

  verAlunos(idTurma: string): void {
    this.carregandoDetalhes.set(true);
    this.abaAtual.set(this.isProfessor ? 'remover' : 'adicionar');

    this.turmasService.buscarPorId(idTurma)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (t) => {
          this.turmaDetalhes.set(t);
          this.carregandoDetalhes.set(false);
          if (!this.isProfessor) {
            this.buscarAlunosParaMatricula('');
          }
        },
        error: () => {
          this.carregandoDetalhes.set(false);
          this.toast.erro('Erro ao consultar turma.');
        }
      });
  }

  alterarAba(aba: 'adicionar' | 'remover'): void {
    if (this.isProfessor && aba === 'adicionar') return;

    this.abaAtual.set(aba);
    if (aba === 'adicionar') {
      this.buscaAlunoCtrl.setValue('', { emitEvent: false });
      this.buscarAlunosParaMatricula('');
    }
  }

  buscarAlunosParaMatricula(termo: string): void {
    if (this.isProfessor) {
      this.alunosBuscaRestado.set([]);
      this.alunosSelecionadosParaMatricula.set([]);
      this.buscandoAlunos.set(false);
      return;
    }

    const turma = this.turmaDetalhes();
    if (!turma) return;

    this.buscandoAlunos.set(true);

    this.turmasService.alunosDisponiveis(turma.id, termo)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (alunos) => {
          this.alunosBuscaRestado.set(alunos as any[]);
          this.buscandoAlunos.set(false);

          // Purga IDs pré-selecionados que nao vieram no novo payload
          const keepSelecao = this.alunosSelecionadosParaMatricula().filter(id => 
            (alunos as any[]).some(a => a.id === id)
          );
          this.alunosSelecionadosParaMatricula.set(keepSelecao);

          setTimeout(() => {
            this.keyManager = new ActiveDescendantKeyManager(this.buscaItems).withWrap().withTypeAhead();
          });
        },
        error: () => {
          this.buscandoAlunos.set(false);
        }
      });
  }

  onBuscaKeydown(event: KeyboardEvent): void {
    if (!this.keyManager) return;
    if (event.key === 'Enter' || event.key === ' ') {
      const activeItem = this.keyManager.activeItem;
      if (activeItem) {
        event.preventDefault();
        this.toggleSelecaoAluno(activeItem.itemData.id);
      }
    } else {
      this.keyManager.onKeydown(event);
    }
  }

  toggleSelecaoAluno(alunoId: string): void {
    const selecionados = this.alunosSelecionadosParaMatricula();
    if (selecionados.includes(alunoId)) {
      this.alunosSelecionadosParaMatricula.set(selecionados.filter(id => id !== alunoId));
    } else {
      this.alunosSelecionadosParaMatricula.set([...selecionados, alunoId]);
    }
  }

  salvarMatriculasEmLote(): void {
    if (this.isProfessor) return;

    const turma = this.turmaDetalhes();
    const selecionados = this.alunosSelecionadosParaMatricula();

    if (!turma || this.operacaoEmProgresso() || selecionados.length === 0) return;
    
    const capacidade = turma.capacidadeMaxima;
    const matriculadosAtuais = turma.matriculasOficina?.length || 0;
    const qtdSelec = selecionados.length;

    if (capacidade && (matriculadosAtuais + qtdSelec) > capacidade) {
      const vagas = capacidade - matriculadosAtuais;
      if (vagas <= 0) {
        this.toast.erro('Não foi possível matricular. A turma lotou.');
      } else {
        this.toast.erro(`Sem vagas: Você selecionou ${qtdSelec} alunos mas restam apenas ${vagas}.`);
      }
      return;
    }

    this.operacaoEmProgresso.set(true);

    let concluidos = 0;
    let erros = 0;
    const arrayParaCadastrar = [...selecionados];
    const msgsErro: string[] = [];

    const proc = () => {
      if ((concluidos + erros) === arrayParaCadastrar.length) {
        this.finalizarMatriculaLote(concluidos, erros, msgsErro, arrayParaCadastrar);
        return;
      }
      const alvoId = arrayParaCadastrar[concluidos + erros];
      this.turmasService.matricularAluno(turma.id, alvoId).subscribe({
        next: () => { concluidos++; proc(); },
        error: (err) => { erros++; msgsErro.push(err.error?.message ?? 'Falha'); proc(); }
      });
    };
    proc();
  }

  private finalizarMatriculaLote(concluidos: number, erros: number, msgs: string[], submetidos: string[]) {
    this.alunosSelecionadosParaMatricula.set([]);
    
    // Atualiza base visual
    this.turmasService.buscarPorId(this.turmaDetalhes()!.id).subscribe((novaTurma) => {
      this.turmaDetalhes.set(novaTurma);
      const remaining = this.alunosBuscaRestado().filter(r => !submetidos.includes(r.id));
      this.alunosBuscaRestado.set(remaining);
      this.operacaoEmProgresso.set(false);

      if (erros > 0 && concluidos === 0) {
        this.toast.erro(`Falha de lote: ${msgs[0]}`);
      } else if (erros > 0) {
        this.toast.aviso(`${concluidos} inseridos, mas ${erros} falharam.`);
      } else {
        this.toast.sucesso(`${concluidos} adicionados com extremo sucesso!`);
      }
      this.recarregarGrade.emit(); // Avise o grid parent
    });
  }

  abrirEncerramentoMatricula(matricula: MatriculaOficinaResumo): void {
    if (this.isProfessor) return;

    const turma = this.turmaDetalhes();
    if (!turma || this.operacaoEmProgresso()) return;

    this.matriculaEmEncerramento.set(matricula);
    this.encerramentoForm.reset({
      status: 'CANCELADA',
      motivoEncerramento: 'DESISTENCIA_VOLUNTARIA',
      observacao: '',
      dataEncerramento: this.hojeIso(),
    });
    this.modalEncerramentoAberto.set(true);
  }

  fecharEncerramentoMatricula(): void {
    if (this.operacaoEmProgresso()) return;
    this.modalEncerramentoAberto.set(false);
    this.matriculaEmEncerramento.set(null);
  }

  confirmarEncerramentoMatricula(): void {
    if (this.isProfessor) return;

    const turma = this.turmaDetalhes();
    const matricula = this.matriculaEmEncerramento();
    if (!turma || !matricula || this.operacaoEmProgresso()) return;

    if (this.encerramentoForm.invalid) {
      this.encerramentoForm.markAllAsTouched();
      this.toast.erro('Informe tipo, motivo e data do encerramento.');
      return;
    }

    const form = this.encerramentoForm.getRawValue();
    const observacao = form.observacao.trim();

    this.operacaoEmProgresso.set(true);
    this.turmasService.encerrarMatriculaAluno(turma.id, matricula.aluno.id, {
      status: form.status,
      motivoEncerramento: form.motivoEncerramento,
      dataEncerramento: form.dataEncerramento,
      ...(observacao && { observacao }),
    }).subscribe({
      next: () => {
        this.turmasService.buscarPorId(turma.id).subscribe((t) => {
          this.turmaDetalhes.set(t);
          this.operacaoEmProgresso.set(false);
          this.modalEncerramentoAberto.set(false);
          this.matriculaEmEncerramento.set(null);
          this.toast.sucesso('Participação encerrada com registro completo.');
          this.recarregarGrade.emit();
        });
      },
      error: () => {
        this.operacaoEmProgresso.set(false);
        this.toast.erro('Não foi possível encerrar a participação.');
      }
    });
  }

  exportarListaCSV(): void {
    const t = this.turmaDetalhes();
    if (!t) return;

    const nomeTurma = t.nome.replace(/[^a-zA-Z0-9À-ú ]/g, '').trim().replace(/\s+/g, '_');
    const data = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    const nomeArquivo = `Turma_${nomeTurma}_${data}.csv`;

    const cabecalho = ['Nome do Aluno', 'Matrícula', 'Status', 'Data de Ingresso'];
    const linhas = (t.matriculasOficina ?? []).map(m => [
      m.aluno.nomeCompleto,
      m.aluno.matricula ?? '',
      m.status ?? 'ATIVA',
      m.dataEntrada ? new Date(m.dataEntrada).toLocaleDateString('pt-BR') : '',
    ]);

    const csvConteudo = [cabecalho, ...linhas]
      .map(linha => linha.map(cel => `"${String(cel).replace(/"/g, '""')}"`).join(';'))
      .join('\r\n');

    const bom = '\uFEFF';
    const blob = new Blob([bom + csvConteudo], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', nomeArquivo);
    link.click();
    URL.revokeObjectURL(url);
  }

  private hojeIso(): string {
    const hoje = new Date();
    const local = new Date(hoje.getTime() - hoje.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 10);
  }

  aoFechar(): void {
    this.fechar.emit();
    // WCAG 2.4.3: retorna o foco ao elemento que abriu o modal
    setTimeout(() => this.lastFocusBeforeModal?.focus(), 0);
  }
}
