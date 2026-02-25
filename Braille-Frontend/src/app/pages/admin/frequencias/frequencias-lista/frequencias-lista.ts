import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { FrequenciasService, Frequencia } from '../../../../core/services/frequencias.service';
import { TurmasService, Turma } from '../../../../core/services/turmas.service';

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
  abaAtiva: 'chamada' | 'historico' = 'chamada';
  historico: Frequencia[] = [];
  carregandoHistorico = false;
  totalHistorico = 0;
  paginaHistorico = 1;
  erroHistorico = '';

  constructor(
    private frequenciasService: FrequenciasService,
    private turmasService: TurmasService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.carregarTurmas();
  }

  // ── Turmas ─────────────────────────────────────────────────
  carregarTurmas(): void {
    this.turmasService.listar(1, 100).subscribe({
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
        const alunos = turma.alunos ?? [];

        if (alunos.length === 0) {
          this.carregandoChamada = false;
          this.chamadaCarregada = true;
          return;
        }

        // 2) busca chamadas já registradas para esse dia
        this.frequenciasService.listar(1, 100, this.turmaSelecionadaId, this.dataAula).subscribe({
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
    this.feedbackSalvo = '';

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
          catchError(() => of(null)) // 409 ignorado (já existe)
        );
      }
    });

    forkJoin(requisicoes).subscribe({
      next: (resultados) => {
        resultados.forEach((res, i) => {
          const aluno = this.alunosNaChamada[i];
          aluno.salvando = false;
          if (res !== null) {
            aluno.salvo = true;
            if (!aluno.frequenciaId && (res as Frequencia).id) {
              aluno.frequenciaId = (res as Frequencia).id;
            }
          }
        });
        this.salvandoTudo = false;
        this.feedbackSalvo = 'Chamada salva com sucesso!';
        this.cdr.detectChanges();
        setTimeout(() => { this.feedbackSalvo = ''; this.cdr.detectChanges(); }, 5000);
      },
      error: () => {
        this.salvandoTudo = false;
        this.feedbackSalvo = 'Erro ao salvar chamada. Tente novamente.';
        this.cdr.detectChanges();
      },
    });
  }

  // ── Histórico ──────────────────────────────────────────────
  mudarAba(aba: 'chamada' | 'historico'): void {
    this.abaAtiva = aba;
    if (aba === 'historico' && this.historico.length === 0) {
      this.carregarHistorico();
    }
  }

  carregarHistorico(): void {
    this.carregandoHistorico = true;
    this.erroHistorico = '';

    const turmaId = this.turmaSelecionadaId || undefined;

    this.frequenciasService.listar(this.paginaHistorico, 20, turmaId).subscribe({
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

  // ── Utilidades ─────────────────────────────────────────────
  hojeISO(): string {
    return new Date().toISOString().split('T')[0];
  }

  formatarData(iso: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-BR');
  }

  get turmaSelecionadaNome(): string {
    return this.turmas.find(t => t.id === this.turmaSelecionadaId)?.nome ?? '';
  }
}
