import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import {
  RelatorioAlunosResponse,
  RelatorioAtendimentosResponse,
  RelatorioEvasoesResponse,
  RelatorioFiltro,
  RelatorioFrequenciasResponse,
  RelatorioResumo,
  RelatorioTurmasResponse,
  RelatoriosService,
} from '../../../../core/services/relatorios.service';
import { ToastService } from '../../../../core/services/toast.service';
import { TurmasService } from '../../../../core/services/turmas.service';
import { CardsIndicadores } from '../components/cards-indicadores/cards-indicadores';
import {
  RelatorioFiltroOption,
  RelatorioFiltros,
} from '../components/relatorio-filtros/relatorio-filtros';
import { RelatorioAlunos } from '../components/relatorio-alunos/relatorio-alunos';
import { RelatorioAtendimentos } from '../components/relatorio-atendimentos/relatorio-atendimentos';
import { RelatorioEvasoes } from '../components/relatorio-evasoes/relatorio-evasoes';
import { RelatorioExportacoes } from '../components/relatorio-exportacoes/relatorio-exportacoes';
import { RelatorioTurmas } from '../components/relatorio-turmas/relatorio-turmas';

type RelatorioAba = 'visao-geral' | 'alunos' | 'turmas' | 'evasoes' | 'atendimentos' | 'exportacoes';

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
    RelatorioExportacoes,
  ],
  templateUrl: './relatorios-dashboard.html',
  styleUrl: './relatorios-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelatoriosDashboard implements OnInit {
  private readonly relatoriosService = inject(RelatoriosService);
  private readonly turmasService = inject(TurmasService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('anuncio', { static: true }) private anuncioEl!: ElementRef<HTMLDivElement>;

  readonly tabs: RelatorioTab[] = [
    { id: 'visao-geral', label: 'Visão Geral', icon: 'monitoring' },
    { id: 'alunos', label: 'Alunos', icon: 'groups' },
    { id: 'turmas', label: 'Turmas', icon: 'school' },
    { id: 'evasoes', label: 'Evasões', icon: 'warning' },
    { id: 'atendimentos', label: 'Atendimentos', icon: 'clinical_notes' },
    { id: 'exportacoes', label: 'Exportações', icon: 'download' },
  ];

  readonly abaAtiva = signal<RelatorioAba>('visao-geral');
  readonly filtros = signal<RelatorioFiltro>({ statusAluno: 'TODOS' });
  readonly carregando = signal(false);
  readonly erro = signal('');
  readonly exportandoPdf = signal(false);
  readonly exportandoXlsx = signal(false);

  readonly turmasOptions = signal<RelatorioFiltroOption[]>([]);
  readonly professoresOptions = signal<RelatorioFiltroOption[]>([]);

  readonly resumo = signal<RelatorioResumo | null>(null);
  readonly alunos = signal<RelatorioAlunosResponse | null>(null);
  readonly turmas = signal<RelatorioTurmasResponse | null>(null);
  readonly evasoes = signal<RelatorioEvasoesResponse | null>(null);
  readonly atendimentos = signal<RelatorioAtendimentosResponse | null>(null);
  readonly frequencias = signal<RelatorioFrequenciasResponse | null>(null);

  readonly totalRegistros = computed(() => {
    const resumo = this.resumo();
    if (!resumo) return 0;
    return resumo.alunos.total + resumo.turmas.total + resumo.matriculas.total;
  });

  ngOnInit(): void {
    this.carregarOpcoes();
    this.carregarRelatorios();
  }

  mudarAba(aba: RelatorioAba): void {
    this.abaAtiva.set(aba);
    this.anunciar(`Aba ${this.tabLabel(aba)} selecionada.`);
  }

  aplicarFiltros(filtros: RelatorioFiltro): void {
    this.filtros.set(this.normalizarFiltro(filtros));
    this.carregarRelatorios();
  }

  limparFiltros(): void {
    this.filtros.set({ statusAluno: 'TODOS' });
    this.carregarRelatorios();
  }

  recarregar(): void {
    this.carregarRelatorios();
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

  tabLabel(aba: RelatorioAba): string {
    return this.tabs.find((tab) => tab.id === aba)?.label ?? aba;
  }

  private carregarRelatorios(): void {
    this.carregando.set(true);
    this.erro.set('');

    const filtros = this.filtros();
    forkJoin({
      resumo: this.relatoriosService.resumo(filtros),
      alunos: this.relatoriosService.alunos(filtros),
      turmas: this.relatoriosService.turmas(filtros),
      evasoes: this.relatoriosService.evasoes(filtros),
      atendimentos: this.relatoriosService.atendimentos(filtros),
      frequencias: this.relatoriosService.frequencias(filtros),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resultado) => {
          this.resumo.set(resultado.resumo);
          this.alunos.set(resultado.alunos);
          this.turmas.set(resultado.turmas);
          this.evasoes.set(resultado.evasoes);
          this.atendimentos.set(resultado.atendimentos);
          this.frequencias.set(resultado.frequencias);
          this.carregando.set(false);
        },
        error: () => {
          this.erro.set('Não foi possível carregar os relatórios.');
          this.carregando.set(false);
        },
      });
  }

  private carregarOpcoes(): void {
    forkJoin({
      turmas: this.turmasService.listar(1, 500, undefined, 'all', undefined, undefined, 'all'),
      professores: this.turmasService.listarProfessoresAtivos(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ turmas, professores }) => {
          this.turmasOptions.set(turmas.data.map((turma) => ({ id: turma.id, label: turma.nome })));
          this.professoresOptions.set(professores.map((professor) => ({ id: professor.id, label: professor.nome })));
        },
        error: () => {
          this.turmasOptions.set([]);
          this.professoresOptions.set([]);
        },
      });
  }

  private normalizarFiltro(filtros: RelatorioFiltro): RelatorioFiltro {
    const limpo: RelatorioFiltro = {};
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        limpo[key as keyof RelatorioFiltro] = value as never;
      }
    });
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
