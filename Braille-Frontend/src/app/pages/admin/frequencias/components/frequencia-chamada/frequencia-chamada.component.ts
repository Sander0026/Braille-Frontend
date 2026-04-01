import { Component, ChangeDetectionStrategy, inject, DestroyRef, signal, computed, Input, Output, EventEmitter, OnInit, ViewChildren, QueryList, HostListener, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { A11yModule, FocusKeyManager } from '@angular/cdk/a11y';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FrequenciasService } from '../../../../../core/services/frequencias.service';
import { TurmasService, Turma } from '../../../../../core/services/turmas.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { TabelaTrFocavelDirective } from '../../frequencias-lista/frequencias-lista.ts'; 

// Otimiza e expõe os tipos pra cá
export interface AlunoNaChamada {
  alunoId: string;
  nomeCompleto: string;
  frequenciaId?: string;
  presente: boolean;
  salvando: boolean;
  salvo: boolean;
  statusFrequencia?: 'PRESENTE' | 'FALTA' | 'FALTA_JUSTIFICADA';
  justificativaId?: string;
  atestadoUrl?: string;
}

@Component({
  selector: 'app-frequencia-chamada',
  standalone: true,
  imports: [CommonModule, FormsModule, A11yModule, TabelaTrFocavelDirective],
  templateUrl: './frequencia-chamada.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FrequenciaChamadaComponent implements OnInit, AfterViewInit {
  private readonly frequenciasService = inject(FrequenciasService);
  private readonly turmasService = inject(TurmasService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  @Input() turmas: Turma[] = [];

  readonly turmaSelecionadaId = signal<string>('');
  readonly dataAula = signal<string>(this.hojeISO());
  readonly isProfessor = signal<boolean>(false);
  readonly userId = signal<string>('');

  // Estados Baseados em Signals para Performance e A11Y
  readonly alunosNaChamada = signal<AlunoNaChamada[]>([]);
  readonly carregandoChamada = signal<boolean>(false);
  readonly salvandoTudo = signal<boolean>(false);
  readonly chamadaCarregada = signal<boolean>(false);
  readonly erroCarregamento = signal<string>('');
  readonly feedbackSalvo = signal<string>('');

  // Computed Properties (Sem Recalculo Constante)
  readonly turmaSelecionadaNome = computed(() => 
    this.turmas?.find(t => t.id === this.turmaSelecionadaId())?.nome ?? ''
  );

  readonly totalPresentes = computed(() => this.alunosNaChamada().filter(a => a.presente).length);
  readonly totalFaltas = computed(() => this.alunosNaChamada().filter(a => !a.presente && a.statusFrequencia !== 'FALTA_JUSTIFICADA').length);
  readonly totalJustificadas = computed(() => this.alunosNaChamada().filter(a => a.statusFrequencia === 'FALTA_JUSTIFICADA').length);
  readonly modoVisualizacao = computed(() => false);
  readonly nenhumaTurma = computed(() => this.alunosNaChamada().length === 0);

  // Acessibilidade
  @ViewChildren(TabelaTrFocavelDirective) linhasTabela!: QueryList<TabelaTrFocavelDirective>;
  public keyManager!: FocusKeyManager<TabelaTrFocavelDirective>;

  ngOnInit(): void {
    const user = this.authService.getUser();
    this.isProfessor.set(user?.role === 'PROFESSOR');
    this.userId.set(user?.sub || '');
  }

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

  hojeISO(): string {
    const d = new Date();
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
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

  updateData(dt: string) {
    this.dataAula.set(dt);
  }

  carregarChamada(): void {
    const turmaId = this.turmaSelecionadaId();
    const data = this.dataAula();

    if (!turmaId || !data) return;

    this.carregandoChamada.set(true);
    this.chamadaCarregada.set(false);
    this.erroCarregamento.set('');
    this.alunosNaChamada.set([]);
    this.feedbackSalvo.set('');

    this.turmasService.buscarPorId(turmaId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (turma) => {
          const alunos = (turma.matriculasOficina ?? []).map((m: any) => m.aluno).filter(Boolean);
          if (alunos.length === 0) {
            this.carregandoChamada.set(false);
            this.chamadaCarregada.set(true);
            return;
          }

          const profId = this.isProfessor() ? this.userId() : undefined;
          this.frequenciasService.listar(1, 100, turmaId, data, profId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: (res) => {
                const registrosExistentes = res.data;
                const mappedAlunos = alunos.map((aluno: any) => {
                  const registroExistente = registrosExistentes.find(f => f.alunoId === aluno.id);
                  const statusFreq = (registroExistente as any)?.status as 'PRESENTE' | 'FALTA' | 'FALTA_JUSTIFICADA' | undefined;
                  const isFJ = statusFreq === 'FALTA_JUSTIFICADA';
                  return {
                    alunoId: aluno.id,
                    nomeCompleto: aluno.nomeCompleto,
                    frequenciaId: registroExistente?.id,
                    presente: isFJ ? false : (registroExistente?.presente ?? true),
                    salvando: false,
                    salvo: !!registroExistente,
                    statusFrequencia: statusFreq,
                    justificativaId: (registroExistente as any)?.justificativaId,
                  };
                });
                this.alunosNaChamada.set(mappedAlunos);
                this.carregandoChamada.set(false);
                this.chamadaCarregada.set(true);
              },
              error: () => {
                this.erroCarregamento.set('Erro ao buscar registros de chamada.');
                this.carregandoChamada.set(false);
              }
            });
        },
        error: () => {
          this.erroCarregamento.set('Erro ao carregar alunos desta turma.');
          this.carregandoChamada.set(false);
        }
      });
  }

  togglePresente(aluno: AlunoNaChamada): void {
    if (this.salvandoTudo() || this.modoVisualizacao() || aluno.statusFrequencia === 'FALTA_JUSTIFICADA') return;
    this.alunosNaChamada.update(lista => 
      lista.map(a => a.alunoId === aluno.alunoId ? { ...a, presente: !a.presente, salvo: false } : a)
    );
  }

  marcarTodos(presente: boolean): void {
    if (this.salvandoTudo() || this.modoVisualizacao()) return;
    this.alunosNaChamada.update(lista => 
      lista.map(a => a.statusFrequencia === 'FALTA_JUSTIFICADA' ? a : { ...a, presente, salvo: false })
    );
  }

  salvarChamada(): void {
    const lista = this.alunosNaChamada();
    if (this.salvandoTudo() || lista.length === 0) return;

    this.salvandoTudo.set(true);
    this.feedbackSalvo.set('Salvando Lote de Frequências...');

    this.alunosNaChamada.update(lst => lst.map(a => ({ ...a, salvando: true })));

    const payloadAlunos = this.alunosNaChamada().map(aluno => {
      const base: any = { alunoId: aluno.alunoId, presente: aluno.presente };
      if (aluno.frequenciaId) base.frequenciaId = aluno.frequenciaId;
      return base;
    });

    this.frequenciasService.salvarLote(this.turmaSelecionadaId(), this.dataAula(), payloadAlunos)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.salvandoTudo.set(false);
          this.feedbackSalvo.set('Chamada em Lote salva com sucesso!');
          this.carregarChamada(); // Recarrega UUIDs reais do banco
        },
        error: (err) => {
          this.salvandoTudo.set(false);
          this.alunosNaChamada.update(lst => lst.map(a => ({ ...a, salvando: false })));
          let det = 'Falha de comunicação com o servidor.';
          if (err?.error?.message) {
            det = Array.isArray(err.error.message) ? err.error.message[0] : err.error.message;
          }
          this.feedbackSalvo.set(`⚠️ Erro Crítico: ${det}`);
        }
      });
  }
}
