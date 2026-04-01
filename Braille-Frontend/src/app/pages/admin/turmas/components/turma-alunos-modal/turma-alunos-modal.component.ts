import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, OnInit, ViewChildren, QueryList, HostListener, signal, inject, DestroyRef, OnChanges, SimpleChanges, Directive, ElementRef, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { A11yModule, ActiveDescendantKeyManager, Highlightable } from '@angular/cdk/a11y';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Turma, TurmasService } from '../../../../../core/services/turmas.service';
import { Beneficiario } from '../../../../../core/services/beneficiarios.service';
import { ConfirmDialogService } from '../../../../../core/services/confirm-dialog.service';
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
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  @Input() aberto = false;
  @Input() turmaOriginal: Turma | null = null;
  @Input() isProfessor = false;

  @Output() fechar = new EventEmitter<void>();
  @Output() recarregarGrade = new EventEmitter<void>(); // Se houve alterações bem sucedidas

  readonly abaAtual = signal<'adicionar' | 'remover'>('remover');
  readonly carregandoDetalhes = signal<boolean>(false);
  readonly buscandoAlunos = signal<boolean>(false);
  readonly operacaoEmProgresso = signal<boolean>(false);

  readonly turmaDetalhes = signal<Turma | null>(null);
  readonly alunosBuscaRestado = signal<Beneficiario[]>([]);
  readonly alunosSelecionadosParaMatricula = signal<string[]>([]);

  buscaAlunoCtrl = new FormControl('');

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
        this.verAlunos(this.turmaOriginal.id);
      } else {
        this.turmaDetalhes.set(null);
        this.alunosBuscaRestado.set([]);
        this.alunosSelecionadosParaMatricula.set([]);
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
          this.buscarAlunosParaMatricula('');
        },
        error: () => {
          this.carregandoDetalhes.set(false);
          this.toast.erro('Erro ao consultar turma.');
        }
      });
  }

  alterarAba(aba: 'adicionar' | 'remover'): void {
    this.abaAtual.set(aba);
    if (aba === 'adicionar') {
      this.buscaAlunoCtrl.setValue('', { emitEvent: false });
      this.buscarAlunosParaMatricula('');
    }
  }

  buscarAlunosParaMatricula(termo: string): void {
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

  async removerAluno(alunoId: string, nome: string): Promise<void> {
    const turma = this.turmaDetalhes();
    if (!turma || this.operacaoEmProgresso()) return;

    const ok = await this.confirmDialog.confirmar({
      titulo: 'Remover Aluno',
      mensagem: `Deseja realmente remover ${nome} desta oficina?`,
      textoBotaoConfirmar: 'Sim, remover'
    });
    if (!ok) return;

    this.operacaoEmProgresso.set(true);
    this.turmasService.desmatricularAluno(turma.id, alunoId).subscribe({
      next: () => {
        this.turmasService.buscarPorId(turma.id).subscribe((t) => {
          this.turmaDetalhes.set(t);
          this.operacaoEmProgresso.set(false);
          this.toast.sucesso('Deletado da turma');
          this.recarregarGrade.emit();
        });
      },
      error: () => {
        this.operacaoEmProgresso.set(false);
        this.toast.erro('Falha de sistema');
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

  aoFechar() {
    this.fechar.emit();
  }
}
