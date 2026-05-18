import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import {
  Beneficiario,
  BeneficiariosService,
  LinhaTempoAlunoResumo,
} from '../../../core/services/beneficiarios.service';
import { DataBraillePipe } from '../../../shared/pipes/data-braille.pipe';
import { AlunoLinhaTempoComponent } from '../components/aluno-linha-tempo/aluno-linha-tempo';

@Component({
  selector: 'app-aluno-linha-tempo-page',
  standalone: true,
  imports: [CommonModule, DataBraillePipe, AlunoLinhaTempoComponent],
  templateUrl: './aluno-linha-tempo-page.html',
  styleUrl: './aluno-linha-tempo-page.scss',
})
export class AlunoLinhaTempoPage implements OnInit, OnDestroy {
  alunoId = '';
  aluno: Beneficiario | null = null;
  carregandoAluno = true;
  erro = '';
  resumo: LinhaTempoAlunoResumo = { totalEventos: 0 };
  refreshKey = 0;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly beneficiariosService: BeneficiariosService,
  ) {}

  ngOnInit(): void {
    this.alunoId = this.route.snapshot.paramMap.get('id') ?? '';
    if (!this.alunoId) {
      this.erro = 'Aluno nao informado.';
      this.carregandoAluno = false;
      return;
    }

    this.carregarAluno();
    this.carregarResumoLinhaTempo();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  voltar(): void {
    this.router.navigate(['/admin/alunos']);
  }

  atualizar(): void {
    this.refreshKey++;
    this.carregarAluno();
    this.carregarResumoLinhaTempo();
  }

  exportar(): void {
    // Reservado para a proxima fase de exportacao.
  }

  private carregarAluno(): void {
    this.carregandoAluno = true;
    this.erro = '';

    this.beneficiariosService
      .buscarPorId(this.alunoId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (aluno) => {
          this.aluno = aluno;
          this.carregandoAluno = false;
        },
        error: (err) => {
          this.erro = err?.error?.message || 'Nao foi possivel carregar os dados do aluno.';
          this.carregandoAluno = false;
        },
      });
  }

  private carregarResumoLinhaTempo(): void {
    this.beneficiariosService
      .linhaTempoResumo(this.alunoId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resumo) => {
          this.resumo = resumo;
        },
        error: () => {
          this.resumo = { totalEventos: 0 };
        },
      });
  }
}
