import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, finalize, firstValueFrom, takeUntil } from 'rxjs';
import {
  Beneficiario,
  BeneficiariosService,
  LinhaTempoAlunoItem,
  LinhaTempoAlunoQuery,
  LinhaTempoAlunoResumo,
  LinhaTempoTurmaResumo,
} from '../../../core/services/beneficiarios.service';
import { DataBraillePipe } from '../../../shared/pipes/data-braille.pipe';
import { AlunoLinhaTempoComponent } from '../components/aluno-linha-tempo/aluno-linha-tempo';

@Component({
  selector: 'app-aluno-linha-tempo-page',
  standalone: true,
  imports: [CommonModule, FormsModule, DataBraillePipe, AlunoLinhaTempoComponent],
  templateUrl: './aluno-linha-tempo-page.html',
  styleUrl: './aluno-linha-tempo-page.scss',
})
export class AlunoLinhaTempoPage implements OnInit, OnDestroy {
  readonly tiposObservacao = [
    'Reuniao com familia',
    'Entrega de material',
    'Contato com responsavel',
    'Encaminhamento externo',
    'Orientacao da secretaria',
    'Observacao administrativa',
  ];

  alunoId = '';
  aluno: Beneficiario | null = null;
  carregandoAluno = true;
  erro = '';
  resumo: LinhaTempoAlunoResumo = { totalEventos: 0 };
  refreshKey = 0;
  observacaoAberta = false;
  salvandoObservacao = false;
  exportandoPdf = false;
  erroObservacao = '';
  erroExportacao = '';
  turmasObservacao: LinhaTempoTurmaResumo[] = [];
  observacaoManual = this.novaObservacaoManual();

  @ViewChild(AlunoLinhaTempoComponent) linhaTempoComponent?: AlunoLinhaTempoComponent;

  private readonly destroy$ = new Subject<void>();
  private destruido = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly beneficiariosService: BeneficiariosService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.alunoId = this.route.snapshot.paramMap.get('id') ?? '';
    if (!this.alunoId) {
      this.erro = 'Aluno nao informado.';
      this.carregandoAluno = false;
      return;
    }

    this.carregarAluno();
    this.carregarResumoLinhaTempo();
  }

  ngOnDestroy(): void {
    this.destruido = true;
    this.destroy$.next();
    this.destroy$.complete();
  }

  voltar(): void {
    this.router.navigate(['/admin/alunos']);
  }

  atualizar(): void {
    this.refreshKey++;
    this.carregarAluno();
    this.carregarResumoLinhaTempo();
  }

  async exportar(): Promise<void> {
    if (!this.alunoId || this.exportandoPdf) return;

    const janela = window.open('', '_blank', 'width=980,height=720');
    if (!janela) {
      this.erroExportacao = 'Nao foi possivel abrir a janela de impressao. Verifique o bloqueador de pop-ups.';
      this.atualizarTela();
      return;
    }

    this.exportandoPdf = true;
    this.erroExportacao = '';
    this.atualizarTela();

    try {
      janela.document.write(this.htmlCarregandoExportacao());
      janela.document.close();

      const query = this.linhaTempoComponent?.queryExportacao(100) ?? { page: 1, limit: 100 };
      const eventos = await this.buscarTodosEventos(query);
      const html = this.montarHtmlExportacao(eventos, query);

      janela.document.open();
      janela.document.write(html);
      janela.document.close();
      janela.focus();
      setTimeout(() => janela.print(), 250);
    } catch {
      this.erroExportacao = 'Nao foi possivel exportar a linha do tempo.';
      janela.close();
    } finally {
      this.exportandoPdf = false;
      this.atualizarTela();
    }
  }

  abrirObservacaoManual(): void {
    this.observacaoManual = this.novaObservacaoManual();
    this.erroObservacao = '';
    this.observacaoAberta = true;
    this.carregarTurmasObservacao();
  }

  fecharObservacaoManual(): void {
    if (this.salvandoObservacao) return;
    this.observacaoAberta = false;
  }

  selecionarTipoObservacao(titulo: string): void {
    this.observacaoManual.titulo = titulo;
  }

  salvarObservacaoManual(): void {
    const titulo = this.observacaoManual.titulo.trim();
    if (!titulo) {
      this.erroObservacao = 'Informe um titulo para a observacao.';
      return;
    }

    this.salvandoObservacao = true;
    this.erroObservacao = '';

    this.beneficiariosService
      .criarEventoLinhaTempoManual(this.alunoId, {
        tipo: 'OBSERVACAO_MANUAL',
        dataEvento: this.observacaoManual.dataEvento || undefined,
        titulo,
        descricao: this.observacaoManual.descricao.trim() || undefined,
        turmaId: this.observacaoManual.turmaId || undefined,
        sensivel: this.observacaoManual.sensivel,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.salvandoObservacao = false;
          this.observacaoAberta = false;
          this.refreshKey++;
          this.carregarResumoLinhaTempo();
          this.atualizarTela();
        },
        error: (err) => {
          this.erroObservacao = err?.error?.message || 'Nao foi possivel registrar a observacao.';
          this.salvandoObservacao = false;
          this.atualizarTela();
        },
      });
  }

  private carregarAluno(): void {
    this.carregandoAluno = true;
    this.erro = '';

    this.beneficiariosService
      .buscarPorId(this.alunoId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.carregandoAluno = false;
          this.atualizarTela();
        }),
      )
      .subscribe({
        next: (aluno) => {
          this.aluno = aluno;
        },
        error: (err) => {
          this.erro = err?.error?.message || 'Nao foi possivel carregar os dados do aluno.';
        },
      });
  }

  private carregarResumoLinhaTempo(): void {
    this.beneficiariosService
      .linhaTempoResumo(this.alunoId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resumo) => {
          this.resumo = resumo;
          this.atualizarTela();
        },
        error: () => {
          this.resumo = { totalEventos: 0 };
          this.atualizarTela();
        },
      });
  }

  private carregarTurmasObservacao(): void {
    this.beneficiariosService
      .linhaTempoTurmas(this.alunoId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (turmas) => {
          this.turmasObservacao = turmas;
          this.atualizarTela();
        },
        error: () => {
          this.turmasObservacao = [];
          this.atualizarTela();
        },
      });
  }

  private novaObservacaoManual() {
    return {
      titulo: '',
      descricao: '',
      dataEvento: new Date().toISOString().slice(0, 10),
      turmaId: '',
      sensivel: false,
    };
  }

  private atualizarTela(): void {
    if (this.destruido) return;
    this.cdr.detectChanges();
  }

  private async buscarTodosEventos(query: LinhaTempoAlunoQuery): Promise<LinhaTempoAlunoItem[]> {
    const limit = Math.min(Number(query.limit) || 100, 100);
    let page = 1;
    let lastPage = 1;
    const eventos: LinhaTempoAlunoItem[] = [];

    do {
      const response = await firstValueFrom(
        this.beneficiariosService.linhaTempo(this.alunoId, {
          ...query,
          page,
          limit,
        }),
      );
      eventos.push(...(response.data ?? []));
      lastPage = response.meta?.lastPage ?? page;
      page++;
    } while (page <= lastPage);

    return eventos;
  }

  private montarHtmlExportacao(eventos: LinhaTempoAlunoItem[], query: LinhaTempoAlunoQuery): string {
    const alunoNome = this.aluno?.nomeCompleto ?? 'Aluno';
    const matricula = this.aluno?.matricula ? ` - Matricula ${this.aluno.matricula}` : '';
    const filtro = this.linhaTempoComponent?.descricaoFiltroAtual() ?? 'Todos';
    const turma = this.linhaTempoComponent?.descricaoTurmaAtual() ?? 'Todas as turmas do aluno';
    const periodo = this.descreverPeriodo(query);
    const emitidoEm = new Date().toLocaleString('pt-BR');

    const eventosHtml = eventos.length
      ? eventos.map((evento) => this.montarEventoHtml(evento)).join('')
      : '<p class="empty">Nenhum evento encontrado para os filtros selecionados.</p>';

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Linha do Tempo do Aluno</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; color: #111827; margin: 32px; line-height: 1.45; }
    header { border-bottom: 3px solid #facc15; padding-bottom: 16px; margin-bottom: 22px; }
    h1 { font-size: 24px; margin: 0 0 6px; }
    h2 { font-size: 16px; margin: 20px 0 10px; }
    .muted { color: #4b5563; font-size: 12px; }
    .filters { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 20px; margin-top: 14px; font-size: 12px; }
    .event { border-left: 3px solid #facc15; padding: 0 0 18px 14px; margin-left: 6px; page-break-inside: avoid; }
    .date { font-size: 12px; font-weight: 700; color: #374151; }
    .badge { display: inline-block; margin-left: 8px; padding: 2px 8px; border-radius: 999px; background: #eef2ff; color: #1f2937; font-size: 10px; font-weight: 700; }
    .title { font-size: 15px; font-weight: 700; margin: 4px 0; }
    .description { white-space: pre-wrap; margin: 4px 0 6px; }
    .meta { color: #4b5563; font-size: 11px; }
    .empty { padding: 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; }
    @media print { body { margin: 18mm; } button { display: none; } }
  </style>
</head>
<body>
  <header>
    <h1>Linha do Tempo do Aluno</h1>
    <div>${this.escapeHtml(alunoNome)}${this.escapeHtml(matricula)}</div>
    <div class="muted">Emitido em ${this.escapeHtml(emitidoEm)}</div>
    <div class="filters">
      <div><strong>Filtro:</strong> ${this.escapeHtml(filtro)}</div>
      <div><strong>Turma:</strong> ${this.escapeHtml(turma)}</div>
      <div><strong>Periodo:</strong> ${this.escapeHtml(periodo)}</div>
      <div><strong>Total:</strong> ${eventos.length} evento(s)</div>
    </div>
  </header>
  <main>
    <h2>Eventos</h2>
    ${eventosHtml}
  </main>
</body>
</html>`;
  }

  private montarEventoHtml(evento: LinhaTempoAlunoItem): string {
    const data = this.formatarData(evento.data);
    const meta = [
      evento.turmaNome ? `Turma: ${evento.turmaNome}` : '',
      evento.professorNome ? `Professor: ${evento.professorNome}` : '',
      evento.usuarioNome ? `Responsavel: ${evento.usuarioNome}` : '',
    ].filter(Boolean).join(' | ');

    return `<article class="event">
  <div class="date">${this.escapeHtml(data)} <span class="badge">${this.escapeHtml(this.formatarTipo(evento.tipo))}</span></div>
  <div class="title">${this.escapeHtml(evento.titulo)}</div>
  ${evento.descricao ? `<div class="description">${this.escapeHtml(evento.descricao)}</div>` : ''}
  ${meta ? `<div class="meta">${this.escapeHtml(meta)}</div>` : ''}
</article>`;
  }

  private htmlCarregandoExportacao(): string {
    return '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Exportando</title></head><body><p>Preparando PDF...</p></body></html>';
  }

  private descreverPeriodo(query: LinhaTempoAlunoQuery): string {
    if (query.dataInicio && query.dataFim) return `${this.formatarData(query.dataInicio)} a ${this.formatarData(query.dataFim)}`;
    if (query.dataInicio) return `A partir de ${this.formatarData(query.dataInicio)}`;
    if (query.dataFim) return `Ate ${this.formatarData(query.dataFim)}`;
    return 'Todo o periodo';
  }

  private formatarData(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  }

  private formatarTipo(tipo: string): string {
    return tipo
      .toLowerCase()
      .split('_')
      .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
      .join(' ');
  }

  private escapeHtml(value: string): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
