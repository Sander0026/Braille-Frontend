import { Component, DestroyRef, ElementRef, EventEmitter, HostListener, OnInit, Output, ViewChild, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, switchMap, debounceTime, distinctUntilChanged, of, catchError } from 'rxjs';
import { BeneficiarioResumo, BeneficiariosService } from '../../../../core/services/beneficiarios.service';
import { Usuario, UsuariosService } from '../../../../core/services/usuarios.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmDialogService } from '../../../../core/services/confirm-dialog.service';
import { AtendimentosIndividuaisApiService } from '../../services/atendimentos-individuais-api.service';
import { AcompanhamentoIndividual } from '../../models/acompanhamento-individual.model';
import { AlunoAutocompleteComponent } from '../aluno-autocomplete/aluno-autocomplete.component';

@Component({
  selector: 'app-criar-acompanhamento-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, AlunoAutocompleteComponent],
  templateUrl: './criar-acompanhamento-modal.component.html',
  styleUrl: './criar-acompanhamento-modal.component.scss',
})
export class CriarAcompanhamentoModalComponent implements OnInit {
  private readonly api                 = inject(AtendimentosIndividuaisApiService);
  private readonly beneficiariosService = inject(BeneficiariosService);
  private readonly usuariosService      = inject(UsuariosService);
  private readonly authService          = inject(AuthService);
  private readonly toast                = inject(ToastService);
  private readonly destroyRef           = inject(DestroyRef);
  private readonly confirmDialog        = inject(ConfirmDialogService);

  @Output() salvo = new EventEmitter<AcompanhamentoIndividual>();
  @Output() fechado = new EventEmitter<void>();

  @ViewChild('primeiroFoco') private primeiroFoco?: ElementRef<HTMLElement>;

  readonly passoAtual = signal(1);
  readonly totalPassos = 3;

  readonly alunos                    = signal<BeneficiarioResumo[]>([]);
  readonly professores               = signal<Usuario[]>([]);
  readonly salvando                  = signal(false);
  readonly isProfessor               = signal(false);
  readonly isSecretaria              = signal(false);
  readonly buscandoAlunos            = signal(false);
  readonly duplicado                 = signal<AcompanhamentoIndividual | null>(null);
  readonly verificandoDuplicidade    = signal(false);
  readonly alunoSelecionado          = signal<BeneficiarioResumo | null>(null);
  readonly formTocado                = signal(false);
  readonly salvoComSucesso           = signal(false);

  alunoId     = '';
  professorId = '';
  assuntoAtual = '';
  descricao   = '';

  private readonly buscaSubject = new Subject<string>();

  ngOnInit(): void {
    const role = this.authService.getUser()?.role;
    this.isProfessor.set(role === 'PROFESSOR');
    this.isSecretaria.set(role === 'SECRETARIA');

    if (!this.isProfessor()) {
      this.usuariosService.listarResumo(1, 100, undefined, 'PROFESSOR').subscribe({
        next: res => this.professores.set(res.data),
        error: () => this.toast.erro('Não foi possível carregar os professores disponíveis.'),
      });
    }

    this.buscaSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(termo => {
        if (!termo || termo.trim().length < 3) {
          this.alunos.set([]);
          this.buscandoAlunos.set(false);
          return of([]);
        }
        this.buscandoAlunos.set(true);
        return this.beneficiariosService.buscarResumo(termo).pipe(
          catchError(() => {
            this.toast.erro('Não foi possível buscar alunos.');
            return of([]);
          }),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(alunos => {
      this.alunos.set(alunos);
      this.buscandoAlunos.set(false);
    });
  }

  ngAfterViewInit() {
    window.setTimeout(() => this.primeiroFoco?.nativeElement.focus());
  }

  isFormDirty(): boolean {
    return (this.formTocado() || !!this.alunoId || !!this.assuntoAtual.trim()) && !this.salvoComSucesso();
  }

  async fechar(): Promise<void> {
    if (this.salvando()) return;
    if (this.isFormDirty() && !(await this.confirmarDescarte())) return;
    this.fechado.emit();
  }

  private confirmarDescarte(): Promise<boolean> {
    return this.confirmDialog.confirmar({
      titulo: 'Descartar alterações?',
      mensagem: 'Existem alterações não salvas. Deseja realmente sair e descartar as informações preenchidas?',
      textoBotaoConfirmar: 'Descartar alterações',
      textoBotaoCancelar: 'Continuar editando',
      tipo: 'warning',
    });
  }

  onDialogKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.fechar();
      return;
    }
    if (event.key === 'Tab') {
      this.trapFocus(event);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    // Não interceptar se o ConfirmDialog de descarte estiver aberto —
    // o <dialog> nativo já trata o Escape via evento 'cancel'
    if (this.confirmDialog.dialogData()) return;
    if (!this.salvando()) {
      this.fechar();
    }
  }

  private trapFocus(event: KeyboardEvent): void {
    const root = event.currentTarget as HTMLElement;
    const sel = 'button:not([disabled]),[href],input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';
    const focusable = Array.from(root.querySelectorAll<HTMLElement>(sel));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (document.activeElement === root) { event.preventDefault(); (event.shiftKey ? last : first).focus(); return; }
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); return; }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  avancarPasso(): void {
    const passo = this.passoAtual();
    if (passo === 1 && !this.alunoId) {
      this.toast.erro('Selecione um aluno para continuar.');
      return;
    }
    if (passo === 2 && !this.assuntoAtual.trim()) {
      this.toast.erro('Informe o assunto principal do acompanhamento.');
      return;
    }
    if (passo === 2 && !this.isProfessor() && !this.professorId) {
      this.toast.erro('Selecione o professor responsável.');
      return;
    }
    if (passo < this.totalPassos) {
      this.passoAtual.set(passo + 1);
      this.scrollTopo();
    }
  }

  voltarPasso(): void {
    if (this.passoAtual() > 1) {
      this.passoAtual.set(this.passoAtual() - 1);
      this.scrollTopo();
    }
  }

  private scrollTopo(): void {
    setTimeout(() => {
      document.querySelector('.modal-body')?.scrollTo({ top: 0, behavior: 'smooth' });
    }, 80);
  }

  buscarAlunos(termo: string): void {
    this.buscaSubject.next(termo);
  }

  selecionarAluno(aluno: BeneficiarioResumo | null): void {
    this.alunoId = aluno?.id ?? '';
    this.alunoSelecionado.set(aluno);
    this.formTocado.set(true);
    this.duplicado.set(null);
  }

  marcarFormTocado(): void {
    this.formTocado.set(true);
    this.duplicado.set(null);
  }

  continuarMesmoComDuplicidade(): void {
    this.salvar(true);
  }

  limparDuplicidade(): void {
    this.duplicado.set(null);
  }

  nomeProfessor(): string {
    if (!this.professorId) return '—';
    const prof = this.professores().find(p => p.id === this.professorId);
    return prof ? `${prof.nome}${prof.matricula ? ' — ' + prof.matricula : ''}` : '—';
  }

  salvar(ignorarDuplicidade = false): void {
    if (!this.alunoId || !this.assuntoAtual.trim()) {
      this.toast.erro('Informe o aluno e o assunto principal.');
      return;
    }
    if (!this.isProfessor() && !this.professorId) {
      this.toast.erro('Selecione o professor responsável.');
      return;
    }

    if (!ignorarDuplicidade) {
      this.verificarDuplicidadeAntesDeSalvar();
      return;
    }

    this.salvando.set(true);
    this.api.criar({
      alunoId: this.alunoId,
      professorId: this.isProfessor() ? undefined : this.professorId,
      assuntoAtual: this.assuntoAtual,
      descricao: this.descricao || undefined,
    }).subscribe({
      next: acompanhamento => {
        this.salvando.set(false);
        this.salvoComSucesso.set(true);
        this.toast.sucesso('Acompanhamento criado com sucesso.');
        this.salvo.emit(acompanhamento);
      },
      error: () => {
        this.salvando.set(false);
        this.toast.erro('Não foi possível criar o acompanhamento.');
      },
    });
  }

  private verificarDuplicidadeAntesDeSalvar(): void {
    this.verificandoDuplicidade.set(true);
    this.api.verificarDuplicidade({
      alunoId: this.alunoId,
      professorId: this.isProfessor() ? undefined : this.professorId,
      assuntoAtual: this.assuntoAtual,
    }).subscribe({
      next: resultado => {
        this.verificandoDuplicidade.set(false);
        if (resultado.duplicado && resultado.acompanhamento) {
          this.duplicado.set(resultado.acompanhamento);
          this.toast.erro('Já existe um acompanhamento semelhante em andamento.');
          return;
        }
        this.salvar(true);
      },
      error: () => {
        this.verificandoDuplicidade.set(false);
        this.toast.erro('Não foi possível verificar acompanhamentos semelhantes.');
      },
    });
  }
}
