import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, finalize, takeUntil } from 'rxjs';
import {
  Beneficiario,
  BeneficiariosService,
  LinhaTempoAlunoResumo,
  LinhaTempoTurmaResumo,
} from '../../../core/services/beneficiarios.service';
import { DataBraillePipe } from '../../../shared/pipes/data-braille.pipe';
import { AlunoLinhaTempoComponent } from '../components/aluno-linha-tempo/aluno-linha-tempo';

@Component({
  selector: 'app-aluno-linha-tempo-page',
  standalone: true,
  imports: [CommonModule, FormsModule, DataBraillePipe, AlunoLinhaTempoComponent],
  templateUrl: './aluno-linha-tempo-page.html',
  styleUrl: './aluno-linha-tempo-page.scss',
})
export class AlunoLinhaTempoPage implements OnInit, OnDestroy {
  readonly tiposObservacao = [
    'Reuniao com familia',
    'Entrega de material',
    'Contato com responsavel',
    'Encaminhamento externo',
    'Orientacao da secretaria',
    'Observacao administrativa',
  ];

  alunoId = '';
  aluno: Beneficiario | null = null;
  carregandoAluno = true;
  erro = '';
  resumo: LinhaTempoAlunoResumo = { totalEventos: 0 };
  refreshKey = 0;
  observacaoAberta = false;
  salvandoObservacao = false;
  erroObservacao = '';
  turmasObservacao: LinhaTempoTurmaResumo[] = [];
  observacaoManual = this.novaObservacaoManual();

  private readonly destroy$ = new Subject<void>();
  private destruido = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly beneficiariosService: BeneficiariosService,
    private readonly cdr: ChangeDetectorRef,
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
    this.destruido = true;
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

  abrirObservacaoManual(): void {
    this.observacaoManual = this.novaObservacaoManual();
    this.erroObservacao = '';
    this.observacaoAberta = true;
    this.carregarTurmasObservacao();
  }

  fecharObservacaoManual(): void {
    if (this.salvandoObservacao) return;
    this.observacaoAberta = false;
  }

  selecionarTipoObservacao(titulo: string): void {
    this.observacaoManual.titulo = titulo;
  }

  salvarObservacaoManual(): void {
    const titulo = this.observacaoManual.titulo.trim();
    if (!titulo) {
      this.erroObservacao = 'Informe um titulo para a observacao.';
      return;
    }

    this.salvandoObservacao = true;
    this.erroObservacao = '';

    this.beneficiariosService
      .criarEventoLinhaTempoManual(this.alunoId, {
        tipo: 'OBSERVACAO_MANUAL',
        dataEvento: this.observacaoManual.dataEvento || undefined,
        titulo,
        descricao: this.observacaoManual.descricao.trim() || undefined,
        turmaId: this.observacaoManual.turmaId || undefined,
        sensivel: this.observacaoManual.sensivel,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.salvandoObservacao = false;
          this.observacaoAberta = false;
          this.refreshKey++;
          this.carregarResumoLinhaTempo();
          this.atualizarTela();
        },
        error: (err) => {
          this.erroObservacao = err?.error?.message || 'Nao foi possivel registrar a observacao.';
          this.salvandoObservacao = false;
          this.atualizarTela();
        },
      });
  }

  private carregarAluno(): void {
    this.carregandoAluno = true;
    this.erro = '';

    this.beneficiariosService
      .buscarPorId(this.alunoId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.carregandoAluno = false;
          this.atualizarTela();
        }),
      )
      .subscribe({
        next: (aluno) => {
          this.aluno = aluno;
        },
        error: (err) => {
          this.erro = err?.error?.message || 'Nao foi possivel carregar os dados do aluno.';
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
          this.atualizarTela();
        },
        error: () => {
          this.resumo = { totalEventos: 0 };
          this.atualizarTela();
        },
      });
  }

  private carregarTurmasObservacao(): void {
    this.beneficiariosService
      .linhaTempoTurmas(this.alunoId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (turmas) => {
          this.turmasObservacao = turmas;
          this.atualizarTela();
        },
        error: () => {
          this.turmasObservacao = [];
          this.atualizarTela();
        },
      });
  }

  private novaObservacaoManual() {
    return {
      titulo: '',
      descricao: '',
      dataEvento: new Date().toISOString().slice(0, 10),
      turmaId: '',
      sensivel: false,
    };
  }

  private atualizarTela(): void {
    if (this.destruido) return;
    this.cdr.detectChanges();
  }
}
