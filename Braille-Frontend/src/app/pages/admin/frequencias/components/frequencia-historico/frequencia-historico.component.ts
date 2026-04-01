import { Component, ChangeDetectionStrategy, inject, DestroyRef, signal, computed, Input, OnInit, ViewChildren, QueryList, HostListener, AfterViewInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { A11yModule, FocusKeyManager } from '@angular/cdk/a11y';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FrequenciasService, Frequencia, ResumoFrequencia } from '../../../../../core/services/frequencias.service';
import { Turma } from '../../../../../core/services/turmas.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { TabelaTrFocavelDirective } from '../../frequencias-lista/frequencias-lista';

@Component({
  selector: 'app-frequencia-historico',
  standalone: true,
  imports: [CommonModule, FormsModule, A11yModule, TabelaTrFocavelDirective],
  providers: [DatePipe],
  templateUrl: './frequencia-historico.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FrequenciaHistoricoComponent implements OnInit, AfterViewInit {
  private readonly frequenciasService = inject(FrequenciasService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly datePipe = inject(DatePipe);

  @Input() turmas: Turma[] = [];

  readonly turmaSelecionadaId = signal<string>('');
  readonly isProfessor = signal<boolean>(false);
  readonly userId = signal<string>('');

  // Estados Baseados em Signals
  readonly historico = signal<ResumoFrequencia[]>([]);
  readonly carregandoHistorico = signal<boolean>(false);
  readonly totalHistorico = signal<number>(0);
  readonly paginaHistorico = signal<number>(1);
  readonly erroHistorico = signal<string>('');
  readonly feedbackSalvo = signal<string>('');

  // Detalhes / Modal
  readonly modalDetalhesAberto = signal<boolean>(false);
  readonly detalhesResumo = signal<any>(null);
  readonly detalhesAlunos = signal<Frequencia[]>([]);
  readonly carregandoDetalhes = signal<boolean>(false);
  private lastFocusBeforeModal: HTMLElement | null = null;

  // Computed Properties (Sem Recalculo Constante)
  readonly totalPaginas = computed(() => Math.ceil(this.totalHistorico() / 20) || 1);

  // Expõe Math genético pro template HTML se precisar, mas uso computed preferencialmente
  readonly Math = Math;

  // Acessibilidade Table
  @ViewChildren(TabelaTrFocavelDirective) linhasTabela!: QueryList<TabelaTrFocavelDirective>;
  public keyManager!: FocusKeyManager<TabelaTrFocavelDirective>;

  ngOnInit(): void {
    const user = this.authService.getUser();
    this.isProfessor.set(user?.role === 'PROFESSOR');
    this.userId.set(user?.sub || '');
    // Init carregar na montagem inicial da aba
    this.carregarHistorico();
  }

  ngAfterViewInit(): void {
    this.keyManager = new FocusKeyManager(this.linhasTabela).withWrap();
    this.linhasTabela.changes.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.keyManager.withWrap();
    });
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    if (this.keyManager && !this.modalDetalhesAberto() && ['ArrowUp', 'ArrowDown'].includes(event.key)) {
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

  updateTurma(id: string) {
    this.turmaSelecionadaId.set(id);
  }

  carregarHistorico(): void {
    this.carregandoHistorico.set(true);
    this.erroHistorico.set('');

    const turmaId = this.turmaSelecionadaId() || undefined;
    const profId = this.isProfessor() ? this.userId() : undefined;

    this.frequenciasService.listarResumo(this.paginaHistorico(), 20, turmaId, profId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.historico.set(res.data);
          this.totalHistorico.set(res.meta.total);
          this.carregandoHistorico.set(false);
        },
        error: () => {
          this.erroHistorico.set('Erro ao carregar histórico.');
          this.carregandoHistorico.set(false);
        }
      });
  }

  paginaAnteriorHistorico(): void {
    const atual = this.paginaHistorico();
    if (atual > 1) {
      this.paginaHistorico.set(atual - 1);
      this.carregarHistorico();
    }
  }

  proximaPaginaHistorico(): void {
    const atual = this.paginaHistorico();
    if (atual < this.totalPaginas()) {
      this.paginaHistorico.set(atual + 1);
      this.carregarHistorico();
    }
  }

  // ── Modal Histórico com Dialog Semântico ─────────────────────────────────
  abrirDetalhes(resumo: any): void {
    this.lastFocusBeforeModal = document.activeElement as HTMLElement;
    this.detalhesResumo.set(resumo);
    this.carregandoDetalhes.set(true);
    this.modalDetalhesAberto.set(true);
    this.detalhesAlunos.set([]);

    this.frequenciasService.listar(1, 400, resumo.turmaId, resumo.dataAula)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.detalhesAlunos.set(res.data);
          this.carregandoDetalhes.set(false);
        },
        error: () => {
          this.carregandoDetalhes.set(false);
        }
      });
  }

  fecharDetalhes(): void {
    this.modalDetalhesAberto.set(false);
    this.detalhesResumo.set(null);
    setTimeout(() => this.lastFocusBeforeModal?.focus(), 0);
  }
}
