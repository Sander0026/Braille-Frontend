import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RelatorioAtendimentoApiService } from '../../services/relatorio-atendimento-api.service';
import { RelatorioAtendimentoIndividual } from '../../models/relatorio-atendimento.model';
import { ResumoAtendimentosComponent } from '../../components/resumo-atendimentos/resumo-atendimentos.component';
import { AlunoAutocompleteComponent } from '../../components/aluno-autocomplete/aluno-autocomplete.component';
import { BeneficiarioResumo, BeneficiariosService } from '../../../../core/services/beneficiarios.service';
import { Usuario, UsuariosService } from '../../../../core/services/usuarios.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-relatorio-atendimento',
  standalone: true,
  imports: [CommonModule, FormsModule, ResumoAtendimentosComponent, AlunoAutocompleteComponent],
  templateUrl: './relatorio-atendimento.component.html',
  styleUrl: './relatorio-atendimento.component.scss',
})
export class RelatorioAtendimentoComponent {
  private readonly api = inject(RelatorioAtendimentoApiService);
  private readonly beneficiariosService = inject(BeneficiariosService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  readonly relatorio = signal<RelatorioAtendimentoIndividual | null>(null);
  readonly alunos = signal<BeneficiarioResumo[]>([]);
  readonly alunoSelecionado = signal<BeneficiarioResumo | null>(null);
  readonly professores = signal<Usuario[]>([]);
  carregando = false;
  exportandoPdf = false;
  readonly isProfessor = this.authService.getUser()?.role === 'PROFESSOR';
  filtros = {
    alunoId: '',
    professorId: '',
    dataInicio: '',
    dataFim: '',
    status: '',
    tipoRegistro: '',
  };

  constructor() {
    if (!this.isProfessor) {
      this.usuariosService.listarResumo(1, 100, undefined, 'PROFESSOR').subscribe({
        next: res => this.professores.set(res.data),
      });
    }
  }

  selecionarAluno(aluno: BeneficiarioResumo | null): void {
    this.alunoSelecionado.set(aluno);
    this.filtros.alunoId = aluno?.id ?? '';
  }

  buscarAlunos(termo: string): void {
    this.beneficiariosService.buscarResumo(termo).subscribe({
      next: alunos => this.alunos.set(alunos),
      error: () => this.toast.erro('Nao foi possivel buscar alunos.'),
    });
  }

  gerar(): void {
    if (!this.validarPeriodo()) return;

    this.carregando = true;
    this.api.gerar({
      alunoId: this.filtros.alunoId || undefined,
      professorId: this.filtros.professorId || undefined,
      dataInicio: this.filtros.dataInicio || undefined,
      dataFim: this.filtros.dataFim || undefined,
      status: this.filtros.status as any || undefined,
      tipoRegistro: this.filtros.tipoRegistro as any || undefined,
    }).subscribe({
      next: res => { this.relatorio.set(res); this.carregando = false; },
      error: () => {
        this.carregando = false;
        this.toast.erro('Nao foi possivel gerar o relatorio.');
      },
    });
  }

  imprimir(): void {
    window.print();
  }

  exportarPdf(): void {
    if (!this.validarPeriodo() || this.exportandoPdf) return;

    this.exportandoPdf = true;
    this.api.exportarPdf({
      alunoId: this.filtros.alunoId || undefined,
      professorId: this.filtros.professorId || undefined,
      dataInicio: this.filtros.dataInicio || undefined,
      dataFim: this.filtros.dataFim || undefined,
      status: this.filtros.status as any || undefined,
      tipoRegistro: this.filtros.tipoRegistro as any || undefined,
    }).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `relatorio-atendimento-individual-${new Date().toISOString().slice(0, 10)}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
        this.exportandoPdf = false;
      },
      error: () => {
        this.exportandoPdf = false;
        this.toast.erro('Nao foi possivel exportar o PDF.');
      },
    });
  }

  professorSelecionadoLabel(): string {
    if (this.isProfessor) return 'Usuario logado';
    if (!this.filtros.professorId) return 'Todos os professores';
    return this.professores().find(professor => professor.id === this.filtros.professorId)?.nome ?? 'Professor selecionado';
  }

  alunoSelecionadoLabel(): string {
    return this.alunoSelecionado()?.nomeCompleto ?? 'Todos os alunos';
  }

  periodoLabel(): string {
    if (!this.filtros.dataInicio && !this.filtros.dataFim) return 'Todo o periodo';
    return `${this.filtros.dataInicio || 'inicio'} ate ${this.filtros.dataFim || 'hoje'}`;
  }

  private validarPeriodo(): boolean {
    if (this.filtros.dataInicio && this.filtros.dataFim && this.filtros.dataInicio > this.filtros.dataFim) {
      this.toast.erro('A data inicial deve ser menor ou igual a data final.');
      return false;
    }
    return true;
  }
}
