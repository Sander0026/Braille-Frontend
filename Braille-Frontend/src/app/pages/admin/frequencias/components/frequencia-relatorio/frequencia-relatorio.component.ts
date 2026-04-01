import { Component, ChangeDetectionStrategy, inject, DestroyRef, signal, Input, OnInit, ViewChildren, QueryList, HostListener, AfterViewInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { A11yModule, FocusKeyManager } from '@angular/cdk/a11y';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FrequenciasService } from '../../../../../core/services/frequencias.service';
import { TurmasService, Turma } from '../../../../../core/services/turmas.service';
import { TabelaTrFocavelDirective } from '../../frequencias-lista/frequencias-lista';

@Component({
  selector: 'app-frequencia-relatorio',
  standalone: true,
  imports: [CommonModule, FormsModule, A11yModule, TabelaTrFocavelDirective],
  providers: [DatePipe],
  templateUrl: './frequencia-relatorio.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FrequenciaRelatorioComponent implements OnInit, AfterViewInit {
  private readonly frequenciasService = inject(FrequenciasService);
  private readonly turmasService = inject(TurmasService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly datePipe = inject(DatePipe);

  @Input() turmas: Turma[] = [];

  readonly turmaSelecionadaId = signal<string>('');
  readonly alunoSelecionadoId = signal<string>('');
  readonly alunosRelatorio = signal<any[]>([]);

  readonly relatorioEstatisticas = signal<any>(null);
  readonly relatorioHistorico = signal<any[]>([]);
  readonly carregandoRelatorio = signal<boolean>(false);
  readonly erroRelatorio = signal<string>('');

  // Acessibilidade Tabela Relatório
  @ViewChildren(TabelaTrFocavelDirective) linhasTabela!: QueryList<TabelaTrFocavelDirective>;
  public keyManager!: FocusKeyManager<TabelaTrFocavelDirective>;

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.keyManager = new FocusKeyManager(this.linhasTabela).withWrap();
    this.linhasTabela.changes.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.keyManager.withWrap();
    });
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    if (this.keyManager && ['ArrowUp', 'ArrowDown'].includes(event.key)) {
      this.keyManager.onKeydown(event);
      event.preventDefault();
    }
  }

  formatarData(iso: string): string {
    if (!iso) return '—';
    const partes = iso.substring(0, 10).split('-');
    if (partes.length !== 3) return iso;
    const [ano, mes, dia] = partes;
    return `${dia}/${mes}/${ano}`;
  }

  onTurmaRelatorioChange(turmaId: string): void {
    this.turmaSelecionadaId.set(turmaId);
    this.alunoSelecionadoId.set('');
    this.relatorioEstatisticas.set(null);
    this.relatorioHistorico.set([]);
    this.alunosRelatorio.set([]);

    if (!turmaId) return;

    this.turmasService.buscarPorId(turmaId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (turma) => {
          const m = (turma.matriculasOficina ?? []).map((mb: any) => mb.aluno).filter(Boolean);
          this.alunosRelatorio.set(m);
        }
      });
  }

  updateAluno(alunoId: string) {
    this.alunoSelecionadoId.set(alunoId);
  }

  carregarRelatorio(): void {
    const tId = this.turmaSelecionadaId();
    const aId = this.alunoSelecionadoId();
    if (!tId || !aId) return;

    this.carregandoRelatorio.set(true);
    this.erroRelatorio.set('');

    this.frequenciasService.obterRelatorioAluno(tId, aId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.relatorioEstatisticas.set(res.estatisticas);
          this.relatorioHistorico.set(res.historico);
          this.carregandoRelatorio.set(false);
        },
        error: () => {
          this.erroRelatorio.set('Erro ao carregar relatório do aluno.');
          this.carregandoRelatorio.set(false);
        }
      });
  }
}
