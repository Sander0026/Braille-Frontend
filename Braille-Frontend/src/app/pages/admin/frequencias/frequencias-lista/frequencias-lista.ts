import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of, from } from 'rxjs';
import { catchError, concatMap, toArray } from 'rxjs/operators';

import { FrequenciasService, Frequencia, ResumoFrequencia } from '../../../../core/services/frequencias.service';

import { TurmasService, Turma } from '../../../../core/services/turmas.service';
import { AuthService } from '../../../../core/services/auth.service';

interface AlunoNaChamada {
  alunoId: string;
  nomeCompleto: string;
  frequenciaId?: string;   // preenchido se já existe no banco
  presente: boolean;
  salvando: boolean;
  salvo: boolean;
}

@Component({
  selector: 'app-frequencias-lista',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './frequencias-lista.html',
  styleUrl: './frequencias-lista.scss',
})
export class FrequenciasLista implements OnInit {

  // ── Filtros ────────────────────────────────────────────────
  turmas: Turma[] = [];
  turmaSelecionadaId = '';
  dataAula: string = this.hojeISO();

  // ── Estado da chamada ──────────────────────────────────────
  alunosNaChamada: AlunoNaChamada[] = [];
  carregandoChamada = false;
  salvandoTudo = false;
  chamadaCarregada = false;
  erroCarregamento = '';
  feedbackSalvo = '';

  // Expõe Math para o template Angular
  readonly Math = Math;

  // ── Histórico (aba) ────────────────────────────────────────
  abaAtiva: 'chamada' | 'historico' | 'relatorio' = 'chamada';
  historico: ResumoFrequencia[] = [];
  carregandoHistorico = false;
  totalHistorico = 0;
  paginaHistorico = 1;
  erroHistorico = '';
  fechandoDiario = false;


  // ── Detalhes do Histórico (Modal) ──────────────────────────
  modalDetalhesAberto = false;
  detalhesResumo: any = null;
  detalhesAlunos: Frequencia[] = [];
  carregandoDetalhes = false;

  // ── Relatório (aba) ────────────────────────────────────────
  alunoSelecionadoId = '';
  alunosRelatorio: any[] = [];
  relatorioEstatisticas: any = null;
  relatorioHistorico: any[] = [];
  carregandoRelatorio = false;
  erroRelatorio = '';

  // ── Permissões ─────────────────────────────────────────────
  isProfessor = false;
  userId = '';

  constructor(
    private frequenciasService: FrequenciasService,
    private turmasService: TurmasService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
  ) { }

  ngOnInit(): void {
    const user = this.authService.getUser();
    this.isProfessor = user?.role === 'PROFESSOR';
    this.userId = user?.sub || '';

    this.carregarTurmas();
  }

  // ── Turmas ─────────────────────────────────────────────────
  carregarTurmas(): void {
    const profId = this.isProfessor ? this.userId : undefined;
    this.turmasService.listar(1, 100, undefined, true, profId).subscribe({
      next: (res) => {
        this.turmas = res.data.filter(t => t.statusAtivo);
        this.cdr.detectChanges();
      },
      error: () => {
        this.erroCarregamento = 'Não foi possível carregar as turmas. Verifique se o servidor está online.';
        this.cdr.detectChanges();
      },
    });
  }

  // ── Chamada ────────────────────────────────────────────────
  carregarChamada(): void {
    if (!this.turmaSelecionadaId || !this.dataAula) return;

    this.carregandoChamada = true;
    this.chamadaCarregada = false;
    this.erroCarregamento = '';
    this.alunosNaChamada = [];
    this.feedbackSalvo = '';

    // 1) busca alunos da turma
    this.turmasService.buscarPorId(this.turmaSelecionadaId).subscribe({
      next: (turma) => {
        // matriculasOficina tem os alunos ativos (include do backend)
        const alunos = (turma.matriculasOficina ?? []).map((m: any) => m.aluno).filter(Boolean);

        if (alunos.length === 0) {
          this.carregandoChamada = false;
          this.chamadaCarregada = true;
          return;
        }

        // 2) busca chamadas já registradas para esse dia
        const profId = this.isProfessor ? this.userId : undefined;
        this.frequenciasService.listar(1, 100, this.turmaSelecionadaId, this.dataAula, profId).subscribe({
          next: (res) => {
            const registrosExistentes = res.data;

            this.alunosNaChamada = alunos.map(aluno => {
              const registroExistente = registrosExistentes.find(f => f.alunoId === aluno.id);
              return {
                alunoId: aluno.id,
                nomeCompleto: aluno.nomeCompleto,
                frequenciaId: registroExistente?.id,
                presente: registroExistente?.presente ?? true, // padrão = presente
                salvando: false,
                salvo: !!registroExistente,
              };
            });

            this.carregandoChamada = false;
            this.chamadaCarregada = true;
            this.cdr.detectChanges();
          },
          error: () => {
            this.erroCarregamento = 'Erro ao buscar registros de chamada.';
            this.carregandoChamada = false;
            this.cdr.detectChanges();
          },
        });
      },
      error: () => {
        this.erroCarregamento = 'Erro ao carregar alunos desta turma.';
        this.carregandoChamada = false;
        this.cdr.detectChanges();
      },
    });
  }

  togglePresente(aluno: AlunoNaChamada): void {
    aluno.presente = !aluno.presente;
    aluno.salvo = false;
  }

  marcarTodos(presente: boolean): void {
    this.alunosNaChamada.forEach(a => {
      a.presente = presente;
      a.salvo = false;
    });
  }

  get totalPresentes(): number {
    return this.alunosNaChamada.filter(a => a.presente).length;
  }

  get totalFaltas(): number {
    return this.alunosNaChamada.filter(a => !a.presente).length;
  }

  salvarChamada(): void {
    if (this.salvandoTudo || this.alunosNaChamada.length === 0) return;

    this.salvandoTudo = true;
    this.feedbackSalvo = 'Salvando chamada (processando fila para evitar sobrecarga)...';
    this.cdr.detectChanges();

    const requisicoes = this.alunosNaChamada.map(aluno => {
      aluno.salvando = true;

      if (aluno.frequenciaId) {
        // Já existe — atualiza
        return this.frequenciasService.atualizar(aluno.frequenciaId, { presente: aluno.presente }).pipe(
          catchError(() => of(null))
        );
      } else {
        // Novo — cria
        return this.frequenciasService.registrar({
          alunoId: aluno.alunoId,
          turmaId: this.turmaSelecionadaId,
          dataAula: this.dataAula,
          presente: aluno.presente,
        }).pipe(
          catchError(() => of(null)) // ignorado
        );
      }
    });

    // Transforma o envio em fuzilaria em Fila Indiana Segura (via concatMap)
    // Impede o erro 500 (Prisma Connection Pool Timeout) do Servidor Nuvem Neon.tech
    from(requisicoes)
      .pipe(
        concatMap(req => req),
        toArray()
      )
      .subscribe({
        next: (resultados) => {
          let houveErro = false;
          resultados.forEach((res, i) => {
            const aluno = this.alunosNaChamada[i];
            aluno.salvando = false;
            if (res !== null) {
              aluno.salvo = true;
              if (!aluno.frequenciaId && (res as Frequencia).id) {
                aluno.frequenciaId = (res as Frequencia).id;
              }
            } else {
              houveErro = true;
            }
          });

          this.salvandoTudo = false;
          if (houveErro) {
            this.feedbackSalvo = '⚠️ Concluído. Alguns alunos não foram salvos. Verifique e tente salvar novamente.';
          } else {
            this.feedbackSalvo = 'Chamada salva com sucesso!';
            setTimeout(() => { this.feedbackSalvo = ''; this.cdr.detectChanges(); }, 5000);
          }
          this.cdr.detectChanges();
        },
        error: () => {
          this.salvandoTudo = false;
          this.feedbackSalvo = 'Erro crítico ao salvar chamada. Tente novamente.';
          this.cdr.detectChanges();
        },
      });
  }

  // ── Histórico ──────────────────────────────────────────────
  mudarAba(aba: 'chamada' | 'historico' | 'relatorio'): void {
    this.abaAtiva = aba;
    if (aba === 'historico' && this.historico.length === 0) {
      this.carregarHistorico();
    }
  }

  carregarHistorico(): void {
    this.carregandoHistorico = true;
    this.erroHistorico = '';

    const turmaId = this.turmaSelecionadaId || undefined;
    const profId = this.isProfessor ? this.userId : undefined;

    this.frequenciasService.listarResumo(this.paginaHistorico, 20, turmaId, profId).subscribe({
      next: (res) => {
        this.historico = res.data;
        this.totalHistorico = res.meta.total;
        this.carregandoHistorico = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.erroHistorico = 'Erro ao carregar histórico.';
        this.carregandoHistorico = false;
        this.cdr.detectChanges();
      },
    });
  }

  paginaAnteriorHistorico(): void {
    if (this.paginaHistorico > 1) {
      this.paginaHistorico--;
      this.carregarHistorico();
    }
  }

  proximaPaginaHistorico(): void {
    if (this.paginaHistorico < Math.ceil(this.totalHistorico / 20)) {
      this.paginaHistorico++;
      this.carregarHistorico();
    }
  }

  // ── Modal Histórico ────────────────────────────────────────
  abrirDetalhes(resumo: any): void {
    this.detalhesResumo = resumo;
    this.carregandoDetalhes = true;
    this.modalDetalhesAberto = true;
    this.detalhesAlunos = [];

    this.frequenciasService.listar(1, 400, resumo.turmaId, resumo.dataAula).subscribe({
      next: (res) => {
        this.detalhesAlunos = res.data;
        this.carregandoDetalhes = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.carregandoDetalhes = false;
        this.cdr.detectChanges();
      }
    });
  }

  fecharDetalhes(): void {
    this.modalDetalhesAberto = false;
    this.detalhesResumo = null;
  }

  // ── Relatório ──────────────────────────────────────────────
  onTurmaRelatorioChange(): void {
    this.alunoSelecionadoId = '';
    this.relatorioEstatisticas = null;
    this.relatorioHistorico = [];
    this.alunosRelatorio = [];

    if (!this.turmaSelecionadaId) return;

    this.turmasService.buscarPorId(this.turmaSelecionadaId).subscribe({
      next: (turma) => {
        this.alunosRelatorio = (turma.matriculasOficina ?? []).map((m: any) => m.aluno).filter(Boolean);

        this.cdr.detectChanges();
      }
    });
  }

  carregarRelatorio(): void {
    if (!this.turmaSelecionadaId || !this.alunoSelecionadoId) return;

    this.carregandoRelatorio = true;
    this.erroRelatorio = '';

    this.frequenciasService.obterRelatorioAluno(this.turmaSelecionadaId, this.alunoSelecionadoId).subscribe({
      next: (res) => {
        this.relatorioEstatisticas = res.estatisticas;
        this.relatorioHistorico = res.historico;
        this.carregandoRelatorio = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.erroRelatorio = 'Erro ao carregar relatório do aluno.';
        this.carregandoRelatorio = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── Utilidades ─────────────────────────────────────────────
  hojeISO(): string {
    const d = new Date();
    // Usa hora local para compatibilidade com o input[type=date] do navegador
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  /** Verdadeiro quando a data selecionada no filtro é hoje */
  get ehHoje(): boolean {
    return this.dataAula === this.hojeISO();
  }

  /** Verdadeiro quando a chamada é de data anterior — modo somente leitura */
  get modoVisualizacao(): boolean {
    return this.chamadaCarregada && !this.ehHoje;
  }

  formatarData(iso: string): string {
    if (!iso) return '—';
    // Extrai YYYY-MM-DD diretamente da string ISO para evitar deslocamento de UTC
    // new Date('2026-03-03T00:00:00Z') em UTC-3 retornaria 02/03/2026 (errado)
    const partes = iso.substring(0, 10).split('-'); // ['2026', '03', '03']
    if (partes.length !== 3) return iso;
    const [ano, mes, dia] = partes;
    return `${dia}/${mes}/${ano}`;
  }

  get turmaSelecionadaNome(): string {
    return this.turmas.find(t => t.id === this.turmaSelecionadaId)?.nome ?? '';
  }

  // ── Fechamento de Diário ────────────────────────────────────────────────

  fecharDiario(turmaId: string, dataAula: string): void {
    if (this.fechandoDiario) return;
    this.fechandoDiario = true;
    this.frequenciasService.fecharDiario(turmaId, dataAula).subscribe({
      next: (res) => {
        this.fechandoDiario = false;
        this.feedbackSalvo = `📕 ${res.mensagem ?? 'Diário fechado com sucesso!'}`;
        this.carregarHistorico();
        this.cdr.detectChanges();
        setTimeout(() => { this.feedbackSalvo = ''; this.cdr.detectChanges(); }, 6000);
      },
      error: (err) => {
        this.fechandoDiario = false;
        this.feedbackSalvo = `⚠️ Erro: ${err.error?.message ?? 'Não foi possível fechar o diário.'}`;
        this.cdr.detectChanges();
      }
    });
  }

  reabrirDiario(turmaId: string, dataAula: string): void {
    if (this.fechandoDiario) return;
    this.fechandoDiario = true;
    this.frequenciasService.reabrirDiario(turmaId, dataAula).subscribe({
      next: () => {
        this.fechandoDiario = false;
        this.feedbackSalvo = '📗 Diário reaberto para retificação.';
        this.carregarHistorico();
        this.cdr.detectChanges();
        setTimeout(() => { this.feedbackSalvo = ''; this.cdr.detectChanges(); }, 6000);
      },
      error: (err) => {
        this.fechandoDiario = false;
        this.feedbackSalvo = `⚠️ Erro: ${err.error?.message ?? 'Não foi possível reabrir o diário.'}`;
        this.cdr.detectChanges();
      }
    });
  }
}

