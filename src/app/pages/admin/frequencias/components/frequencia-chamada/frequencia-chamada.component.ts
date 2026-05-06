import { Component, ChangeDetectionStrategy, inject, DestroyRef, signal, computed, Input, Output, EventEmitter, OnInit, ViewChildren, QueryList, HostListener, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { A11yModule, FocusKeyManager } from '@angular/cdk/a11y';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FrequenciasService } from '../../../../../core/services/frequencias.service';
import { TurmasService, Turma, GradeHorariaDto } from '../../../../../core/services/turmas.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { TabelaTrFocavelDirective } from '../tabela-tr-focavel.directive';

/** Mapa de código de dia (grade horária) → número do JS Date.getDay() */
const DIA_SEMANA_MAP: Record<string, number> = {
  'DOM': 0, 'SEG': 1, 'TER': 2, 'QUA': 3, 'QUI': 4, 'SEX': 5, 'SAB': 6,
};

/** Rótulo legível dos dias para mensagens de erro */
const DIA_SEMANA_LABEL: Record<string, string> = {
  'DOM': 'domingos', 'SEG': 'segundas-feiras', 'TER': 'terças-feiras',
  'QUA': 'quartas-feiras', 'QUI': 'quintas-feiras', 'SEX': 'sextas-feiras', 'SAB': 'sábados',
};

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
  /** Mensagem de erro de validação de data/dia (exibida antes de carregar) */
  readonly erroValidacao = signal<string>('');

  /**
   * Grade horária da turma atualmente carregada.
   * Persistida após carregarChamada() para permitir revalidação
   * em tempo real sem nova requisição HTTP.
   */
  private readonly gradeHorariaTurmaAtual = signal<GradeHorariaDto[]>([]);

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
    // Ao trocar de turma, a chamada anterior deixa de ser válida
    this.gradeHorariaTurmaAtual.set([]);
    this.chamadaCarregada.set(false);
    this.alunosNaChamada.set([]);
    this.erroValidacao.set('');
    this.feedbackSalvo.set('');
  }

  updateData(dt: string) {
    this.dataAula.set(dt);

    // ── Revalidação em tempo real ───────────────────────────────────────
    // Sempre que a data muda, revalida imediatamente.
    // A grade da turma carregada está disponível em gradeHorariaTurmaAtual.
    const erroData = this.validarData(dt);
    if (erroData) {
      this.erroValidacao.set(erroData);
      return;
    }
    const erroGrade = this.validarDiaSemana(dt, this.gradeHorariaTurmaAtual());
    if (erroGrade) {
      this.erroValidacao.set(erroGrade);
      return;
    }
    this.erroValidacao.set('');
  }

  carregarChamada(): void {
    const turmaId = this.turmaSelecionadaId();
    const data = this.dataAula();

    if (!turmaId || !data) return;

    // ── Validação 1: Bloquear datas futuras ──────────────────────────────────
    const erroData = this.validarData(data);
    if (erroData) {
      this.erroValidacao.set(erroData);
      return;
    }

    this.erroValidacao.set('');
    this.carregandoChamada.set(true);
    this.chamadaCarregada.set(false);
    this.erroCarregamento.set('');
    this.alunosNaChamada.set([]);
    this.feedbackSalvo.set('');

    this.turmasService.buscarPorId(turmaId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (turma) => {
          // ── Validação 2: Dia da semana vs. grade horária ─────────────────
          const erroGrade = this.validarDiaSemana(data, turma.gradeHoraria ?? []);
          if (erroGrade) {
            this.erroValidacao.set(erroGrade);
            this.carregandoChamada.set(false);
            return;
          }

          // Persiste a grade para revalidação em tempo real (updateData)
          this.gradeHorariaTurmaAtual.set(turma.gradeHoraria ?? []);

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

  /**
   * Valida se a data não é futura.
   * @returns Mensagem de erro ou `null` se a data for válida.
   */
  private validarData(data: string): string | null {
    const hoje = this.hojeISO();
    if (data > hoje) {
      return 'Não é possível registrar chamada para datas futuras. Selecione a data de hoje ou uma data anterior.';
    }
    return null;
  }

  /**
   * Valida se o dia da semana da data corresponde a algum dia da grade horária.
   * Turmas sem grade configurada não são bloqueadas.
   * @returns Mensagem de erro ou `null` se o dia for válido.
   */
  private validarDiaSemana(data: string, grade: GradeHorariaDto[]): string | null {
    if (!grade || grade.length === 0) return null;

    // Usa horário fixo ao meio-dia para evitar erros de fuso horário
    const diaSemanaData = new Date(data + 'T12:00:00').getDay();
    const diasAula = grade
      .map(g => DIA_SEMANA_MAP[g.dia])
      .filter(d => d !== undefined);

    if (!diasAula.includes(diaSemanaData)) {
      const diasLabel = grade
        .map(g => DIA_SEMANA_LABEL[g.dia] ?? g.dia)
        .join(', ');
      return `Esta oficina ocorre apenas às: ${diasLabel}. A data selecionada não corresponde a um dia de aula.`;
    }
    return null;
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

    // ── Guard de revalidação antes de salvar ─────────────────────────
    // Garante que nenhuma alteração posterior de data consiga burlar a regra.
    const dataAtual = this.dataAula();
    const erroData = this.validarData(dataAtual);
    if (erroData) {
      this.erroValidacao.set(erroData);
      return;
    }
    const erroGrade = this.validarDiaSemana(dataAtual, this.gradeHorariaTurmaAtual());
    if (erroGrade) {
      this.erroValidacao.set(erroGrade);
      return;
    }

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
          this.feedbackSalvo.set(`Erro Crítico: ${det}`);
        }
      });
  }
}
