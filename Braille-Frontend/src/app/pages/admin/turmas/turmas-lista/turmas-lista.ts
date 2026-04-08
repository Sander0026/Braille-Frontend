import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { A11yModule } from '@angular/cdk/a11y';

import { Turma, TurmasService, CreateTurmaDto, TurmaStatus } from '../../../../core/services/turmas.service';
import { ConfirmDialogService } from '../../../../core/services/confirm-dialog.service';
import { ToastService } from '../../../../core/services/toast.service';
import { UsuariosService, Usuario } from '../../../../core/services/usuarios.service';
import { AuthService } from '../../../../core/services/auth.service';

import { TurmaFiltroDrawerComponent } from '../components/turma-filtro-drawer/turma-filtro-drawer.component';
import { TurmaFormModalComponent } from '../components/turma-form-modal/turma-form-modal.component';
import { TurmaAlunosModalComponent } from '../components/turma-alunos-modal/turma-alunos-modal.component';

@Component({
  selector: 'app-turmas-lista',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    A11yModule,
    TurmaFiltroDrawerComponent,
    TurmaFormModalComponent,
    TurmaAlunosModalComponent
  ],
  templateUrl: './turmas-lista.html',
  styleUrl: './turmas-lista.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TurmasLista implements OnInit {
  private readonly turmasService = inject(TurmasService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  // Estado da Lista
  readonly turmas = signal<Turma[]>([]);
  readonly carregando = signal<boolean>(true);
  readonly professoresDisponiveis = signal<Usuario[]>([]);
  readonly isProfessor = signal<boolean>(false);
  
  // Controle de Tabs e Status
  readonly statusCount = signal<Record<string, number>>({});
  readonly abaAtiva = signal<'ATIVO' | 'ARQUIVADO'>('ATIVO');
  
  // Controle do Drawer
  readonly drawerAberto = signal(false);
  readonly tempProfessorId = signal<string>('');
  readonly tempStatus = signal<string>('');
  readonly termoBusca = signal<string>('');
  
  // Estado dos Modais
  readonly turmaAtiva = signal<Turma | null>(null);

  readonly modalEditarAberto = signal(false);
  readonly salvandoTurma = signal(false);
  readonly erroSalvarTurma = signal<string>('');

  readonly modalAlunosAberto = signal(false);

  // Todas as turmas que batem com os filtros do drawer + busca (ignorando qual aba tá aberta)
  readonly turmasMatchesFilters = computed(() => {
    let t = this.turmas();
    
    const profId = this.tempProfessorId();
    if (profId) t = t.filter(x => x.professor?.id === profId);

    const status = this.tempStatus();
    if (status) t = t.filter(x => x.status === status);

    const busca = (this.termoBusca() || '').toLowerCase().trim();
    if (busca) t = t.filter(x => (x.nome || '').toLowerCase().includes(busca));

    return t;
  });

  // Lista efetivamente renderizada (Aplica a separação da Aba atual sobre o Matcher)
  readonly turmasFiltradas = computed(() => {
    let t = this.turmasMatchesFilters();
    if (this.abaAtiva() === 'ATIVO') {
      return t.filter(x => x.statusAtivo);
    } else {
      return t.filter(x => !x.statusAtivo && !x.excluido);
    }
  });

  // Contadores dinâmicos reais para as tabs
  readonly titleAtivo = computed(() => {
    const total = this.turmasMatchesFilters().filter(x => x.statusAtivo).length;
    return `Ativas (${total})`;
  });

  readonly titleArquivado = computed(() => {
    const total = this.turmasMatchesFilters().filter(x => !x.statusAtivo && !x.excluido).length;
    return `Arquivadas (${total})`;
  });

  ngOnInit(): void {
    const user = this.authService.getUser();
    this.isProfessor.set(user?.role === 'PROFESSOR');
    
    // Paralelismo inicial com Promise.all via RxJS forkJoin (ou carrega professores independente)
    this.carregarProfessores();
    this.carregarTurmas();
  }

  carregarProfessores() {
    this.usuariosService.listar(1, 100, undefined, false, 'PROFESSOR')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.professoresDisponiveis.set(res.data.filter(u => u.statusAtivo !== false));
        },
        error: () => {
          this.toast.erro('Não foi possível carregar a base de professores.');
        }
      });
  }

  carregarTurmas() {
    this.carregando.set(true);

    // Bypassing exclusion & activity block to allow fetching both Active and Archived turmas simultaneously
    this.turmasService.listar(1, 100, undefined, 'all', this.tempProfessorId() || undefined, this.tempStatus() || undefined, 'all')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.turmas.set(res.data);
          this.statusCount.set({
            arquivadas: res.data.filter(t => !t.statusAtivo && !t.excluido).length
          });
          this.carregando.set(false);
        },
        error: () => {
          this.carregando.set(false);
          this.toast.erro('Não foi possível carregar as turmas.');
        }
      });
  }

  // Ações de Filtragem e UI
  mudarAba(aba: 'ATIVO' | 'ARQUIVADO') {
    this.abaAtiva.set(aba);
  }

  abrirFiltros() {
    this.drawerAberto.set(true);
  }

  fecharFiltros() {
    this.drawerAberto.set(false);
  }

  aplicarFiltros(filtros: { professorId: string; status: string }) {
    this.tempProfessorId.set(filtros.professorId);
    this.tempStatus.set(filtros.status);
    this.carregarTurmas(); // Dispara load no backend via API page
    this.fecharFiltros();
  }

  limparFiltrosDrawer() {
    this.tempProfessorId.set('');
    this.tempStatus.set('');
    this.carregarTurmas();
    this.fecharFiltros();
  }

  formatarGradeHoraria(grade: Turma['gradeHoraria']): string {
    if (!grade || grade.length === 0) return 'Horário a definir';
    return grade.map(g => {
      const hInit = this.minutosParaHm(g.horaInicio);
      const hEnd = this.minutosParaHm(g.horaFim);
      return `${g.dia} ${hInit}-${hEnd}`;
    }).join(', ');
  }

  minutosParaHm(min: number): string {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  // Modais de Criação e Edição
  abrirModalCriar() {
    this.turmaAtiva.set(null);
    this.erroSalvarTurma.set('');
    this.modalEditarAberto.set(true);
  }

  abrirModalEditar(turma: Turma) {
    this.turmaAtiva.set(turma);
    this.erroSalvarTurma.set('');
    this.modalEditarAberto.set(true);
  }

  async tentarFecharSujo(dirty: boolean) {
    if (dirty) {
      const p = await this.confirmDialog.confirmar({
        titulo: 'Descartar alterações?',
        mensagem: 'Você tem mudanças não salvas. Deseja sair sem salvar?',
        textoBotaoConfirmar: 'Descartar',
        textoBotaoCancelar: 'Continuar editando'
      });
      if (p) this.modalEditarAberto.set(false);
    } else {
      this.modalEditarAberto.set(false);
    }
  }

  salvarOficina(payload: CreateTurmaDto) {
    this.salvandoTurma.set(true);
    const idEdicao = this.turmaAtiva()?.id;

    const request$ = idEdicao 
      ? this.turmasService.atualizar(idEdicao, payload)
      : this.turmasService.criar(payload);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.salvandoTurma.set(false);
        this.modalEditarAberto.set(false);
        this.toast.sucesso(`Oficina ${idEdicao ? 'atualizada' : 'criada'} com sucesso.`);
        this.carregarTurmas();
      },
      error: (e) => {
        this.salvandoTurma.set(false);
        this.erroSalvarTurma.set(e?.error?.message || 'Erro de conexão/servidor ao salvar oficina.');
      }
    });
  }

  // Modal Alunos
  abrirModalAlunos(turma: Turma) {
    this.turmaAtiva.set(turma);
    this.modalAlunosAberto.set(true);
  }

  fecharModalAlunos() {
    this.modalAlunosAberto.set(false);
  }

  // Arquivamento
  async alternarArquivamento(turmaId: string, arquivada: boolean, event: Event) {
    event.stopPropagation();
    
    if (this.isProfessor()) {
      this.toast.erro('Ação não permitida para o seu perfil.');
      return;
    }

    const mAction = arquivada ? 'desarquivar' : 'arquivar';
    const ok = await this.confirmDialog.confirmar({
      titulo: arquivada ? 'Desarquivar a oficina?' : 'Arquivar a oficina?',
      mensagem: arquivada 
        ? 'A oficina voltará a aparecer na aba de Ativas.' 
        : 'Tem certeza? A oficina sairá da visão principal e não aceitará novas ações até ser desarquivada.',
      textoBotaoConfirmar: `Sim, ${mAction}`
    });

    if (!ok) return;

    const action$ = arquivada ? this.turmasService.restaurar(turmaId) : this.turmasService.excluir(turmaId);
    
    action$.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.sucesso(`Oficina ${arquivada ? 'desarquivada' : 'arquivada'} com sucesso.`);
          // Optimistic UI Update: Mudamos localmente e os Signals recomputam a aba em 0.1ms 
          this.turmas.update(lista => lista.map(t => t.id === turmaId ? { ...t, statusAtivo: arquivada } : t));
        },
        error: () => {
          this.toast.erro('Inconsistência de acesso para arquivamento.');
        }
      });
  }

  // Soft Delete (Ocultar da Tela Visualmente mas reter relacionamentos)
  async removerDaLista(turmaId: string, event: Event) {
    event.stopPropagation();
    
    if (this.isProfessor()) {
      this.toast.erro('Ação não permitida para o seu perfil.');
      return;
    }

    const ok = await this.confirmDialog.confirmar({
      titulo: 'Remover Permanentemente?',
      mensagem: 'Tem certeza? A oficina será ocultada do sistema sem apagar o histórico ligado aos alunos.',
      textoBotaoConfirmar: 'Sim, Remover',
      textoBotaoCancelar: 'Cancelar'
    });

    if (!ok) return;

    this.turmasService.ocultarDaAba(turmaId).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.sucesso('Oficina removida da lista com sucesso.');
          // Optimistic UI Update: Aplicamos as chaves como Ocultas na memória do front.
          this.turmas.update(lista => lista.map(t => t.id === turmaId ? { ...t, excluido: true, statusAtivo: false } : t));
        },
        error: () => this.toast.erro('Inconsistência de acesso para remoção visual.')
      });
  }

  // Mudança Rápida de Status via Selector do Card
  async atualizarStatusRapido(turma: Turma, novoStatus: TurmaStatus) {
    if (turma.status === novoStatus) return;

    if (this.isProfessor()) {
      this.toast.erro('Ação não permitida para o seu perfil.');
      this.turmas.update(t => [...t]); // Reverte UI
      return;
    }

    const ok = await this.confirmDialog.confirmar({
      titulo: 'Alterar Status',
      mensagem: `Confirma a alteração da oficina "${turma.nome}" para ${novoStatus}?`,
      textoBotaoConfirmar: 'Sim, alterar',
      textoBotaoCancelar: 'Cancelar'
    });

    if (!ok) {
      this.turmas.update(t => [...t]); // Força re-render para reverter select
      return;
    }

    this.carregando.set(true);
    // Cast para bypass da DTO limpa preservando as restrições anti-any
    const payload = { status: novoStatus } as unknown as Partial<CreateTurmaDto>;
    this.turmasService.atualizar(turma.id, payload)
      .subscribe({
        next: () => {
          this.carregando.set(false);
          this.toast.sucesso(`Oficina alterada para ${novoStatus}`);
          // Optimistic UI Update: Sem recarregamento N+1 no Postgre, pura reatividade.
          this.turmas.update(lista => lista.map(t => t.id === turma.id ? { ...t, status: novoStatus } : t));
        },
        error: () => {
          this.carregando.set(false);
          this.toast.erro('Erro ao aplicar alteração de status.');
          this.turmas.update(t => [...t]); // Reverte UI
        }
      });
  }
}