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
import { AtendimentoFormComponent } from '../../components/atendimento-form/atendimento-form.component';
import { CriarAtendimentoIndividualPayload } from '../../models/atendimento-individual.model';

@Component({
  selector: 'app-criar-acompanhamento',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AlunoAutocompleteComponent, AtendimentoFormComponent],
  templateUrl: './criar-acompanhamento.component.html',
  styleUrl: './criar-acompanhamento.component.scss',
})
export class CriarAcompanhamentoComponent implements OnInit {
  private readonly api                 = inject(AtendimentosIndividuaisApiService);
  private readonly beneficiariosService = inject(BeneficiariosService);
  private readonly usuariosService      = inject(UsuariosService);
  private readonly authService          = inject(AuthService);
  private readonly toast                = inject(ToastService);
  private readonly router               = inject(Router);
  private readonly destroyRef           = inject(DestroyRef);

  // ── Signals de estado ──────────────────────────────────────────────────────
  readonly alunos                   = signal<BeneficiarioResumo[]>([]);
  readonly professores              = signal<Usuario[]>([]);
  readonly salvando                 = signal(false);
  readonly incluirPrimeiroAtendimento = signal(true);
  readonly isProfessor              = signal(false);
  readonly isSecretaria             = signal(false);
  readonly buscandoAlunos           = signal(false);
  readonly duplicado                = signal<AcompanhamentoIndividual | null>(null);
  readonly verificandoDuplicidade   = signal(false);

  // ── Dados do formulário ────────────────────────────────────────────────────
  alunoId    = '';
  professorId = '';
  assuntoAtual = '';
  descricao   = '';
  primeiroAtendimento: CriarAtendimentoIndividualPayload | null = null;

  // ── Pipeline RxJS para busca com debounce ─────────────────────────────────
  // Substitui o setTimeout manual que existia no componente filho.
  // switchMap cancela requisições anteriores em voo automaticamente.
  private readonly buscaSubject = new Subject<string>();

  ngOnInit(): void {
    const role = this.authService.getUser()?.role;
    this.isProfessor.set(role === 'PROFESSOR');
    this.isSecretaria.set(role === 'SECRETARIA');

    if (this.isSecretaria()) {
      this.incluirPrimeiroAtendimento.set(false);
    }

    if (!this.isProfessor()) {
      this.usuariosService.listarResumo(1, 100, undefined, 'PROFESSOR').subscribe({
        next: res => this.professores.set(res.data),
        error: () => this.toast.erro('Nao foi possivel carregar os professores disponiveis.'),
      });
    }

    // Configura o pipeline de busca com debounce de 300ms
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

  // ── Handlers do template ───────────────────────────────────────────────────

  /** Recebe o evento (search) do AlunoAutocompleteComponent e alimenta o Subject */
  buscarAlunos(termo: string): void {
    this.buscaSubject.next(termo);
  }

  selecionarAluno(aluno: BeneficiarioResumo | null): void {
    this.alunoId = aluno?.id ?? '';
    this.duplicado.set(null);
  }

  capturarPrimeiroAtendimento(payload: CriarAtendimentoIndividualPayload): void {
    this.primeiroAtendimento = payload;
    this.salvar();
  }

  salvarSemPrimeiroAtendimento(): void {
    this.primeiroAtendimento = null;
    this.salvar();
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

  // ── Lógica de persistência ─────────────────────────────────────────────────

  private salvar(ignorarDuplicidade = false): void {
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
      primeiroAtendimento: this.incluirPrimeiroAtendimento() ? this.primeiroAtendimento ?? undefined : undefined,
    }).subscribe({
      next: acompanhamento => {
        this.salvando.set(false);
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
