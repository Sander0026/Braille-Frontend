import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { A11yModule } from '@angular/cdk/a11y';

import { Turma, TurmasService, CreateTurmaDto } from '../../../../core/services/turmas.service';
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
  
  // Estado dos Modais
  readonly turmaAtiva = signal<Turma | null>(null);

  readonly modalEditarAberto = signal(false);
  readonly salvandoTurma = signal(false);
  readonly erroSalvarTurma = signal<string>('');

  readonly modalAlunosAberto = signal(false);

  // Computeds
  readonly turmasFiltradas = computed(() => {
    let t = this.turmas();
    
    // 1. Aba
    if (this.abaAtiva() === 'ATIVO') {
      t = t.filter(x => !x.excluido);
    } else {
      t = t.filter(x => x.excluido);
    }

    // 2. Filtro de Professor
    const profId = this.tempProfessorId();
    if (profId) {
      t = t.filter(x => x.professor?.id === profId);
    }

    // 3. Filtro de Status
    const status = this.tempStatus();
    if (status) {
      t = t.filter(x => x.status === status);
    }

    return t;
  });

  readonly titleAtivo = computed(() => {
    const total = this.turmasFiltradas().length;
    return `Ativas (${total})`;
  });

  readonly titleArquivado = computed(() => {
    return `Arquivadas (${this.statusCount()['arquivadas'] || 0})`;
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

    // Chama o serviço de listar (supondo que ignore os excluídos se não filtrarmos propriamente, mas a API retorna todos? Vamos tentar)
    this.turmasService.listar(1, 100, undefined, undefined, this.tempProfessorId() || undefined, this.tempStatus() || undefined)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.turmas.set(res.data);
          this.statusCount.set({
            arquivadas: res.data.filter(t => t.excluido).length
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
          this.carregarTurmas();
        },
        error: () => {
          this.toast.erro('Inconsistência de acesso para arquivamento.');
        }
      });
  }
}