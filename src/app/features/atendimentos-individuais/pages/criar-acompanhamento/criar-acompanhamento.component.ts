import {
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { Subject, switchMap, debounceTime, distinctUntilChanged, of, catchError } from 'rxjs';
import { BeneficiarioResumo, BeneficiariosService } from '../../../../core/services/beneficiarios.service';
import { Usuario, UsuariosService } from '../../../../core/services/usuarios.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AtendimentosIndividuaisApiService } from '../../services/atendimentos-individuais-api.service';
import { AcompanhamentoIndividual } from '../../models/acompanhamento-individual.model';
import { AlunoAutocompleteComponent } from '../../components/aluno-autocomplete/aluno-autocomplete.component';
import { CriarAtendimentoIndividualPayload } from '../../models/atendimento-individual.model';
import { injectFormDescarte } from '../../../../shared/classes/base-form-descarte';
import { ComponenteComDescarte } from '../../../../core/interfaces/componente-com-descarte.interface';

@Component({
  selector: 'app-criar-acompanhamento',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AlunoAutocompleteComponent],
  templateUrl: './criar-acompanhamento.component.html',
  styleUrl: './criar-acompanhamento.component.scss',
})
export class CriarAcompanhamentoComponent implements OnInit, ComponenteComDescarte {
  private readonly api                 = inject(AtendimentosIndividuaisApiService);
  private readonly beneficiariosService = inject(BeneficiariosService);
  private readonly usuariosService      = inject(UsuariosService);
  private readonly authService          = inject(AuthService);
  private readonly toast                = inject(ToastService);
  private readonly router               = inject(Router);
  private readonly destroyRef           = inject(DestroyRef);

  // ── Wizard ─────────────────────────────────────────────────────────────────
  readonly passoAtual = signal(1);
  readonly totalPassos = 3;

  // ── Signals de estado ──────────────────────────────────────────────────────
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

  // ── Dados do formulário ────────────────────────────────────────────────────
  alunoId     = '';
  professorId = '';
  assuntoAtual = '';
  descricao   = '';

  // ── Guard de descarte ──────────────────────────────────────────────────────
  private readonly verificarDescarte = injectFormDescarte(() => this.isFormDirty());

  podeDescartar(): Promise<boolean> {
    return this.verificarDescarte();
  }

  isFormDirty(): boolean {
    return (this.formTocado() || !!this.alunoId || !!this.assuntoAtual.trim()) && !this.salvoComSucesso();
  }

  // ── Pipeline RxJS para busca com debounce ─────────────────────────────────
  private readonly buscaSubject = new Subject<string>();

  ngOnInit(): void {
    const role = this.authService.getUser()?.role;
    this.isProfessor.set(role === 'PROFESSOR');
    this.isSecretaria.set(role === 'SECRETARIA');

    if (!this.isProfessor()) {
      this.usuariosService.listarResumo(1, 100, undefined, 'PROFESSOR').subscribe({
        next: res => this.professores.set(res.data),
        error: () => this.toast.erro('Nao foi possivel carregar os professores disponiveis.'),
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
            this.toast.erro('Nao foi possivel buscar alunos.');
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

  // ── Handlers de wizard ─────────────────────────────────────────────────────

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
      this.toast.erro('Selecione o professor responsavel.');
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
      document.querySelector('.wizard-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }

  // ── Handlers do template ───────────────────────────────────────────────────

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

  abrirAcompanhamentoDuplicado(): void {
    const existente = this.duplicado();
    if (existente) this.router.navigate(['/admin/atendimentos-individuais', existente.id]);
  }

  limparDuplicidade(): void {
    this.duplicado.set(null);
  }

  nomeProfessor(): string {
    if (!this.professorId) return '—';
    const prof = this.professores().find(p => p.id === this.professorId);
    return prof ? `${prof.nome}${prof.matricula ? ' — ' + prof.matricula : ''}` : '—';
  }

  // ── Lógica de persistência ─────────────────────────────────────────────────

  salvar(ignorarDuplicidade = false): void {
    if (!this.alunoId || !this.assuntoAtual.trim()) {
      this.toast.erro('Informe o aluno e o assunto principal.');
      return;
    }
    if (!this.isProfessor() && !this.professorId) {
      this.toast.erro('Selecione o professor responsavel.');
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
        this.toast.sucesso('Acompanhamento individual criado.');
        this.router.navigate(['/admin/atendimentos-individuais', acompanhamento.id]);
      },
      error: () => {
        this.salvando.set(false);
        this.toast.erro('Nao foi possivel criar o acompanhamento.');
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
          this.toast.erro('Ja existe um acompanhamento semelhante em andamento.');
          return;
        }
        this.salvar(true);
      },
      error: () => {
        this.verificandoDuplicidade.set(false);
        this.toast.erro('Nao foi possivel verificar acompanhamentos semelhantes.');
      },
    });
  }
}
