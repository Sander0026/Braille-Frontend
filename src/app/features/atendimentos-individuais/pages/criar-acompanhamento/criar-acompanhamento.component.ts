import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { Beneficiario, BeneficiariosService } from '../../../../core/services/beneficiarios.service';
import { Usuario, UsuariosService } from '../../../../core/services/usuarios.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AtendimentosIndividuaisApiService } from '../../services/atendimentos-individuais-api.service';
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
  private readonly api = inject(AtendimentosIndividuaisApiService);
  private readonly beneficiariosService = inject(BeneficiariosService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly alunos = signal<Beneficiario[]>([]);
  readonly professores = signal<Usuario[]>([]);
  readonly salvando = signal(false);
  readonly incluirPrimeiroAtendimento = signal(true);
  readonly isProfessor = signal(false);

  alunoId = '';
  professorId = '';
  assuntoAtual = '';
  descricao = '';
  primeiroAtendimento: CriarAtendimentoIndividualPayload | null = null;

  ngOnInit(): void {
    this.isProfessor.set(this.authService.getUser()?.role === 'PROFESSOR');
    this.beneficiariosService.listar(1, 200, undefined, false).subscribe({ next: res => this.alunos.set(res.data) });
    if (!this.isProfessor()) {
      this.usuariosService.listar(1, 200, undefined, false, 'PROFESSOR').subscribe({ next: res => this.professores.set(res.data) });
    }
  }

  selecionarAluno(aluno: Beneficiario | null): void {
    this.alunoId = aluno?.id ?? '';
  }

  capturarPrimeiroAtendimento(payload: CriarAtendimentoIndividualPayload): void {
    this.primeiroAtendimento = payload;
    this.salvar();
  }

  salvarSemPrimeiroAtendimento(): void {
    this.primeiroAtendimento = null;
    this.salvar();
  }

  private salvar(): void {
    if (!this.alunoId || !this.assuntoAtual.trim()) {
      this.toast.erro('Informe o aluno e o assunto principal.');
      return;
    }
    if (!this.isProfessor() && !this.professorId) {
      this.toast.erro('Selecione o professor responsavel.');
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
}
