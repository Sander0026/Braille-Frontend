import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  ViewChild,
  WritableSignal,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, debounceTime, distinctUntilChanged, forkJoin, Observable, of, Subject, switchMap } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import {
  RelatorioAlunosDistribuicoes,
  RelatorioAlunosListaResponse,
  RelatorioAlunosResumo,
  RelatorioEvasoesResponse,
  RelatorioFiltro,
  RelatorioImpactoSocialResponse,
  RelatorioOpcao,
  RelatorioResumo,
  RelatorioRiscoEvasaoResponse,
  RelatorioTurmasResponse,
  RelatoriosService,
} from '../../../../core/services/relatorios.service';
import { ToastService } from '../../../../core/services/toast.service';
import { FiltroRelatorioAtendimento } from '../../../../features/atendimentos-individuais/models/filtros-atendimento.model';
import { RelatorioAtendimentoIndividual } from '../../../../features/atendimentos-individuais/models/relatorio-atendimento.model';
import { RelatorioAtendimentoApiService } from '../../../../features/atendimentos-individuais/services/relatorio-atendimento-api.service';
import { CardsIndicadores } from '../components/cards-indicadores/cards-indicadores';
import { RelatorioFiltros } from '../components/relatorio-filtros/relatorio-filtros';
import { RelatorioAlunos } from '../components/relatorio-alunos/relatorio-alunos';
import { RelatorioAtendimentos } from '../components/relatorio-atendimentos/relatorio-atendimentos';
import { RelatorioEvasoes } from '../components/relatorio-evasoes/relatorio-evasoes';
import { RelatorioExportacoes } from '../components/relatorio-exportacoes/relatorio-exportacoes';
import { RelatorioImpactoSocial } from '../components/relatorio-impacto-social/relatorio-impacto-social';
import { RelatorioTurmas } from '../components/relatorio-turmas/relatorio-turmas';

type RelatorioAba =
  | 'visao-geral'
  | 'alunos'
  | 'turmas'
  | 'evasoes'
  | 'atendimentos'
  | 'impacto-social'
  | 'exportacoes';

type BuscaBairro = {
  busca: string;
  cidade?: string;
};

interface RelatorioTab {
  id: RelatorioAba;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-relatorios-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RelatorioFiltros,
    CardsIndicadores,
    RelatorioAlunos,
    RelatorioTurmas,
    RelatorioEvasoes,
    RelatorioAtendimentos,
    RelatorioImpactoSocial,
    RelatorioExportacoes,
  ],
  templateUrl: './relatorios-dashboard.html',
  styleUrl: './relatorios-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelatoriosDashboard implements OnInit {
  private readonly relatoriosService = inject(RelatoriosService);
  private readonly relatorioAtendimentoApi = inject(RelatorioAtendimentoApiService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly buscaTurmas$ = new Subject<string>();
  private readonly buscaProfessores$ = new Subject<string>();
  private readonly buscaAlunos$ = new Subject<string>();
  private readonly buscaCidades$ = new Subject<string>();
  private readonly buscaBairros$ = new Subject<BuscaBairro>();
  private readonly limiteAlunosLista = 20;

  @ViewChild('anuncio', { static: true }) private anuncioEl!: ElementRef<HTMLDivElement>;

  readonly ehComunicacao = this.authService.getUser()?.role === 'COMUNICACAO';
  readonly tabs: RelatorioTab[] = this.ehComunicacao
    ? [{ id: 'exportacoes', label: 'Exportações', icon: 'download' }]
    : [
        { id: 'visao-geral', label: 'Visão Geral', icon: 'monitoring' },
        { id: 'alunos', label: 'Alunos', icon: 'groups' },
        { id: 'turmas', label: 'Turmas', icon: 'school' },
        { id: 'evasoes', label: 'Evasões', icon: 'warning' },
        { id: 'atendimentos', label: 'Atendimentos Individuais', icon: 'clinical_notes' },
        { id: 'impacto-social', label: 'Impacto Social', icon: 'volunteer_activism' },
        { id: 'exportacoes', label: 'Exportações', icon: 'download' },
      ];

  readonly abaAtiva = signal<RelatorioAba>(this.ehComunicacao ? 'exportacoes' : 'visao-geral');
  readonly filtros = signal<RelatorioFiltro>({ statusAluno: 'TODOS' });
  readonly erro = signal('');
  readonly exportandoPdf = signal(false);
  readonly exportandoXlsx = signal(false);
  readonly exportandoAtendimentosPdf = signal(false);
  readonly filtroDrawerAberto = signal(false);
  readonly abasCarregadas = signal<Record<RelatorioAba, boolean>>(this.estadoAbas(false));
  readonly carregandoPorAba = signal<Record<RelatorioAba, boolean>>(this.estadoAbas(false));
  readonly carregando = computed(() => this.carregandoPorAba()[this.abaAtiva()] ?? false);

  /** Quantidade de filtros ativos (para badge no botão) */
  readonly filtrosAtivos = computed(() => {
    const f = this.filtros();
    const campos: (keyof RelatorioFiltro)[] = [
      'dataInicio', 'dataFim', 'turmaId', 'professorId', 'alunoId',
      'statusTurma', 'statusMatricula', 'motivoEncerramento',
      'statusAcompanhamento', 'tipoRegistroAtendimento', 'modalidadeAtendimento',
      'cidade', 'bairro', 'tipoDeficiencia',
    ];
    let count = campos.filter(c => !!f[c]).length;
    if (f.statusAluno && f.statusAluno !== 'TODOS') count++;
    return count;
  });

  readonly turmasOptions = signal<RelatorioOpcao[]>([]);
  readonly professoresOptions = signal<RelatorioOpcao[]>([]);
  readonly alunosOptions = signal<RelatorioOpcao[]>([]);
  readonly cidadesOptions = signal<RelatorioOpcao[]>([]);
  readonly bairrosOptions = signal<RelatorioOpcao[]>([]);

  readonly resumo = signal<RelatorioResumo | null>(null);
  readonly alunosResumo = signal<RelatorioAlunosResumo | null>(null);
  readonly alunosDistribuicoes = signal<RelatorioAlunosDistribuicoes | null>(null);
  readonly alunosLista = signal<RelatorioAlunosListaResponse | null>(null);
  readonly carregandoListaAlunos = signal(false);
  readonly listaAlunosAberta = signal(false);
  readonly turmas = signal<RelatorioTurmasResponse | null>(null);
  readonly evasoes = signal<RelatorioEvasoesResponse | null>(null);
  readonly riscoEvasao = signal<RelatorioRiscoEvasaoResponse | null>(null);
  readonly atendimentos = signal<RelatorioAtendimentoIndividual | null>(null);
  readonly impactoSocial = signal<RelatorioImpactoSocialResponse | null>(null);
  readonly comparativoImpactoInicio = signal('');
  readonly comparativoImpactoFim = signal('');
  readonly erroImpactoSocial = signal('');

  readonly totalRegistros = computed(() => {
    const resumo = this.resumo();
    if (!resumo) return 0;
    return resumo.alunos.total + resumo.turmas.total + resumo.matriculas.total;
  });

  ngOnInit(): void {
    this.configurarBuscaOpcoes();
    this.carregarAbaAtual();
  }

  mudarAba(aba: RelatorioAba): void {
    this.abaAtiva.set(aba);
    this.anunciar(`Aba ${this.tabLabel(aba)} selecionada.`);
    this.carregarAbaAtual();
  }

  abrirFiltros(): void {
    this.filtroDrawerAberto.set(true);
  }

  fecharFiltros(): void {
    this.filtroDrawerAberto.set(false);
  }

  aplicarFiltros(filtros: RelatorioFiltro): void {
    this.filtros.set(this.normalizarFiltro(filtros));
    this.filtroDrawerAberto.set(false);
    this.invalidarCacheRelatorios();
    this.carregarAbaAtual();
  }

  limparFiltros(): void {
    this.filtros.set({ statusAluno: 'TODOS' });
    this.comparativoImpactoInicio.set('');
    this.comparativoImpactoFim.set('');
    this.turmasOptions.set([]);
    this.professoresOptions.set([]);
    this.alunosOptions.set([]);
    this.cidadesOptions.set([]);
    this.bairrosOptions.set([]);
    this.invalidarCacheRelatorios();
    this.carregarAbaAtual();
  }

  recarregar(): void {
    this.invalidarCacheRelatorios();
    this.carregarAbaAtual();
  }

  onComparativoImpactoChange(evento: { inicio: string; fim: string }): void {
    this.comparativoImpactoInicio.set(evento.inicio);
    this.comparativoImpactoFim.set(evento.fim);
    this.erroImpactoSocial.set('');
    this.abasCarregadas.update((estado) => ({ ...estado, 'impacto-social': false }));
    this.carregandoPorAba.update((estado) => ({ ...estado, 'impacto-social': false }));
    this.impactoSocial.set(null);
    this.carregarImpactoSocial();
  }

  buscarTurmasOpcoes(busca: string): void {
    this.buscaTurmas$.next(busca);
  }

  buscarProfessoresOpcoes(busca: string): void {
    this.buscaProfessores$.next(busca);
  }

  buscarAlunosOpcoes(busca: string): void {
    this.buscaAlunos$.next(busca);
  }

  buscarCidadesOpcoes(busca: string): void {
    this.buscaCidades$.next(busca);
  }

  buscarBairrosOpcoes(payload: BuscaBairro): void {
    this.buscaBairros$.next(payload);
  }

  abrirListaAlunos(): void {
    if (this.carregandoListaAlunos()) return;
    
    if (this.listaAlunosAberta()) {
      this.listaAlunosAberta.set(false);
    } else {
      this.listaAlunosAberta.set(true);
      if (!this.alunosLista()) {
        this.carregarListaAlunos(1, false);
      }
    }
  }

  verMaisAlunos(): void {
    const lista = this.alunosLista();
    if (!lista || this.carregandoListaAlunos() || lista.meta.page >= lista.meta.lastPage) return;
    this.carregarListaAlunos(lista.meta.page + 1, true);
  }

  exportarPdf(): void {
    this.exportandoPdf.set(true);
    this.relatoriosService
      .exportarPdf(this.filtros())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          this.baixarArquivo(blob, `relatorio-institucional-${this.hoje()}.pdf`);
          this.toast.sucesso('PDF gerado com sucesso.');
          this.exportandoPdf.set(false);
        },
        error: () => {
          this.toast.erro('Não foi possível gerar o PDF.');
          this.exportandoPdf.set(false);
        },
      });
  }

  exportarXlsx(): void {
    if (this.ehComunicacao) {
      this.toast.erro('Seu perfil pode exportar apenas o PDF institucional sem dados sensíveis.');
      return;
    }

    this.exportandoXlsx.set(true);
    this.relatoriosService
      .exportarXlsx(this.filtros())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          this.baixarArquivo(blob, `relatorio-institucional-${this.hoje()}.xlsx`);
          this.toast.sucesso('Planilha gerada com sucesso.');
          this.exportandoXlsx.set(false);
        },
        error: () => {
          this.toast.erro('Não foi possível gerar a planilha.');
          this.exportandoXlsx.set(false);
        },
      });
  }

  exportarAtendimentosPdf(): void {
    this.exportandoAtendimentosPdf.set(true);
    this.relatorioAtendimentoApi
      .exportarPdf(this.mapearFiltroAtendimento(this.filtros()))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          this.baixarArquivo(blob, `relatorio-atendimento-individual-${this.hoje()}.pdf`);
          this.toast.sucesso('PDF de atendimentos individuais gerado com sucesso.');
          this.exportandoAtendimentosPdf.set(false);
        },
        error: () => {
          this.toast.erro('Não foi possível gerar o PDF de atendimentos individuais.');
          this.exportandoAtendimentosPdf.set(false);
        },
      });
  }

  tabLabel(aba: RelatorioAba): string {
    return this.tabs.find((tab) => tab.id === aba)?.label ?? aba;
  }

  private carregarAbaAtual(): void {
    this.carregarAba(this.abaAtiva());
  }

  private carregarAba(aba: RelatorioAba): void {
    if (this.ehComunicacao) {
      this.erro.set('');
      this.marcarAbaCarregada(aba);
      return;
    }

    if (this.abasCarregadas()[aba]) return;

    if (aba === 'exportacoes') {
      this.marcarAbaCarregada(aba);
      return;
    }

    this.erro.set('');

    if (aba === 'visao-geral') {
      this.carregarResumo();
      return;
    }

    if (aba === 'alunos') {
      this.carregarAlunos();
      return;
    }

    if (aba === 'turmas') {
      this.carregarTurmas();
      return;
    }

    if (aba === 'evasoes') {
      this.carregarEvasoes();
      return;
    }

    if (aba === 'atendimentos') {
      this.carregarAtendimentos();
      return;
    }

    if (aba === 'impacto-social') {
      this.carregarImpactoSocial();
    }
  }

  private carregarResumo(): void {
    this.marcarAbaCarregando('visao-geral', true);
    this.relatoriosService
      .resumo(this.filtros())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resumo) => {
          this.resumo.set(resumo);
          this.marcarAbaCarregada('visao-geral');
        },
        error: () => {
          this.erro.set('Nao foi possivel carregar o resumo dos relatorios.');
          this.marcarAbaCarregando('visao-geral', false);
        },
      });
  }

  private carregarAlunos(): void {
    const filtros = this.filtros();
    this.marcarAbaCarregando('alunos', true);
    forkJoin({
      resumo: this.relatoriosService.alunosResumo(filtros),
      distribuicoes: this.relatoriosService.alunosDistribuicoes(filtros),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ resumo, distribuicoes }) => {
          this.alunosResumo.set(resumo);
          this.alunosDistribuicoes.set(distribuicoes);
          this.marcarAbaCarregada('alunos');
        },
        error: () => {
          this.erro.set('Nao foi possivel carregar o relatorio de alunos.');
          this.marcarAbaCarregando('alunos', false);
        },
      });
  }

  private carregarTurmas(): void {
    this.marcarAbaCarregando('turmas', true);
    this.relatoriosService
      .turmas(this.filtros())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (turmas) => {
          this.turmas.set(turmas);
          this.marcarAbaCarregada('turmas');
        },
        error: () => {
          this.erro.set('Nao foi possivel carregar o relatorio de turmas.');
          this.marcarAbaCarregando('turmas', false);
        },
      });
  }

  private carregarEvasoes(): void {
    this.marcarAbaCarregando('evasoes', true);
    const filtros = this.filtros();
    forkJoin({
      evasoes: this.relatoriosService.evasoes(filtros),
      risco: this.relatoriosService.riscoEvasao(filtros),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ evasoes, risco }) => {
          this.evasoes.set(evasoes);
          this.riscoEvasao.set(risco);
          this.marcarAbaCarregada('evasoes');
        },
        error: () => {
          this.erro.set('Nao foi possivel carregar o relatorio de evasoes.');
          this.marcarAbaCarregando('evasoes', false);
        },
      });
  }

  private carregarImpactoSocial(): void {
    this.marcarAbaCarregando('impacto-social', true);
    const filtro: RelatorioFiltro = { ...this.filtros() };
    const inicio = this.comparativoImpactoInicio();
    const fim = this.comparativoImpactoFim();
    const periodoComparativo = inicio && fim ? { inicio, fim } : undefined;

    if (periodoComparativo) {
      const dataInicioComparativo = new Date(`${inicio}T00:00:00`);
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      if (dataInicioComparativo > hoje) {
        this.erroImpactoSocial.set(
          'Não é possível comparar com um período futuro. Ainda não existem dados disponíveis para esse mês.'
        );
        this.marcarAbaCarregando('impacto-social', false);
        return;
      }
    }

    this.relatoriosService
      .impactoSocial(filtro, periodoComparativo)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (impactoSocial) => {
          this.impactoSocial.set(impactoSocial);
          this.erroImpactoSocial.set('');
          this.marcarAbaCarregada('impacto-social');
        },
        error: (err: unknown) => {
          let mensagem = 'Não foi possível carregar o relatório de impacto social. Tente novamente em instantes.';
          if (err instanceof HttpErrorResponse) {
            if (err.status === 400) {
              mensagem = 'Período de comparação inválido. Verifique as datas selecionadas.';
            }
          }
          this.erroImpactoSocial.set(mensagem);
          this.marcarAbaCarregando('impacto-social', false);
        },
      });
  }

  private carregarAtendimentos(): void {
    this.marcarAbaCarregando('atendimentos', true);
    this.relatorioAtendimentoApi
      .gerar(this.mapearFiltroAtendimento(this.filtros()))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (atendimentos) => {
          this.atendimentos.set(atendimentos);
          this.marcarAbaCarregada('atendimentos');
        },
        error: () => {
          this.erro.set('Nao foi possivel carregar o relatorio de atendimentos.');
          this.marcarAbaCarregando('atendimentos', false);
        },
      });
  }

  private carregarListaAlunos(page: number, acumular: boolean): void {
    this.carregandoListaAlunos.set(true);
    this.relatoriosService
      .alunosLista(this.filtros(), page, this.limiteAlunosLista)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resultado) => {
          const atual = this.alunosLista();
          this.alunosLista.set({
            ...resultado,
            data: acumular && atual ? [...atual.data, ...resultado.data] : resultado.data,
          });
          this.carregandoListaAlunos.set(false);
        },
        error: () => {
          this.toast.erro('Nao foi possivel carregar a lista de alunos.');
          this.carregandoListaAlunos.set(false);
        },
      });
  }

  private resetarListaAlunos(): void {
    this.listaAlunosAberta.set(false);
    this.alunosLista.set(null);
    this.carregandoListaAlunos.set(false);
  }

  private invalidarCacheRelatorios(): void {
    this.abasCarregadas.set(this.estadoAbas(false));
    this.carregandoPorAba.set(this.estadoAbas(false));
    this.resumo.set(null);
    this.alunosResumo.set(null);
    this.alunosDistribuicoes.set(null);
    this.turmas.set(null);
    this.evasoes.set(null);
    this.riscoEvasao.set(null);
    this.atendimentos.set(null);
    this.impactoSocial.set(null);
    this.erroImpactoSocial.set('');
    this.resetarListaAlunos();
  }

  private marcarAbaCarregando(aba: RelatorioAba, carregando: boolean): void {
    this.carregandoPorAba.update((estado) => ({ ...estado, [aba]: carregando }));
  }

  private marcarAbaCarregada(aba: RelatorioAba): void {
    this.abasCarregadas.update((estado) => ({ ...estado, [aba]: true }));
    this.marcarAbaCarregando(aba, false);
  }

  private estadoAbas(value: boolean): Record<RelatorioAba, boolean> {
    return {
      'visao-geral': value,
      alunos: value,
      turmas: value,
      evasoes: value,
      atendimentos: value,
      'impacto-social': value,
      exportacoes: value,
    };
  }

  private configurarBuscaOpcoes(): void {
    if (this.ehComunicacao) {
      this.turmasOptions.set([]);
      this.professoresOptions.set([]);
      this.alunosOptions.set([]);
      this.cidadesOptions.set([]);
      this.bairrosOptions.set([]);
      return;
    }

    this.conectarBuscaOpcao(this.buscaTurmas$, this.turmasOptions, (busca) =>
      this.relatoriosService.buscarOpcoesTurmas(busca),
    );
    this.conectarBuscaOpcao(this.buscaProfessores$, this.professoresOptions, (busca) =>
      this.relatoriosService.buscarOpcoesProfessores(busca),
    );
    this.conectarBuscaOpcao(this.buscaAlunos$, this.alunosOptions, (busca) =>
      this.relatoriosService.buscarOpcoesAlunos(busca),
    );
    this.conectarBuscaOpcao(this.buscaCidades$, this.cidadesOptions, (busca) =>
      this.relatoriosService.buscarOpcoesCidades(busca),
    );
    this.conectarBuscaBairros();
  }

  private conectarBuscaOpcao(
    origem$: Subject<string>,
    destino: WritableSignal<RelatorioOpcao[]>,
    buscar: (busca: string) => Observable<RelatorioOpcao[]>,
  ): void {
    origem$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((busca) => {
          const termo = busca.trim();
          if (termo.length < 2) {
            destino.set([]);
            return of([]);
          }
          return buscar(termo).pipe(catchError(() => of([])));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((opcoes) => {
        destino.set(opcoes);
      });
  }

  private conectarBuscaBairros(): void {
    this.buscaBairros$
      .pipe(
        debounceTime(300),
        distinctUntilChanged((anterior, atual) => anterior.busca === atual.busca && anterior.cidade === atual.cidade),
        switchMap(({ busca, cidade }) => {
          const termo = busca.trim();
          if (termo.length < 2) {
            this.bairrosOptions.set([]);
            return of([]);
          }
          return this.relatoriosService.buscarOpcoesBairros(termo, cidade).pipe(catchError(() => of([])));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((opcoes) => {
        this.bairrosOptions.set(opcoes);
      });
  }

  private mapearFiltroAtendimento(filtros: RelatorioFiltro): FiltroRelatorioAtendimento {
    const relatorio: FiltroRelatorioAtendimento = {
      alunoId: filtros.alunoId,
      professorId: filtros.professorId,
      dataInicio: filtros.dataInicio,
      dataFim: filtros.dataFim,
      status: filtros.statusAcompanhamento,
      tipoRegistro: filtros.tipoRegistroAtendimento,
      modalidade: filtros.modalidadeAtendimento,
    };

    Object.entries(relatorio).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        delete relatorio[key as keyof FiltroRelatorioAtendimento];
      }
    });

    return relatorio;
  }

  private normalizarFiltro(filtros: RelatorioFiltro): RelatorioFiltro {
    const limpo: RelatorioFiltro = {};
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        limpo[key as keyof RelatorioFiltro] = value as never;
      }
    });
    if (this.ehComunicacao) {
      return {
        ...(limpo.dataInicio && { dataInicio: limpo.dataInicio }),
        ...(limpo.dataFim && { dataFim: limpo.dataFim }),
        statusAluno: 'TODOS',
      };
    }
    return limpo.statusAluno ? limpo : { ...limpo, statusAluno: 'TODOS' };
  }

  private baixarArquivo(blob: Blob, nome: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = nome;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private hoje(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private anunciar(mensagem: string): void {
    const el = this.anuncioEl?.nativeElement;
    if (!el) return;
    el.textContent = mensagem;
    setTimeout(() => {
      el.textContent = '';
    }, 1000);
  }
}
