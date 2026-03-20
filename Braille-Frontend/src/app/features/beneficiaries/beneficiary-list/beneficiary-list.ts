import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy, Directive, ElementRef, HostListener, Input, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormControl, FormBuilder, FormGroup } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil, forkJoin } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BeneficiariosService, Beneficiario } from '../../../core/services/beneficiarios.service';
import { FrequenciasService } from '../../../core/services/frequencias.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { ToastService } from '../../../core/services/toast.service';
import { FormatDatePipe } from '../../../shared/pipes/data-braille.pipe';
import { CpfRgPipe } from '../../../shared/pipes/cpf-rg.pipe';
import { PdfViewerComponent } from '../../../shared/components/pdf-viewer/pdf-viewer.component';
import { ImportModalComponent } from '../import-modal/import-modal';
import { AuthService } from '../../../core/services/auth.service';
import { A11yModule, FocusKeyManager, FocusableOption, LiveAnnouncer } from '@angular/cdk/a11y';
import { FormsModule } from '@angular/forms';
import { AtestadosService, Atestado, PreviewAtestado, CriarAtestadoDto } from '../../../core/services/atestados.service';


@Directive({
  selector: '[appTabelaTrFocavel]',
  standalone: true
})
export class TabelaTrFocavelDirective implements FocusableOption {
  @Input() disabled = false;

  constructor(public element: ElementRef<HTMLElement>) { }

  focus(): void {
    this.element.nativeElement.focus();
  }
}

@Component({
  selector: 'app-beneficiary-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, A11yModule, FormatDatePipe, CpfRgPipe, PdfViewerComponent, ImportModalComponent],
  templateUrl: './beneficiary-list.html',
  styleUrl: './beneficiary-list.scss'
})
export class BeneficiaryList implements OnInit, OnDestroy {
  alunos: Beneficiario[] = [];
  isLoading = true;
  erro = '';

  // Modal Ver Aluno
  modalAberto = false;
  carregandoDetalhes = false;
  uploadingImage = false;
  deletandoImage = false;
  alunoSelecionado: Beneficiario | null = null;

  // Modal de Visualização de PDF
  mostrarVisualizadorPdf = false;
  urlPdfParaVisualizar: string | null = null;

  // Modal de Visualização de Imagem (laudo fotográfico)
  mostrarModalImagem = false;
  urlImagemParaVisualizar: string | null = null;

  // Modal da Ficha Técnica do Aluno (substitui window.open)
  mostrarModalFicha = false;
  fichaHtml: SafeHtml | null = null;
  fichaAlunoNome = '';

  // Modais de Confirmação (Padronizados)
  alunoParaInativar: Beneficiario | null = null;
  alunoParaRestaurar: Beneficiario | null = null;
  alunoParaExcluirDefinitivo: Beneficiario | null = null;
  salvando = false;

  documentoParaExcluir: { tipo: 'fotoPerfil' | 'laudoUrl' | 'termoLgpdUrl'; url: string } | null = null;
  frequenciasMap: Map<string, { presentes: number; faltas: number; taxaPresenca: number }> = new Map();

  // KeyManager
  @ViewChildren(TabelaTrFocavelDirective) linhasTabela!: QueryList<TabelaTrFocavelDirective>;
  public keyManager!: FocusKeyManager<TabelaTrFocavelDirective>;

  // Abas
  abaAtiva: 'ativos' | 'inativos' = 'ativos';

  // Paginação
  paginaAtual = 1;
  totalPaginas = 1;
  total = 0;
  readonly limite = 10;

  // Busca
  buscaCtrl = new FormControl('');

  private destroy$ = new Subject<void>();

  // Modal de Edição
  modalEdicaoAberto = false;
  alunoEmEdicao: Beneficiario | null = null;
  salvandoEdicao = false;
  editForm!: FormGroup;

  // Modal de Importação
  modalImportAberto = false;
  isAdmin = false;


  // Acessibilidade: restaurar foco após fechar modal (WCAG 2.4.3)
  private lastFocusBeforeModal: HTMLElement | null = null;

  // ── Filtros Avançados (Drawer) ──────────────────────────────────
  drawerAberto = false;
  filterForm!: FormGroup;

  // ── Exportação ──────────────────────────────────────────────────
  exportando = false;

  // ── Atestados ───────────────────────────────────────────────────
  atestadosDoAluno: Atestado[] = [];
  carregandoAtestados = false;
  modalAtestadoAberto = false;
  salvandoAtestado = false;
  uploadingAtestado = false;
  erroAtestado = '';
  atestadoPreview: PreviewAtestado | null = null;
  novoAtestado: CriarAtestadoDto = { dataInicio: '', dataFim: '', motivo: '', arquivoUrl: undefined };

  constructor(
    private beneficiariosService: BeneficiariosService,
    private cdr: ChangeDetectorRef,
    private confirmDialog: ConfirmDialogService,
    private toast: ToastService,
    private fb: FormBuilder,
    private authService: AuthService,
    private frequenciasService: FrequenciasService,
    private liveAnnouncer: LiveAnnouncer,
    private sanitizer: DomSanitizer,
    private atestadosService: AtestadosService
  ) {
    this.editForm = this.fb.group({
      nomeCompleto: [''],
      cpf: [''],
      rg: [''],
      dataNascimento: [''],
      genero: [''],
      corRaca: [''],
      email: [''],
      telefoneContato: [''],
      // Endereço
      cep: [''],
      rua: [''],
      numero: [''],
      complemento: [''],
      bairro: [''],
      cidade: [''],
      uf: [''],
      // Deficiência
      tipoDeficiencia: [''],
      causaDeficiencia: [''],
      idadeOcorrencia: [''],
      tecAssistivas: [''],
      prefAcessibilidade: [''],
      outrasComorbidades: [''],
      // Socioeconômico
      escolaridade: [''],
      profissao: [''],
      rendaFamiliar: [''],
      beneficiosGov: [''],
      composicaoFamiliar: [''],
      precisaAcompanhante: [false],
      acompOftalmologico: [false],
      contatoEmergencia: [''],
    });
    this.filterForm = this.fb.group({
      tipoDeficiencia: [''],
      causaDeficiencia: [''],
      prefAcessibilidade: [''],
      precisaAcompanhante: [''],
      genero: [''],
      corRaca: [''],
      estadoCivil: [''],
      cidade: [''],
      uf: [''],
      escolaridade: [''],
      rendaFamiliar: [''],
      dataCadastroInicio: [''],
      dataCadastroFim: [''],
    });
  }

  ngOnInit(): void {
    this.buscaCtrl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.paginaAtual = 1;
      this.carregar();
    });

    const user = this.authService.getUser();
    this.isAdmin = user?.role === 'ADMIN' || user?.role === 'SECRETARIA';
    this.carregar();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    this.keyManager = new FocusKeyManager(this.linhasTabela).withWrap();
    this.linhasTabela.changes.subscribe(() => {
      this.keyManager.withWrap();
    });
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    const algumModalAberto = this.modalAberto || this.modalEdicaoAberto || this.drawerAberto ||
      this.modalImportAberto || !!this.alunoParaInativar || !!this.alunoParaRestaurar ||
      !!this.alunoParaExcluirDefinitivo || !!this.documentoParaExcluir;

    // C-05: Escape fecha qualquer modal aberto (WCAG 2.1.2)
    if (event.key === 'Escape') {
      if (this.modalEdicaoAberto) { this.fecharModalEdicao(); event.preventDefault(); }
      else if (this.modalAberto) { this.fecharModal(); event.preventDefault(); }
      else if (this.drawerAberto) { this.drawerAberto = false; this.cdr.markForCheck(); event.preventDefault(); }
      return;
    }

    if (this.keyManager && !algumModalAberto) {
      if (['ArrowUp', 'ArrowDown'].includes(event.key)) {
        this.keyManager.onKeydown(event);
        event.preventDefault();
      }
      // C-03: Enter na linha focada abre o modal de edição (WCAG 2.1.1)
      if (event.key === 'Enter') {
        const activeIndex = this.keyManager.activeItemIndex ?? -1;
        if (activeIndex >= 0 && activeIndex < this.alunos.length) {
          const aluno = this.alunos[activeIndex];
          this.abrirModalEdicao(aluno);
          event.preventDefault();
        }
      }
    }
  }

  // ── Modal de Importação ─────────────────────────────────────────────
  onImportFechou(devRecarregar: boolean): void {
    this.modalImportAberto = false;
    if (devRecarregar) {
      this.paginaAtual = 1;
      this.carregar();
    }
    this.cdr.markForCheck();
  }

  carregar(): void {
    this.isLoading = true;
    const busca = this.buscaCtrl.value?.trim() || undefined;
    const filtros = this.filtrosAtivos();
    this.beneficiariosService.listar(this.paginaAtual, this.limite, busca, this.abaAtiva === 'inativos', filtros).subscribe({

      next: (res) => {
        this.alunos = res.data;
        this.total = res.meta.total;
        this.totalPaginas = res.meta.lastPage;
        this.isLoading = false;
        this.cdr.markForCheck();
        this.liveAnnouncer.announce(`Lista atualizada: ${this.total} beneficiários encontrados.`);
      },
      error: () => {
        this.erro = 'Erro ao carregar alunos. Tente novamente.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  // ── Ficha Técnica do Aluno ─────────────────────────────────────────────────
  /**
   * Gera o HTML da ficha e exibe num overlay Angular acessível,
   * em vez de abrir uma nova janela do navegador.
   */
  imprimirFicha(): void {
    const a = this.alunoSelecionado;
    if (!a) return;

    this.lastFocusBeforeModal = document.activeElement as HTMLElement;

    const fmtData = (v?: string | Date | null) => {
      if (!v) return 'Não informado';
      try { return new Date(v as string).toLocaleDateString('pt-BR', { timeZone: 'UTC' }); }
      catch { return String(v); }
    };
    const ni = (v: any) => v || 'Não informado';
    const sim = (v: boolean | undefined) => v ? 'Sim' : 'Não';
    const agora = new Date();
    const dataGeracao = `${agora.toLocaleDateString('pt-BR')} ${agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

    const historicoHtml = a.matriculasOficina && a.matriculasOficina.length > 0
      ? `<table style="width:100%;border-collapse:collapse;margin-top:8px;font-size:8.5pt;">
          <thead><tr style="background:#e5e7eb;text-align:left;">
            <th style="padding:6px;border:1px solid #d1d5db;">Oficina</th>
            <th style="padding:6px;border:1px solid #d1d5db;">Entrada</th>
            <th style="padding:6px;border:1px solid #d1d5db;">Saída</th>
            <th style="padding:6px;border:1px solid #d1d5db;text-align:center;">Pres.</th>
            <th style="padding:6px;border:1px solid #d1d5db;text-align:center;">Faltas</th>
            <th style="padding:6px;border:1px solid #d1d5db;text-align:center;">%</th>
            <th style="padding:6px;border:1px solid #d1d5db;">Status</th>
          </tr></thead>
          <tbody>${a.matriculasOficina.map(m => {
              const s = this.frequenciasMap.get(m.turma.id);
              return `<tr>
                <td style="padding:6px;border:1px solid #d1d5db;">${m.turma.nome}</td>
                <td style="padding:6px;border:1px solid #d1d5db;">${fmtData(m.dataEntrada)}</td>
                <td style="padding:6px;border:1px solid #d1d5db;">${fmtData(m.dataEncerramento)}</td>
                <td style="padding:6px;border:1px solid #d1d5db;text-align:center;">${s?.presentes ?? '—'}</td>
                <td style="padding:6px;border:1px solid #d1d5db;text-align:center;">${s?.faltas ?? '—'}</td>
                <td style="padding:6px;border:1px solid #d1d5db;text-align:center;">${s?.taxaPresenca != null ? s.taxaPresenca + '%' : '—'}</td>
                <td style="padding:6px;border:1px solid #d1d5db;">${m.status === 'ATIVA' ? 'Em Curso' : m.status}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>`
      : '<p style="color:#777;margin-top:8px;">Nenhuma oficina registrada.</p>';

    const fichaConteudo = `
      <div style="font-family:Arial,sans-serif;font-size:10pt;color:#111;">
        <div style="display:flex;align-items:center;justify-content:space-between;
                    border-bottom:2px solid #111;padding-bottom:8px;margin-bottom:12px;">
          <div>
            <div style="font-size:13pt;font-weight:bold;">Instituto Luiz Braille</div>
            <div style="font-size:9pt;color:#555;">Ficha de Cadastro do Aluno</div>
          </div>
          <div style="font-size:8pt;color:#555;text-align:right;">Gerado em: ${dataGeracao}</div>
        </div>

        <div style="font-size:14pt;font-weight:bold;margin-bottom:4px;">${a.nomeCompleto}</div>
        <div style="display:flex;gap:6px;margin-bottom:12px;">
          <span style="font-size:8pt;padding:2px 8px;border-radius:12px;border:1px solid;
            ${a.statusAtivo ? 'background:#d1fae5;border-color:#059669;color:#065f46;' : 'background:#fee2e2;border-color:#dc2626;color:#991b1b;'}">
            ${a.statusAtivo ? 'Ativo' : 'Inativo'}
          </span>
          ${a.tipoDeficiencia ? `<span style="font-size:8pt;padding:2px 8px;border-radius:12px;border:1px solid;
            background:#eff6ff;border-color:#3b82f6;color:#1e40af;">${(a.tipoDeficiencia).replace(/_/g, ' ')}</span>` : ''}
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px;">
          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:8px 10px;">
            <h4 style="font-size:9pt;text-transform:uppercase;letter-spacing:.05em;color:#374151;
              border-bottom:1px solid #e5e7eb;padding-bottom:4px;margin-bottom:6px;">Informações Pessoais</h4>
            <p style="font-size:9pt;margin:3px 0;"><strong>CPF:</strong> ${ni(a.cpf)} &nbsp;|&nbsp; <strong>RG:</strong> ${ni(a.rg)}</p>
            <p style="font-size:9pt;margin:3px 0;"><strong>Mat.:</strong> ${ni(a.matricula)}</p>
            <p style="font-size:9pt;margin:3px 0;"><strong>Nascimento:</strong> ${fmtData(a.dataNascimento)}</p>
            <p style="font-size:9pt;margin:3px 0;"><strong>Gênero:</strong> ${ni(a.genero)}</p>
            <p style="font-size:9pt;margin:3px 0;"><strong>Estado Civil:</strong> ${ni(a.estadoCivil)}</p>
            <p style="font-size:9pt;margin:3px 0;"><strong>Telefone:</strong> ${ni(a.telefoneContato)}</p>
            <p style="font-size:9pt;margin:3px 0;"><strong>E-mail:</strong> ${ni(a.email)}</p>
            <p style="font-size:9pt;margin:3px 0;"><strong>Contato Emergência:</strong> ${ni(a.contatoEmergencia)}</p>
          </div>
          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:8px 10px;">
            <h4 style="font-size:9pt;text-transform:uppercase;letter-spacing:.05em;color:#374151;
              border-bottom:1px solid #e5e7eb;padding-bottom:4px;margin-bottom:6px;">Perfil Inclusivo</h4>
            <p style="font-size:9pt;margin:3px 0;"><strong>Causa:</strong> ${ni(a.causaDeficiencia)}</p>
            <p style="font-size:9pt;margin:3px 0;"><strong>Idade na Ocorrência:</strong> ${ni(a.idadeOcorrencia)}</p>
            <p style="font-size:9pt;margin:3px 0;"><strong>Acessibilidade Preferida:</strong> ${ni(a.prefAcessibilidade)}</p>
            <p style="font-size:9pt;margin:3px 0;"><strong>Tec. Assistivas:</strong> ${ni(a.tecAssistivas)}</p>
            <p style="font-size:9pt;margin:3px 0;"><strong>Acompanhante:</strong> ${sim(a.precisaAcompanhante)}</p>
            <p style="font-size:9pt;margin:3px 0;"><strong>Acomp. Oftalmológico:</strong> ${sim(a.acompOftalmologico)}</p>
            ${a.outrasComorbidades ? `<p style="font-size:9pt;margin:3px 0;"><strong>Comorbidades:</strong> ${a.outrasComorbidades}</p>` : ''}
          </div>
          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:8px 10px;grid-column:1/-1;">
            <h4 style="font-size:9pt;text-transform:uppercase;letter-spacing:.05em;color:#374151;
              border-bottom:1px solid #e5e7eb;padding-bottom:4px;margin-bottom:6px;">Endereço</h4>
            <p style="font-size:9pt;margin:3px 0;">${ni(a.rua)}${a.numero ? ', ' + a.numero : ''}${a.complemento ? ' — ' + a.complemento : ''}</p>
            <p style="font-size:9pt;margin:3px 0;">${ni(a.bairro)} — ${ni(a.cidade)} / ${ni(a.uf)}</p>
            <p style="font-size:9pt;margin:3px 0;"><strong>CEP:</strong> ${ni(a.cep)}</p>
          </div>
          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:8px 10px;">
            <h4 style="font-size:9pt;text-transform:uppercase;letter-spacing:.05em;color:#374151;
              border-bottom:1px solid #e5e7eb;padding-bottom:4px;margin-bottom:6px;">Socioeconômico</h4>
            <p style="font-size:9pt;margin:3px 0;"><strong>Escolaridade:</strong> ${ni(a.escolaridade)}</p>
            <p style="font-size:9pt;margin:3px 0;"><strong>Profissão:</strong> ${ni(a.profissao)}</p>
            <p style="font-size:9pt;margin:3px 0;"><strong>Renda Familiar:</strong> ${ni(a.rendaFamiliar)}</p>
            <p style="font-size:9pt;margin:3px 0;"><strong>Benefícios Gov.:</strong> ${ni(a.beneficiosGov)}</p>
            <p style="font-size:9pt;margin:3px 0;"><strong>Composição Familiar:</strong> ${ni(a.composicaoFamiliar)}</p>
          </div>
          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:8px 10px;">
            <h4 style="font-size:9pt;text-transform:uppercase;letter-spacing:.05em;color:#374151;
              border-bottom:1px solid #e5e7eb;padding-bottom:4px;margin-bottom:6px;">Sistema</h4>
            <p style="font-size:9pt;margin:3px 0;"><strong>Cadastrado em:</strong> ${fmtData(a.criadoEm)}</p>
            <p style="font-size:9pt;margin:3px 0;"><strong>Possui Laudo:</strong> ${a.laudoUrl ? 'Sim (arquivo digital)' : 'Não'}</p>
          </div>
          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:8px 10px;grid-column:1/-1;">
            <h4 style="font-size:9pt;text-transform:uppercase;letter-spacing:.05em;color:#374151;
              border-bottom:1px solid #e5e7eb;padding-bottom:4px;margin-bottom:6px;">Histórico de Oficinas</h4>
            ${historicoHtml}
          </div>
        </div>

        <div style="margin-top:16px;border-top:1px solid #ccc;padding-top:6px;
          font-size:7.5pt;color:#777;text-align:right;">
          Instituto Luiz Braille &nbsp;|&nbsp; Documento gerado automaticamente pelo sistema
        </div>
      </div>`;

    this.fichaHtml = this.sanitizer.bypassSecurityTrustHtml(fichaConteudo);
    this.fichaAlunoNome = a.nomeCompleto;
    this.mostrarModalFicha = true;
    this.cdr.detectChanges();
  }

  /** Abre janela mínima de impressão apenas com o conteúdo da ficha */
  imprimirFichaModal(): void {
    // Extrai o HTML bruto do SafeHtml (a propriedade interna do Angular)
    const rawHtml = (this.fichaHtml as any)?.changingThisBreaksApplicationSecurity ?? '';

    const printWin = window.open('', '_blank',
      'width=900,height=700,toolbar=0,scrollbars=1,status=0,menubar=0');

    if (!printWin) {
      // Fallback: se o popup for bloqueado, avisa o usuário
      alert('Por favor, permita popups para este site para usar a impressão.');
      return;
    }

    printWin.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Ficha – ${this.fichaAlunoNome}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 10pt; color: #111;
           background: #fff; padding: 16px; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>${rawHtml}</body>
</html>`);

    printWin.document.close();
    printWin.focus();
    // Aguarda renderização e dispara o diálogo de impressão
    setTimeout(() => {
      printWin.print();
      printWin.close();
    }, 350);
  }

  /** Fecha o modal da ficha e devolve foco ao botão de origem */
  fecharModalFicha(): void {
    this.mostrarModalFicha = false;
    this.fichaHtml = null;
    this.cdr.detectChanges();
    setTimeout(() => this.lastFocusBeforeModal?.focus(), 0);
  }

  // ── Filtros Avançados ────────────────────────────────────────────

  /** Extrai do filterForm apenas os valores preenchidos (ignora vazios) */
  filtrosAtivos(): Record<string, any> | undefined {
    const val = this.filterForm.value;
    const filtros: Record<string, any> = {};
    Object.entries(val).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') filtros[k] = v;
    });
    return Object.keys(filtros).length > 0 ? filtros : undefined;
  }

  /** Conta quantos filtros estão ativos (exclui campos vazios) para o badge */
  get quantidadeFiltrosAtivos(): number {
    return Object.values(this.filterForm.value).filter(v => v !== null && v !== undefined && v !== '').length;
  }

  aplicarFiltros(): void {
    this.drawerAberto = false;
    this.paginaAtual = 1;
    this.beneficiariosService.limparCache();
    this.carregar();
    this.cdr.markForCheck();
  }

  limparFiltros(): void {
    this.filterForm.reset();
    this.paginaAtual = 1;
    this.beneficiariosService.limparCache();
    this.carregar();
    this.cdr.markForCheck();
  }

  irParaPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.paginaAtual = pagina;
    this.carregar();
  }

  /** Retorna a janela de páginas visíveis: até 5 ao redor da atual + reticências (-1).
   *  Exemplo com 50 páginas na página 25: [1, -1, 23, 24, 25, 26, 27, -1, 50]
   */
  get paginasVisiveis(): number[] {
    const total = this.totalPaginas;
    const atual = this.paginaAtual;
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const janela = 2; // páginas de cada lado da atual
    const inicio = Math.max(2, atual - janela);
    const fim = Math.min(total - 1, atual + janela);

    const paginas: number[] = [1];
    if (inicio > 2) paginas.push(-1); // reticências esquerda
    for (let p = inicio; p <= fim; p++) paginas.push(p);
    if (fim < total - 1) paginas.push(-1); // reticências direita
    paginas.push(total);
    return paginas;
  }

  // ── Modal de Edição ────────────────────────────────────────────
  abrirModalEdicao(aluno: Beneficiario): void {
    this.lastFocusBeforeModal = document.activeElement as HTMLElement;
    this.alunoEmEdicao = aluno;
    this.modalEdicaoAberto = true;
    this.cdr.markForCheck();

    // C-06: Mover foco para o primeiro campo do modal ao abrir (WCAG 2.4.3)
    setTimeout(() => {
      const primeiroFocavel = document.querySelector<HTMLElement>(
        '.modal-edicao input:not([disabled]), .modal-edicao select:not([disabled]), .modal-edicao textarea:not([disabled]), .modal-edicao button'
      );
      primeiroFocavel?.focus();
    }, 80);

    // Carrega dados completos do aluno para preencher o form
    this.beneficiariosService.buscarPorId(aluno.id).subscribe({
      next: (dadosCompletos) => {
        // Formata a data de nascimento para yyyy-MM-dd (formato do input[type=date])
        const dataNasc = dadosCompletos.dataNascimento
          ? dadosCompletos.dataNascimento.substring(0, 10)
          : '';
        this.editForm.patchValue({ ...dadosCompletos, dataNascimento: dataNasc });
        this.cdr.markForCheck();
      }
    });
  }

  fecharModalEdicao(): void {
    this.modalEdicaoAberto = false;
    this.alunoEmEdicao = null;
    this.editForm.reset();
    setTimeout(() => this.lastFocusBeforeModal?.focus(), 0);
  }

  salvarEdicao(): void {
    if (!this.alunoEmEdicao || this.salvandoEdicao) return;
    this.salvandoEdicao = true;

    const rawVal = this.editForm.value;
    const payload = {
      ...rawVal,
      cpf: rawVal.cpf ? String(rawVal.cpf).replace(/\D/g, '') : rawVal.cpf,
      rg: rawVal.rg ? String(rawVal.rg).replace(/\D/g, '') : rawVal.rg,
      telefoneContato: rawVal.telefoneContato ? rawVal.telefoneContato.replace(/\D/g, '') : rawVal.telefoneContato,
      cep: rawVal.cep ? rawVal.cep.replace(/\D/g, '') : rawVal.cep
    };
    this.beneficiariosService.atualizar(this.alunoEmEdicao.id, payload).subscribe({
      next: () => {
        setTimeout(() => {
          this.salvandoEdicao = false;
          this.fecharModalEdicao();
          this.toast.sucesso('Aluno atualizado com sucesso!');
          this.carregar();
        }, 0);
      },
      error: () => {
        setTimeout(() => {
          this.salvandoEdicao = false;
          this.toast.erro('Erro ao atualizar os dados do aluno.');
          this.cdr.markForCheck();
        }, 0);
      }
    });
  }

  // ── Exportar Lista para Excel ─────────────────────────────────────
  exportarListaParaXlsx(): void {
    if (this.exportando) return;
    this.exportando = true;
    this.cdr.markForCheck();

    const busca = this.buscaCtrl.value?.trim() || undefined;
    const filtros = this.filtrosAtivos();

    this.beneficiariosService.exportarLista(busca, this.abaAtiva === 'inativos', filtros)
      .subscribe({
        next: (buffer: ArrayBuffer) => {
          const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          const date = new Date().toISOString().slice(0, 10);
          const status = this.abaAtiva === 'inativos' ? 'Inativos' : 'Ativos';
          a.href = url;
          a.download = `Alunos_${status}_${date}.xlsx`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          this.exportando = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.toast.erro('Erro ao exportar a lista. Tente novamente.');
          this.exportando = false;
          this.cdr.markForCheck();
        },
      });
  }

  inativar(aluno: Beneficiario): void {
    this.alunoParaInativar = aluno;
  }

  cancelarInativacao(): void {
    this.alunoParaInativar = null;
  }

  confirmarInativacao(): void {
    if (!this.alunoParaInativar) return;
    this.salvando = true;

    this.beneficiariosService.inativar(this.alunoParaInativar.id).subscribe({
      next: () => {
        setTimeout(() => {
          this.salvando = false;
          this.alunoParaInativar = null;
          this.toast.sucesso('Aluno inativado com sucesso!');
          this.carregar();
        }, 0);
      },
      error: () => {
        setTimeout(() => {
          this.salvando = false;
          this.toast.erro('Erro ao inativar aluno.');
          this.cdr.markForCheck();
        }, 0);
      }
    });
  }

  setAba(aba: 'ativos' | 'inativos'): void {
    if (this.abaAtiva === aba) return;
    this.abaAtiva = aba;
    this.paginaAtual = 1;
    this.carregar();
  }

  // Lógica de Exclusão Definitiva
  excluirDefinitivamente(aluno: Beneficiario): void {
    this.alunoParaExcluirDefinitivo = aluno;
  }

  cancelarExclusaoDefinitiva(): void {
    this.alunoParaExcluirDefinitivo = null;
  }

  confirmarExclusaoDefinitiva(): void {
    if (!this.alunoParaExcluirDefinitivo) return;
    this.salvando = true;

    this.beneficiariosService.excluirDefinitivo(this.alunoParaExcluirDefinitivo.id).subscribe({
      next: () => {
        setTimeout(() => {
          this.salvando = false;
          this.alunoParaExcluirDefinitivo = null;
          this.toast.sucesso('Aluno excluído definitivamente com sucesso!');
          this.carregar();
        }, 0);
      },
      error: () => {
        setTimeout(() => {
          this.salvando = false;
          this.toast.erro('Erro ao excluir aluno definitivamente.');
          this.cdr.detectChanges();
        }, 0);
      }
    });
  }

  // Lógica de Restauração
  restaurarConta(aluno: Beneficiario): void {
    this.alunoParaRestaurar = aluno;
  }

  cancelarRestauracao(): void {
    this.alunoParaRestaurar = null;
  }

  confirmarRestauracao(): void {
    if (!this.alunoParaRestaurar) return;
    this.salvando = true;

    this.beneficiariosService.restaurar(this.alunoParaRestaurar.id).subscribe({
      next: () => {
        setTimeout(() => {
          this.salvando = false;
          this.alunoParaRestaurar = null;
          this.toast.sucesso('Aluno restaurado com sucesso!');
          this.carregar();
        }, 0);
      },
      error: () => {
        setTimeout(() => {
          this.salvando = false;
          this.toast.erro('Erro ao restaurar aluno.');
          this.cdr.detectChanges();
        }, 0);
      }
    });
  }

  // Visualização de Perfil Inteiro
  abrirModal(aluno: Beneficiario): void {
    this.lastFocusBeforeModal = document.activeElement as HTMLElement;
    this.modalAberto = true;
    this.carregandoDetalhes = true;
    this.alunoSelecionado = null;
    this.frequenciasMap.clear();

    this.beneficiariosService.buscarPorId(aluno.id).subscribe({
      next: (dadosCompletos) => {
        this.alunoSelecionado = dadosCompletos;

        // Se o aluno tiver matrículas em oficinas, busca as frequências para cada uma
        const matriculasAtivas = dadosCompletos.matriculasOficina?.filter(m => m.status === 'ATIVA' || m.status === 'CONCLUIDA') || [];

        if (matriculasAtivas.length > 0) {
          const requests = matriculasAtivas.map(m =>
            this.frequenciasService.getRelatorioAluno(m.turma.id, dadosCompletos.id)
          );

          forkJoin(requests).subscribe({
            next: (resultados) => {
              resultados.forEach((res, index) => {
                const turmaId = matriculasAtivas[index].turma.id;
                this.frequenciasMap.set(turmaId, res.estatisticas);
              });
              this.carregandoDetalhes = false;
              this.cdr.markForCheck();
            },
            error: () => {
              // Se falhar a frequência, pelo menos mostra o perfil
              this.carregandoDetalhes = false;
              this.cdr.markForCheck();
            }
          });
        } else {
          this.carregandoDetalhes = false;
          this.cdr.markForCheck();
        }
      },
      error: () => {
        this.carregandoDetalhes = false;
        this.modalAberto = false;
        this.cdr.markForCheck();
      }
    });
  }

  fecharModal(): void {
    this.modalAberto = false;
    this.alunoSelecionado = null;
    setTimeout(() => this.lastFocusBeforeModal?.focus(), 0);
  }

  getAvatarUrl(aluno: Beneficiario): string {
    if (aluno.fotoPerfil) return aluno.fotoPerfil;
    const genero = aluno.genero ? aluno.genero.toLowerCase() : '';
    if (genero === 'feminino') return 'assets/images/avatar-female.svg';
    if (genero === 'masculino') return 'assets/images/avatar-male.svg';
    return 'assets/images/avatar-neutral.svg';
  }

  // --- Lógica de Upload e Exclusão de Arquivos no Perfil ---
  async processarUploadArquivo(event: any, tipo: 'fotoPerfil' | 'laudoUrl' | 'termoLgpdUrl'): Promise<void> {
    const file = event.target.files[0];
    if (!file || !this.alunoSelecionado) return;

    this.uploadingImage = true;
    this.cdr.detectChanges();

    const ehPdf = file.type === 'application/pdf';
    let upload$: any;
    if (tipo === 'termoLgpdUrl') {
      upload$ = this.beneficiariosService.uploadPdf(file, 'lgpd');
    } else if (ehPdf) {
      upload$ = this.beneficiariosService.uploadPdf(file, 'atestado');
    } else {
      upload$ = this.beneficiariosService.uploadImagem(file);
    }

    upload$.subscribe({
      next: (res: any) => {
        const updatePayload: Partial<Beneficiario> = {};
        updatePayload[tipo] = res.url;
        if (tipo === 'termoLgpdUrl') {
          updatePayload['termoLgpdAceito'] = true;
          updatePayload['termoLgpdAceitoEm'] = new Date().toISOString();
        }

        this.beneficiariosService.atualizar(this.alunoSelecionado!.id, updatePayload).subscribe({
          next: (alunoAtualizado) => {
            setTimeout(() => {
              this.alunoSelecionado = alunoAtualizado;
              this.uploadingImage = false;
              this.toast.sucesso('Documento salvo com sucesso!');
              this.carregar();
            }, 0);
          },
          error: () => {
            setTimeout(() => {
              this.uploadingImage = false;
              this.toast.erro('Erro ao vincular documento ao aluno.');
              this.cdr.detectChanges();
            }, 0);
          }
        });
      },
      error: () => {
        this.uploadingImage = false;
        this.toast.erro('Erro ao enviar documento. Tente novamente.');
        this.cdr.detectChanges();
      }
    });
  }

  excluirDocumento(tipo: 'fotoPerfil' | 'laudoUrl' | 'termoLgpdUrl'): void {
    if (!this.alunoSelecionado) return;
    const urlAtual = this.alunoSelecionado[tipo];
    if (!urlAtual) return;

    this.documentoParaExcluir = { tipo, url: urlAtual };
  }

  cancelarExclusaoDocumento(): void {
    this.documentoParaExcluir = null;
  }

  confirmarExclusaoDocumento(): void {
    if (!this.alunoSelecionado || !this.documentoParaExcluir) return;

    this.deletandoImage = true;
    this.cdr.detectChanges();

    const { tipo, url } = this.documentoParaExcluir;

    this.beneficiariosService.excluirArquivo(url).subscribe({
      next: () => {
        const updatePayload: Partial<Beneficiario> = {};
        updatePayload[tipo] = '';

        this.beneficiariosService.atualizar(this.alunoSelecionado!.id, updatePayload).subscribe({
          next: () => {
            setTimeout(() => {
              if (this.alunoSelecionado) {
                this.alunoSelecionado[tipo] = '';
              }
              this.deletandoImage = false;
              this.documentoParaExcluir = null;
              this.toast.sucesso('Documento excluído com sucesso!');
              this.carregar();
            }, 0);
          },
          error: () => {
            setTimeout(() => {
              this.deletandoImage = false;
              this.toast.erro('Erro ao desvincular documento do aluno.');
              this.cdr.detectChanges();
            }, 0);
          }
        });
      },
      error: () => {
        this.deletandoImage = false;
        this.toast.erro('Erro ao excluir documento.');
        this.cdr.detectChanges();
      }
    });
  }

  // ── Visualização de Documentos ───────────────────────────────────────

  /**
   * Detecta se a URL aponta para um PDF ou para uma imagem.
   * PDFs do Cloudinary chegam com /raw/upload/ ou terminam em .pdf
   */
  tipoDocumento(url: string | undefined | null): 'pdf' | 'imagem' | null {
    if (!url) return null;
    const lower = url.toLowerCase();
    if (lower.includes('.pdf') || lower.includes('/raw/upload/')) return 'pdf';
    return 'imagem';
  }

  // ── PDF Viewer ────────────────────────────────────────────────────────
  abrirVisualizadorPdf(urlDocumento: string | undefined): void {
    if (!urlDocumento) return;
    this.urlPdfParaVisualizar = urlDocumento;
    this.mostrarVisualizadorPdf = true;
    this.cdr.detectChanges();
  }

  fecharVisualizadorPdf(): void {
    this.mostrarVisualizadorPdf = false;
    this.urlPdfParaVisualizar = null;
    this.cdr.detectChanges();
  }

  // ── Modal de Imagem (laudo fotográfico) ──────────────────────────────
  abrirModalImagem(url: string): void {
    this.urlImagemParaVisualizar = url;
    this.mostrarModalImagem = true;
    this.cdr.detectChanges();
  }

  fecharModalImagem(): void {
    this.mostrarModalImagem = false;
    this.urlImagemParaVisualizar = null;
    this.cdr.detectChanges();
  }

  // ── Utilitários de data ──────────────────────────────────────────
  hojeISO(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  formatarData(iso: string): string {
    if (!iso) return '—';
    const partes = iso.substring(0, 10).split('-');
    if (partes.length !== 3) return iso;
    const [ano, mes, dia] = partes;
    return `${dia}/${mes}/${ano}`;
  }

  // ── Módulo Atestados ─────────────────────────────────────────────
  abrirModalAtestado(): void {
    this.modalAtestadoAberto = true;
    this.novoAtestado = { dataInicio: '', dataFim: '', motivo: '', arquivoUrl: undefined };
    this.atestadoPreview = null;
    this.erroAtestado = '';
    this.cdr.detectChanges();
  }

  fecharModalAtestado(): void {
    this.modalAtestadoAberto = false;
    this.novoAtestado = { dataInicio: '', dataFim: '', motivo: '', arquivoUrl: undefined };
    this.atestadoPreview = null;
    this.erroAtestado = '';
    this.cdr.detectChanges();
  }

  buscarPreviewAtestado(): void {
    if (!this.alunoSelecionado || !this.novoAtestado.dataInicio || !this.novoAtestado.dataFim) return;
    this.atestadosService.preview(
      this.alunoSelecionado.id,
      this.novoAtestado.dataInicio,
      this.novoAtestado.dataFim
    ).subscribe({
      next: (res) => { this.atestadoPreview = res; this.cdr.detectChanges(); },
      error: () => { this.atestadoPreview = null; }
    });
  }

  uploadArquivoAtestado(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploadingAtestado = true;
    this.cdr.detectChanges();

    const ehPdf = file.type === 'application/pdf';
    const upload$ = ehPdf ? this.beneficiariosService.uploadPdf(file, 'atestado') : this.beneficiariosService.uploadImagem(file);

    upload$.subscribe({
      next: (res: any) => {
        this.novoAtestado.arquivoUrl = res.url ?? res.secure_url ?? res;
        this.uploadingAtestado = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.erroAtestado = 'Erro ao enviar arquivo. Tente novamente.';
        this.uploadingAtestado = false;
        this.cdr.detectChanges();
      }
    });
  }

  salvarAtestado(): void {
    if (!this.alunoSelecionado || this.salvandoAtestado) return;
    const dto = this.novoAtestado;
    if (!dto.dataInicio || !dto.dataFim || !dto.motivo) {
      this.erroAtestado = 'Preencha Data Início, Data Fim e Motivo.';
      return;
    }
    this.salvandoAtestado = true;
    this.erroAtestado = '';
    this.atestadosService.criar(this.alunoSelecionado.id, dto).subscribe({
      next: (res) => {
        this.salvandoAtestado = false;
        this.fecharModalAtestado();
        this.toast.sucesso(`Atestado salvo! ${res.faltasJustificadas} falta(s) justificada(s).`);
        this.carregarAtestados();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.salvandoAtestado = false;
        this.erroAtestado = err?.error?.message ?? 'Erro ao salvar atestado.';
        this.cdr.detectChanges();
      }
    });
  }

  removerAtestado(id: string): void {
    this.confirmDialog.confirmar({
      titulo: 'Remover Atestado',
      mensagem: 'Tem certeza? As faltas justificadas por este atestado voltarão ao status FALTA.',
      textoBotaoConfirmar: 'Remover',
      tipo: 'danger'
    }).then((confirmado: boolean) => {
      if (!confirmado) return;
      this.atestadosService.remover(id).subscribe({
        next: () => {
          this.toast.sucesso('Atestado removido e faltas revertidas.');
          this.carregarAtestados();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.toast.erro(err?.error?.message ?? 'Erro ao remover atestado.');
        }
      });
    });
  }

  carregarAtestados(): void {
    if (!this.alunoSelecionado) return;
    this.carregandoAtestados = true;
    this.atestadosService.listar(this.alunoSelecionado.id).subscribe({
      next: (lista) => {
        this.atestadosDoAluno = lista;
        this.carregandoAtestados = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.carregandoAtestados = false;
        this.cdr.detectChanges();
      }
    });
  }

}

