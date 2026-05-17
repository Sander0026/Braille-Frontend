import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy, Directive, ElementRef, HostListener, Input, ViewChildren, QueryList, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormControl, FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, debounceTime, distinctUntilChanged, takeUntil, forkJoin } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {
  BeneficiariosService,
  Beneficiario,
  InativarAlunoPayload,
  MotivoInativacaoAluno,
  StatusInativacaoMatricula,
} from '../../../core/services/beneficiarios.service';
import { FrequenciasService } from '../../../core/services/frequencias.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { ToastService } from '../../../core/services/toast.service';
import { DataBraillePipe } from '../../../shared/pipes/data-braille.pipe';
import { CpfRgPipe } from '../../../shared/pipes/cpf-rg.pipe';
import { TelefonePipe } from '../../../shared/pipes/telefone.pipe';
import { CepPipe } from '../../../shared/pipes/cep.pipe';
import { formatarTelefone, formatarCep } from '../../../shared/utils/masks.util';
import { PdfViewerComponent } from '../../../shared/components/pdf-viewer/pdf-viewer.component';
import { ImportModalComponent } from '../import-modal/import-modal';
import { BeneficiaryFormComponent } from '../beneficiary-form/beneficiary-form';
import { AlunoLinhaTempoComponent } from '../components/aluno-linha-tempo/aluno-linha-tempo';
import { AuthService } from '../../../core/services/auth.service';
import { A11yModule, FocusKeyManager, FocusableOption, LiveAnnouncer } from '@angular/cdk/a11y';
import { AtestadosService, Atestado, PreviewAtestado } from '../../../core/services/atestados.service';
import { LaudosService, LaudoMedico } from '../../../core/services/laudos.service';
import { ModelosCertificadosService } from '../../../core/services/modelos-certificados.service';
import {
  AreaPdi,
  PdiAluno,
  PdiMeta,
  PdiService,
  StatusMetaPdi,
  StatusPdi,
} from '../../../core/services/pdi.service';
import { ComponenteComDescarte } from '../../../core/interfaces/componente-com-descarte.interface';
import { AcompanhamentoIndividual } from '../../atendimentos-individuais/models/acompanhamento-individual.model';
import { AtendimentosIndividuaisApiService } from '../../atendimentos-individuais/services/atendimentos-individuais-api.service';


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

type InativacaoForm = {
  motivoInativacao: MotivoInativacaoAluno;
  encerrarMatriculasAtivas: boolean;
  statusMatricula: StatusInativacaoMatricula;
  observacao: string;
};

type PdiForm = {
  titulo: string;
  objetivoGeral: string;
  diagnosticoInicial: string;
  necessidadesAcessibilidade: string;
  recursosUtilizados: string;
  observacoesGerais: string;
  dataInicio: string;
  dataFimPrevista: string;
};

type PdiMetaForm = {
  area: AreaPdi;
  descricao: string;
  estrategia: string;
  prazo: string;
};

type PdiEvolucaoForm = {
  descricao: string;
  dificuldades: string;
  avancos: string;
  proximosPassos: string;
};

@Component({
  selector: 'app-beneficiary-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, A11yModule, DataBraillePipe, CpfRgPipe, TelefonePipe, CepPipe, PdfViewerComponent, ImportModalComponent, BeneficiaryFormComponent, AlunoLinhaTempoComponent],
  templateUrl: './beneficiary-list.html',
  styleUrl: './beneficiary-list.scss'
})
export class BeneficiaryList implements OnInit, OnDestroy, ComponenteComDescarte {
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
  readonly motivosInativacaoOptions: ReadonlyArray<{ value: MotivoInativacaoAluno; label: string }> = [
    { value: 'EVASAO_INSTITUCIONAL', label: 'Evasão institucional' },
    { value: 'MUDANCA_DE_CIDADE', label: 'Mudança de cidade' },
    { value: 'PROBLEMA_SAUDE', label: 'Problema de saúde' },
    { value: 'PROBLEMA_FAMILIAR', label: 'Problema familiar' },
    { value: 'DIFICULDADE_TRANSPORTE', label: 'Dificuldade de transporte' },
    { value: 'FALECIMENTO', label: 'Falecimento' },
    { value: 'SOLICITACAO_DO_ALUNO', label: 'Solicitação do aluno' },
    { value: 'FALTA_DE_CONTATO', label: 'Falta de contato' },
    { value: 'CADASTRO_DUPLICADO', label: 'Cadastro duplicado' },
    { value: 'OUTRO', label: 'Outro' },
  ];
  readonly statusMatriculaInativacaoOptions: ReadonlyArray<{ value: StatusInativacaoMatricula; label: string }> = [
    { value: 'EVADIDA', label: 'Evadida' },
    { value: 'CANCELADA', label: 'Cancelada' },
    { value: 'TRANSFERIDA', label: 'Transferida' },
  ];
  private readonly inativacaoFormPadrao: InativacaoForm = {
    motivoInativacao: 'EVASAO_INSTITUCIONAL',
    encerrarMatriculasAtivas: true,
    statusMatricula: 'EVADIDA',
    observacao: '',
  };
  inativacaoForm: InativacaoForm = { ...this.inativacaoFormPadrao };

  documentoParaExcluir: { tipo: 'fotoPerfil' | 'laudoUrl' | 'termoLgpdUrl'; url: string } | null = null;
  frequenciasMap: Map<string, { presentes: number; faltas: number; taxaPresenca: number }> = new Map();
  acompanhamentosIndividuaisAluno: AcompanhamentoIndividual[] = [];
  carregandoAtendimentosIndividuais = false;
  pdisAluno: PdiAluno[] = [];
  pdiAtivoAluno: PdiAluno | null = null;
  carregandoPdi = false;
  salvandoPdi = false;
  erroPdi = '';
  modalPdiFormAberto = false;
  modalPdiMetaAberto = false;
  modalPdiEvolucaoAberto = false;
  pdiForm: PdiForm = this.criarPdiFormPadrao();
  pdiMetaForm: PdiMetaForm = this.criarPdiMetaFormPadrao();
  pdiEvolucaoForm: PdiEvolucaoForm = this.criarPdiEvolucaoFormPadrao();
  readonly areasPdiOptions: ReadonlyArray<{ value: AreaPdi; label: string }> = [
    { value: 'BRAILLE', label: 'Braille' },
    { value: 'ORIENTACAO_MOBILIDADE', label: 'Orientacao e mobilidade' },
    { value: 'INFORMATICA_ACESSIVEL', label: 'Informatica acessivel' },
    { value: 'AUTONOMIA', label: 'Autonomia' },
    { value: 'SOCIALIZACAO', label: 'Socializacao' },
    { value: 'ATIVIDADE_PEDAGOGICA', label: 'Atividade pedagogica' },
    { value: 'OUTRO', label: 'Outro' },
  ];
  readonly statusMetaPdiOptions: ReadonlyArray<{ value: StatusMetaPdi; label: string }> = [
    { value: 'NAO_INICIADA', label: 'Nao iniciada' },
    { value: 'EM_ANDAMENTO', label: 'Em andamento' },
    { value: 'ALCANCADA', label: 'Alcancada' },
    { value: 'PARCIALMENTE_ALCANCADA', label: 'Parcialmente alcancada' },
    { value: 'NAO_ALCANCADA', label: 'Nao alcancada' },
    { value: 'CANCELADA', label: 'Cancelada' },
  ];

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

  private readonly destroy$ = new Subject<void>();

  // Modal de Edição
  modalEdicaoAberto = false;
  alunoEmEdicao: Beneficiario | null = null;
  @ViewChild(BeneficiaryFormComponent) formEdicaoComponent?: BeneficiaryFormComponent;

  // Modal de Importação
  modalImportAberto = false;
  isAdmin = false;


  // Acessibilidade: restaurar foco após fechar modal (WCAG 2.4.3)
  private focusStack: HTMLElement[] = [];

  private pushFocus(): void {
    const el = document.activeElement as HTMLElement;
    if (el) this.focusStack.push(el);
  }

  private popFocus(): void {
    const fn = () => {
      const el = this.focusStack.pop();
      if (el && document.body.contains(el)) el.focus();
    };
    setTimeout(fn, 50);
  }

  private anunciarStatusModal(area: 'atestados' | 'laudos' | 'lgpd', mensagem: string, politeness: 'polite' | 'assertive' = 'polite'): void {
    if (area === 'atestados') this.statusAtestados = mensagem;
    if (area === 'laudos') this.statusLaudos = mensagem;
    if (area === 'lgpd') this.statusLgpd = mensagem;
    this.liveAnnouncer.announce(mensagem, politeness);
  }

  private limparFormularioAtestado(restaurarFoco = true): void {
    if (restaurarFoco) this.popFocus();
    this.modalAtestadoAberto = false;
    this.atestadoEmEdicao = null;
    this.novoAtestado = { dataInicio: '', dataFim: '', motivo: '', arquivoUrl: undefined };
    this.atestadoPreview = null;
    this.erroAtestado = '';
    this.statusAtestados = '';
  }

  private limparFormularioLaudo(restaurarFoco = true): void {
    if (restaurarFoco) this.popFocus();
    this.modalLaudoAberto = false;
    this.laudoEmEdicao = null;
    this.novoLaudo = { dataEmissao: '', medicoResponsavel: '', descricao: '', arquivoUrl: '' };
    this.erroLaudo = '';
    this.statusLaudos = '';
  }

  private fecharCamadaSuperiorPorEscape(): boolean {
    if (this.mostrarModalImagem) {
      this.fecharModalImagem();
      return true;
    }
    if (this.mostrarVisualizadorPdf) {
      this.fecharVisualizadorPdf();
      return true;
    }
    if (this.modalLgpdAberto) {
      this.fecharModalLgpd();
      return true;
    }
    if (this.modalPdiEvolucaoAberto) {
      this.fecharModalEvolucaoPdi();
      return true;
    }
    if (this.modalPdiMetaAberto) {
      this.fecharModalMetaPdi();
      return true;
    }
    if (this.modalPdiFormAberto) {
      this.fecharModalCriarPdi();
      return true;
    }
    if (this.modalLaudoAberto) {
      this.fecharModalLaudoForm();
      return true;
    }
    if (this.gerenciandoLaudos) {
      this.fecharModalGerenciamentoLaudos();
      return true;
    }
    if (this.modalAtestadoAberto) {
      this.fecharModalAtestadoForm();
      return true;
    }
    if (this.gerenciandoAtestados) {
      this.fecharModalGerenciamentoAtestados();
      return true;
    }
    if (this.mostrarModalFicha) {
      this.fecharModalFicha();
      return true;
    }
    if (this.modalEdicaoAberto) {
      this.tentarFecharModalEdicao();
      return true;
    }
    if (this.modalAberto) {
      this.fecharModal();
      return true;
    }
    if (this.drawerAberto) {
      this.drawerAberto = false;
      this.cdr.markForCheck();
      return true;
    }
    return false;
  }

  // ── Filtros Avançados (Drawer) ──────────────────────────────────
  drawerAberto = false;
  filterForm!: FormGroup;

  // ── Exportação ──────────────────────────────────────────────────
  exportando = false;
  emitindoCertificadoId: string | null = null;

  // ── Atestados ───────────────────────────────────────────────────
  gerenciandoAtestados = false; // Modal dedicado
  atestadosDoAluno: Atestado[] = [];
  carregandoAtestados = false;
  modalAtestadoAberto = false; // Form de criação
  salvandoAtestado = false;
  uploadingAtestado = false;
  erroAtestado = '';
  atestadoPreview: PreviewAtestado | null = null;
  atestadoEmEdicao: Atestado | null = null;
  novoAtestado: any = { dataInicio: '', dataFim: '', motivo: '', arquivoUrl: undefined };

  // ── Laudos Médicos ──────────────────────────────────────────────
  gerenciandoLaudos = false; // Modal dedicado
  laudosDoAluno: LaudoMedico[] = [];
  carregandoLaudos = false;
  modalLaudoAberto = false; // Form de criação
  salvandoLaudo = false;
  uploadingLaudo = false;
  erroLaudo = '';
  laudoEmEdicao: LaudoMedico | null = null;
  novoLaudo: any = { dataEmissao: '', medicoResponsavel: '', descricao: '', arquivoUrl: '' };

  // ── Termo LGPD ──────────────────────────────────────────────────
  modalLgpdAberto = false;
  uploadingLgpd = false;
  salvandoLgpd = false;
  erroLgpd = '';
  novoLgpdUrl = '';
  statusAtestados = '';
  statusLaudos = '';
  statusLgpd = '';

  constructor(
    private readonly beneficiariosService: BeneficiariosService,
    private readonly cdr: ChangeDetectorRef,
    private readonly confirmDialog: ConfirmDialogService,
    private readonly toast: ToastService,
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly frequenciasService: FrequenciasService,
    private readonly liveAnnouncer: LiveAnnouncer,
    private readonly sanitizer: DomSanitizer,
    private readonly atestadosService: AtestadosService,
    private readonly laudosService: LaudosService,
    private readonly http: HttpClient,
    private readonly modelosCertificadosService: ModelosCertificadosService,
    private readonly atendimentosIndividuaisService: AtendimentosIndividuaisApiService,
    private readonly pdiService: PdiService
  ) {

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
  onKeydown(event: Event) {
    const kbEvent = event as KeyboardEvent;
    const algumModalAberto = this.modalAberto || this.modalEdicaoAberto || this.drawerAberto ||
      this.modalImportAberto || !!this.alunoParaInativar || !!this.alunoParaRestaurar ||
      !!this.alunoParaExcluirDefinitivo || !!this.documentoParaExcluir ||
      this.gerenciandoAtestados || this.modalAtestadoAberto ||
      this.gerenciandoLaudos || this.modalLaudoAberto ||
      this.modalPdiFormAberto || this.modalPdiMetaAberto || this.modalPdiEvolucaoAberto ||
      this.modalLgpdAberto || this.mostrarVisualizadorPdf ||
      this.mostrarModalImagem || this.mostrarModalFicha;

    // C-05: Escape fecha qualquer modal aberto (WCAG 2.1.2)
    if (kbEvent.key === 'Escape') {
      if (this.fecharCamadaSuperiorPorEscape()) {
        kbEvent.preventDefault();
        kbEvent.stopPropagation();
      }
      return;
    }

    if (this.keyManager && !algumModalAberto) {
      if (['ArrowUp', 'ArrowDown'].includes(kbEvent.key)) {
        this.keyManager.onKeydown(kbEvent);
        kbEvent.preventDefault();
      }
      // C-03: Enter na linha focada abre o modal de edição (WCAG 2.1.1)
      if (kbEvent.key === 'Enter') {
        const activeIndex = this.keyManager.activeItemIndex ?? -1;
        if (activeIndex >= 0 && activeIndex < this.alunos.length) {
          const aluno = this.alunos[activeIndex];
          this.abrirModalEdicao(aluno);
          kbEvent.preventDefault();
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

    this.pushFocus();

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
              const statusEfetivo = (m.status === 'ATIVA' && m.turma.status === 'CONCLUIDA') ? 'CONCLUIDA' : m.status;
              const statusDisplay = statusEfetivo === 'ATIVA' ? 'Em Curso' : statusEfetivo === 'CONCLUIDA' ? 'Concluída' : statusEfetivo === 'EVADIDA' ? 'Evadido(a)' : 'Cancelada';
              return `<tr>
                <td style="padding:6px;border:1px solid #d1d5db;">${m.turma.nome}</td>
                <td style="padding:6px;border:1px solid #d1d5db;">${fmtData(m.dataEntrada)}</td>
                <td style="padding:6px;border:1px solid #d1d5db;">${fmtData(m.dataEncerramento)}</td>
                <td style="padding:6px;border:1px solid #d1d5db;text-align:center;">${s?.presentes ?? '—'}</td>
                <td style="padding:6px;border:1px solid #d1d5db;text-align:center;">${s?.faltas ?? '—'}</td>
                <td style="padding:6px;border:1px solid #d1d5db;text-align:center;">${s?.taxaPresenca != null ? s.taxaPresenca + '%' : '—'}</td>
                <td style="padding:6px;border:1px solid #d1d5db;">${statusDisplay}</td>
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

        <div style="display:flex;align-items:center;margin-bottom:12px;">
          ${a.fotoPerfil ? `<img src="${a.fotoPerfil}" style="width:70px;height:70px;border-radius:50%;object-fit:cover;margin-right:16px;border:2px solid #e5e7eb;flex-shrink:0;" alt="Foto de Perfil do Aluno" />` : ''}
          <div>
            <div style="font-size:14pt;font-weight:bold;margin-bottom:4px;">${a.nomeCompleto}</div>
            <div style="display:flex;gap:6px;">
              <span style="font-size:8pt;padding:2px 8px;border-radius:12px;border:1px solid;
                ${a.statusAtivo ? 'background:#d1fae5;border-color:#059669;color:#065f46;' : 'background:#fee2e2;border-color:#dc2626;color:#991b1b;'}">
                ${a.statusAtivo ? 'Ativo' : 'Inativo'}
              </span>
              ${a.tipoDeficiencia ? `<span style="font-size:8pt;padding:2px 8px;border-radius:12px;border:1px solid;
                background:#eff6ff;border-color:#3b82f6;color:#1e40af;">${(a.tipoDeficiencia).replace(/_/g, ' ')}</span>` : ''}
            </div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:8px 10px;">
            <h4 style="font-size:9pt;text-transform:uppercase;letter-spacing:.05em;color:#374151;
              border-bottom:1px solid #e5e7eb;padding-bottom:4px;margin-bottom:6px;">Informações Pessoais</h4>
            <p style="font-size:9pt;margin:3px 0;"><strong>CPF:</strong> ${ni(a.cpf)} &nbsp;|&nbsp; <strong>RG:</strong> ${ni(a.rg)}</p>
            <p style="font-size:9pt;margin:3px 0;"><strong>Mat.:</strong> ${ni(a.matricula)}</p>
            <p style="font-size:9pt;margin:3px 0;"><strong>Nascimento:</strong> ${fmtData(a.dataNascimento)}</p>
            <p style="font-size:9pt;margin:3px 0;"><strong>Gênero:</strong> ${ni(a.genero)}</p>
            <p style="font-size:9pt;margin:3px 0;"><strong>Estado Civil:</strong> ${ni(a.estadoCivil)}</p>
            <p style="font-size:9pt;margin:3px 0;"><strong>Telefone:</strong> ${ni(formatarTelefone(a.telefoneContato || ''))}</p>
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
            <p style="font-size:9pt;margin:3px 0;"><strong>CEP:</strong> ${ni(formatarCep(a.cep || ''))}</p>
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
    this.popFocus();
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
    this.liveAnnouncer.announce('Aplicando filtros avançados. Carregando...', 'polite');
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
    this.pushFocus();

    this.beneficiariosService.buscarPorId(aluno.id).subscribe({
      next: (dadosCompletos) => {
        // ✅ Ordem atômica garantida:
        // 1. Popula alunoEmEdicao PRIMEIRO
        // 2. Só ENTÃO abre o modal
        // Isso elimina o race condition onde modalEdicaoAberto=true chegava
        // antes de alunoEmEdicao ser definido, fazendo o form iniciar em modo CRIAÇÃO.
        this.alunoEmEdicao = dadosCompletos;
        this.modalEdicaoAberto = true;
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.erro('Não foi possível carregar os dados do aluno. Tente novamente.');
        this.cdr.markForCheck();
      },
    });
  }


  fecharModalEdicao(): void {
    this.modalEdicaoAberto = false;
    this.alunoEmEdicao = null;
    this.popFocus();
  }

  async tentarFecharModalEdicao(): Promise<void> {
    const podeFechar = await this.podeDescartar();
    if (!podeFechar) return;
    this.fecharModalEdicao();
  }

  async podeDescartar(): Promise<boolean> {
    if (this.modalEdicaoAberto && this.formEdicaoComponent) {
      return await this.formEdicaoComponent.podeDescartar();
    }
    return true;
  }

  aoSalvarEdicao(): void {
    this.fecharModalEdicao();
    this.toast.sucesso('Aluno atualizado com sucesso!');
    this.carregar();
  }

  // ── Exportar Lista para Excel ─────────────────────────────────────
  modalExportAberto = false;
  progressoExportacao = 0;
  exportTimer: any;

  exportarListaParaXlsx(): void {
    if (this.exportando) return;
    this.exportando = true;
    this.modalExportAberto = true;
    this.progressoExportacao = 0;
    this.liveAnnouncer.announce('Iniciando exportação da planilha. Progresso em 0%', 'assertive');
    this.cdr.markForCheck();

    // Inicia simulação de progresso mais realista (não-linear)
    this.exportTimer = setInterval(() => {
      let increment = 0;
      if (this.progressoExportacao < 40) {
        increment = Math.floor(Math.random() * 6) + 3; // 3% a 8%
      } else if (this.progressoExportacao < 70) {
        increment = Math.floor(Math.random() * 4) + 1; // 1% a 4%
      } else if (this.progressoExportacao < 90) {
        increment = Math.floor(Math.random() * 2) + 1; // 1% a 2%
      } else if (this.progressoExportacao < 98) {
        increment = Math.random() > 0.6 ? 1 : 0; // 1% ocasionalmente (muito lento)
      }

      if (increment > 0) {
        this.progressoExportacao += increment;
        if (this.progressoExportacao > 98) this.progressoExportacao = 98;
        
        // Anuncia a cada ~20%
        if ([20, 40, 60, 80].includes(this.progressoExportacao) || this.progressoExportacao === 50) {
          this.liveAnnouncer.announce(`Progresso da exportação em ${this.progressoExportacao}%`, 'polite');
        }
        this.cdr.markForCheck();
      }
    }, 1000);

    const busca = this.buscaCtrl.value?.trim() || undefined;
    const filtros = this.filtrosAtivos();

    this.beneficiariosService.exportarLista(busca, this.abaAtiva === 'inativos', filtros)
      .subscribe({
        next: (buffer: ArrayBuffer) => {
          clearInterval(this.exportTimer);
          this.progressoExportacao = 100;
          this.liveAnnouncer.announce('Exportação 100% concluída. O download vai começar.', 'assertive');
          this.cdr.markForCheck();

          setTimeout(() => {
            const blob = new Blob([buffer], {
              type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            const url = URL.createObjectURL(blob);
            const date = new Date().toISOString().slice(0, 10);
            const status = this.abaAtiva === 'inativos' ? 'Inativos' : 'Ativos';
            const nomeArquivo = `Alunos_${status}_${date}.xlsx`;

            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', nomeArquivo);
            link.click();
            URL.revokeObjectURL(url);
            
            this.exportando = false;
            this.modalExportAberto = false;
            this.liveAnnouncer.announce('Planilha exportada com sucesso.', 'assertive');
            this.cdr.markForCheck();
          }, 1000);
        },
        error: () => {
          clearInterval(this.exportTimer);
          this.exportando = false;
          this.modalExportAberto = false;
          this.toast.erro('Erro ao exportar a lista. Tente novamente.');
          this.liveAnnouncer.announce('Ocorreu um erro ao exportar a planilha.', 'assertive');
          this.cdr.markForCheck();
        },
      });
  }

  inativar(aluno: Beneficiario): void {
    this.pushFocus();
    this.inativacaoForm = { ...this.inativacaoFormPadrao };
    this.alunoParaInativar = aluno;
  }

  cancelarInativacao(): void {
    this.popFocus();
    this.alunoParaInativar = null;
    this.inativacaoForm = { ...this.inativacaoFormPadrao };
  }

  confirmarInativacao(): void {
    if (!this.alunoParaInativar) return;
    if (!this.inativacaoForm.motivoInativacao) {
      this.toast.erro('Informe o motivo da inativação.');
      return;
    }

    const observacao = this.inativacaoForm.observacao.trim();
    const payload: InativarAlunoPayload = {
      motivoInativacao: this.inativacaoForm.motivoInativacao,
      encerrarMatriculasAtivas: this.inativacaoForm.encerrarMatriculasAtivas,
      observacao: observacao || undefined,
      ...(this.inativacaoForm.encerrarMatriculasAtivas
        ? { statusMatricula: this.inativacaoForm.statusMatricula }
        : {}),
    };

    this.salvando = true;

    this.beneficiariosService.inativar(this.alunoParaInativar.id, payload).subscribe({
      next: () => {
        setTimeout(() => {
          this.salvando = false;
          this.alunoParaInativar = null;
          this.inativacaoForm = { ...this.inativacaoFormPadrao };
          this.toast.sucesso('Aluno inativado com sucesso!');
          this.carregar();
          this.popFocus();
          this.cdr.markForCheck();
        }, 0);
      },
      error: (e) => {
        setTimeout(() => {
          const detalhe = e?.error?.message;
          const mensagem = Array.isArray(detalhe) ? detalhe.join(' ') : detalhe || 'Erro ao inativar aluno.';
          this.salvando = false;
          this.toast.erro(mensagem);
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
    this.pushFocus();
    this.alunoParaExcluirDefinitivo = aluno;
  }

  cancelarExclusaoDefinitiva(): void {
    this.popFocus();
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
          this.popFocus();
          this.toast.erro('Erro ao excluir aluno definitivamente.');
          this.cdr.detectChanges();
        }, 0);
      }
    });
  }

  // Lógica de Restauração
  restaurarConta(aluno: Beneficiario): void {
    this.pushFocus();
    this.alunoParaRestaurar = aluno;
  }

  cancelarRestauracao(): void {
    this.popFocus();
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
          this.popFocus();
          this.toast.erro('Erro ao restaurar aluno.');
          this.cdr.detectChanges();
        }, 0);
      }
    });
  }

  // Visualização de Perfil Inteiro
  abrirModal(aluno: Beneficiario): void {
    this.pushFocus();
    this.modalAberto = true;
    this.carregandoDetalhes = true;
    this.alunoSelecionado = null;
    this.frequenciasMap.clear();
    this.acompanhamentosIndividuaisAluno = [];
    this.pdisAluno = [];
    this.pdiAtivoAluno = null;
    this.erroPdi = '';

    this.beneficiariosService.buscarPorId(aluno.id).subscribe({
      next: (dadosCompletos) => {
        this.alunoSelecionado = dadosCompletos;
        this.carregarAcompanhamentosIndividuaisDoAluno(dadosCompletos.id);
        this.carregarPdisDoAluno(dadosCompletos.id);

        // Se o aluno tiver matrículas em oficinas, busca as frequências para cada uma
        const matriculasAtivas = dadosCompletos.matriculasOficina?.filter(m => m.status === 'ATIVA' || m.status === 'CONCLUIDA') || [];

        if (matriculasAtivas.length > 0) {
          const requests = matriculasAtivas.map(m =>
            this.frequenciasService.getRelatorioAluno(m.turma.id, dadosCompletos.id)
          );

          forkJoin(requests).subscribe({
            next: (resultados: any[]) => {
              resultados.forEach((res: any, index: number) => {
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

  private carregarAcompanhamentosIndividuaisDoAluno(alunoId: string): void {
    this.carregandoAtendimentosIndividuais = true;
    this.atendimentosIndividuaisService.listar({ alunoId, limit: 20 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.acompanhamentosIndividuaisAluno = res.data;
          this.carregandoAtendimentosIndividuais = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.acompanhamentosIndividuaisAluno = [];
          this.carregandoAtendimentosIndividuais = false;
          this.cdr.markForCheck();
        }
      });
  }

  private carregarPdisDoAluno(alunoId: string): void {
    this.carregandoPdi = true;
    this.pdiService.listarPorAluno(alunoId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (pdis) => {
          this.pdisAluno = pdis;
          this.pdiAtivoAluno = pdis.find((pdi) => pdi.status === 'ATIVO') ?? null;
          this.carregandoPdi = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.pdisAluno = [];
          this.pdiAtivoAluno = null;
          this.carregandoPdi = false;
          this.cdr.markForCheck();
        }
      });
  }

  abrirModalCriarPdi(): void {
    if (!this.alunoSelecionado) return;
    this.erroPdi = '';
    this.pdiForm = this.criarPdiFormPadrao();
    this.pdiForm.titulo = `PDI - ${this.alunoSelecionado.nomeCompleto}`;
    this.modalPdiFormAberto = true;
  }

  fecharModalCriarPdi(): void {
    this.modalPdiFormAberto = false;
    this.pdiForm = this.criarPdiFormPadrao();
    this.erroPdi = '';
  }

  salvarPdi(): void {
    if (!this.alunoSelecionado || this.salvandoPdi) return;
    if (!this.pdiForm.titulo.trim() || !this.pdiForm.objetivoGeral.trim()) {
      this.erroPdi = 'Informe titulo e objetivo geral do PDI.';
      return;
    }

    this.salvandoPdi = true;
    this.pdiService.criar({
      alunoId: this.alunoSelecionado.id,
      titulo: this.pdiForm.titulo,
      objetivoGeral: this.pdiForm.objetivoGeral,
      diagnosticoInicial: this.pdiForm.diagnosticoInicial,
      necessidadesAcessibilidade: this.pdiForm.necessidadesAcessibilidade,
      recursosUtilizados: this.pdiForm.recursosUtilizados,
      observacoesGerais: this.pdiForm.observacoesGerais,
      dataInicio: this.pdiForm.dataInicio,
      dataFimPrevista: this.pdiForm.dataFimPrevista,
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.salvandoPdi = false;
        this.toast.sucesso('PDI criado com sucesso.');
        this.fecharModalCriarPdi();
        this.carregarPdisDoAluno(this.alunoSelecionado!.id);
      },
      error: (err) => {
        this.salvandoPdi = false;
        this.erroPdi = err?.error?.message || 'Nao foi possivel criar o PDI.';
        this.toast.erro(this.erroPdi);
        this.cdr.markForCheck();
      }
    });
  }

  abrirModalMetaPdi(): void {
    if (!this.pdiAtivoAluno) return;
    this.erroPdi = '';
    this.pdiMetaForm = this.criarPdiMetaFormPadrao();
    this.modalPdiMetaAberto = true;
  }

  fecharModalMetaPdi(): void {
    this.modalPdiMetaAberto = false;
    this.pdiMetaForm = this.criarPdiMetaFormPadrao();
    this.erroPdi = '';
  }

  salvarMetaPdi(): void {
    if (!this.alunoSelecionado || !this.pdiAtivoAluno || this.salvandoPdi) return;
    if (!this.pdiMetaForm.descricao.trim()) {
      this.erroPdi = 'Informe a descricao da meta.';
      return;
    }

    this.salvandoPdi = true;
    this.pdiService.criarMeta(this.pdiAtivoAluno.id, this.pdiMetaForm)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.salvandoPdi = false;
          this.toast.sucesso('Meta adicionada ao PDI.');
          this.fecharModalMetaPdi();
          this.carregarPdisDoAluno(this.alunoSelecionado!.id);
        },
        error: (err) => {
          this.salvandoPdi = false;
          this.erroPdi = err?.error?.message || 'Nao foi possivel adicionar a meta.';
          this.toast.erro(this.erroPdi);
          this.cdr.markForCheck();
        }
      });
  }

  atualizarStatusMetaPdi(meta: PdiMeta, status: StatusMetaPdi): void {
    if (!this.alunoSelecionado || !this.pdiAtivoAluno) return;
    this.pdiService.atualizarMeta(this.pdiAtivoAluno.id, meta.id, { status })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.sucesso('Status da meta atualizado.');
          this.carregarPdisDoAluno(this.alunoSelecionado!.id);
        },
        error: (err) => this.toast.erro(err?.error?.message || 'Nao foi possivel atualizar a meta.')
      });
  }

  abrirModalEvolucaoPdi(): void {
    if (!this.pdiAtivoAluno) return;
    this.erroPdi = '';
    this.pdiEvolucaoForm = this.criarPdiEvolucaoFormPadrao();
    this.modalPdiEvolucaoAberto = true;
  }

  fecharModalEvolucaoPdi(): void {
    this.modalPdiEvolucaoAberto = false;
    this.pdiEvolucaoForm = this.criarPdiEvolucaoFormPadrao();
    this.erroPdi = '';
  }

  salvarEvolucaoPdi(): void {
    if (!this.alunoSelecionado || !this.pdiAtivoAluno || this.salvandoPdi) return;
    if (!this.pdiEvolucaoForm.descricao.trim()) {
      this.erroPdi = 'Informe a descricao da evolucao.';
      return;
    }

    this.salvandoPdi = true;
    this.pdiService.criarEvolucao(this.pdiAtivoAluno.id, this.pdiEvolucaoForm)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.salvandoPdi = false;
          this.toast.sucesso('Evolucao registrada no PDI.');
          this.fecharModalEvolucaoPdi();
          this.carregarPdisDoAluno(this.alunoSelecionado!.id);
        },
        error: (err) => {
          this.salvandoPdi = false;
          this.erroPdi = err?.error?.message || 'Nao foi possivel registrar a evolucao.';
          this.toast.erro(this.erroPdi);
          this.cdr.markForCheck();
        }
      });
  }

  concluirPdi(): void {
    if (!this.alunoSelecionado || !this.pdiAtivoAluno || this.salvandoPdi) return;
    this.salvandoPdi = true;
    this.pdiService.atualizar(this.pdiAtivoAluno.id, {
      status: 'CONCLUIDO',
      dataConclusao: this.hojeIso(),
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.salvandoPdi = false;
        this.toast.sucesso('PDI concluido com sucesso.');
        this.carregarPdisDoAluno(this.alunoSelecionado!.id);
      },
      error: (err) => {
        this.salvandoPdi = false;
        this.toast.erro(err?.error?.message || 'Nao foi possivel concluir o PDI.');
        this.cdr.markForCheck();
      }
    });
  }

  statusPdiLabel(status?: StatusPdi | string | null): string {
    const labels: Record<StatusPdi, string> = {
      ATIVO: 'Ativo',
      CONCLUIDO: 'Concluido',
      SUSPENSO: 'Suspenso',
      ARQUIVADO: 'Arquivado',
    };
    return status ? (labels[status as StatusPdi] ?? status) : '-';
  }

  areaPdiLabel(area?: AreaPdi | string | null): string {
    return this.areasPdiOptions.find((item) => item.value === area)?.label ?? area ?? '-';
  }

  statusMetaPdiLabel(status?: StatusMetaPdi | string | null): string {
    return this.statusMetaPdiOptions.find((item) => item.value === status)?.label ?? status ?? '-';
  }

  private criarPdiFormPadrao(): PdiForm {
    return {
      titulo: '',
      objetivoGeral: '',
      diagnosticoInicial: '',
      necessidadesAcessibilidade: '',
      recursosUtilizados: '',
      observacoesGerais: '',
      dataInicio: this.hojeIso(),
      dataFimPrevista: '',
    };
  }

  private criarPdiMetaFormPadrao(): PdiMetaForm {
    return {
      area: 'BRAILLE',
      descricao: '',
      estrategia: '',
      prazo: '',
    };
  }

  private criarPdiEvolucaoFormPadrao(): PdiEvolucaoForm {
    return {
      descricao: '',
      dificuldades: '',
      avancos: '',
      proximosPassos: '',
    };
  }

  private hojeIso(): string {
    return new Date().toISOString().slice(0, 10);
  }

  fecharModal(): void {
    this.gerenciandoAtestados = false;
    this.modalAtestadoAberto = false;
    this.gerenciandoLaudos = false;
    this.modalLaudoAberto = false;
    this.modalLgpdAberto = false;
    this.modalPdiFormAberto = false;
    this.modalPdiMetaAberto = false;
    this.modalPdiEvolucaoAberto = false;
    this.statusAtestados = '';
    this.statusLaudos = '';
    this.statusLgpd = '';
    this.erroPdi = '';
    this.modalAberto = false;
    this.alunoSelecionado = null;
    this.pdisAluno = [];
    this.pdiAtivoAluno = null;
    this.popFocus();
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

    if (file.size > 10 * 1024 * 1024) {
      this.toast.aviso('O arquivo selecionado excede o limite de 10MB permitido. Escolha um arquivo menor.');
      this.liveAnnouncer.announce('Erro: O arquivo selecionado excede o limite de 10 megabytes.', 'assertive');
      event.target.value = '';
      return;
    }

    this.uploadingImage = true;
    this.liveAnnouncer.announce('Iniciando o envio do documento. Por favor, aguarde.', 'assertive');
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
              // Faz merge para preservar relações (matriculasOficina) que o PATCH não retorna
              // e chama markForCheck() pois o componente usa ChangeDetectionStrategy.OnPush
              this.alunoSelecionado = { ...this.alunoSelecionado!, ...alunoAtualizado };
              this.uploadingImage = false;
              this.liveAnnouncer.announce('Documento salvo e atualizado com sucesso!', 'assertive');
              this.toast.sucesso('Documento salvo com sucesso!');
              this.cdr.markForCheck();
              this.carregar();
            }, 0);
          },
          error: () => {
            setTimeout(() => {
              this.uploadingImage = false;
              this.liveAnnouncer.announce('Falha ao processar e salvar o documento.', 'assertive');
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
    this.pushFocus();
    if (!this.alunoSelecionado) return;
    const urlAtual = this.alunoSelecionado[tipo];
    if (!urlAtual) return;

    this.documentoParaExcluir = { tipo, url: urlAtual };
  }

  cancelarExclusaoDocumento(): void {
    this.popFocus();
    this.documentoParaExcluir = null;
  }

  confirmarExclusaoDocumento(): void {
    if (!this.alunoSelecionado || !this.documentoParaExcluir) return;

    this.deletandoImage = true;
    this.cdr.detectChanges();

    const { tipo, url } = this.documentoParaExcluir;

    this.beneficiariosService.excluirArquivo(url).subscribe({
      next: () => {
        // Envia null (não '' string vazia) — o DTO tem @IsUrl() que rejeita '' com 400
        // @IsOptional() aceita null e o backend interpreta como "limpar o campo"
        const updatePayload = { [tipo]: null } as unknown as Partial<Beneficiario>;

        this.beneficiariosService.atualizar(this.alunoSelecionado!.id, updatePayload).subscribe({
          next: () => {
            setTimeout(() => {
              if (this.alunoSelecionado) {
                // Limpa o campo localmente e força re-render (OnPush precisa de markForCheck)
                (this.alunoSelecionado as any)[tipo] = null;
              }
              this.deletandoImage = false;
              this.documentoParaExcluir = null;
              this.toast.sucesso('Documento excluído com sucesso!');
              this.cdr.markForCheck();
              this.carregar();
            }, 0);
          },
          error: () => {
            setTimeout(() => {
              this.deletandoImage = false;
              this.popFocus();
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
    this.pushFocus();
    if (!urlDocumento) return;
    this.urlPdfParaVisualizar = urlDocumento;
    this.mostrarVisualizadorPdf = true;
    this.cdr.detectChanges();
  }

  fecharVisualizadorPdf(): void {
    this.popFocus();
    if (this.urlPdfParaVisualizar && this.urlPdfParaVisualizar.startsWith('blob:')) {
      window.URL.revokeObjectURL(this.urlPdfParaVisualizar);
    }
    this.mostrarVisualizadorPdf = false;
    this.urlPdfParaVisualizar = null;
    this.cdr.detectChanges();
  }

  // ── Emissão de Certificados ─────────────────────────────────────────

  certificadoAcademicoPorTurma(turmaId: string): NonNullable<Beneficiario['certificadosEmitidos']>[number] | null {
    return this.alunoSelecionado?.certificadosEmitidos?.find((cert) =>
      cert.status === 'VALID' &&
      !!cert.pdfUrl &&
      (cert.turmaId === turmaId || cert.turma?.id === turmaId)
    ) ?? null;
  }

  visualizarCertificadoAcademico(turmaId: string): void {
    const certificado = this.certificadoAcademicoPorTurma(turmaId);
    if (certificado?.pdfUrl) {
      this.abrirVisualizadorPdf(certificado.pdfUrl);
    }
  }

  emitirCertificadoAcademico(matricula: { id: string; turma: { id: string } }): void {
    if (this.emitindoCertificadoId === matricula.id) return;
    this.emitindoCertificadoId = matricula.id;
    this.cdr.detectChanges();

    const alunoId = this.alunoSelecionado!.id;
    this.modelosCertificadosService.emitirAcademico(matricula.turma.id, alunoId).subscribe({
      next: (res: { pdfUrl: string; codigoValidacao: string }) => {
        // Usa URL do Cloudinary diretamente — sem criar blob local, sem download duplo
        this.urlPdfParaVisualizar = res.pdfUrl;
        this.mostrarVisualizadorPdf = true;
        this.emitindoCertificadoId = null;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.toast.erro(err?.error?.message ?? 'Erro ao emitir certificado acadêmico.');
        this.emitindoCertificadoId = null;
        this.cdr.detectChanges();
      }
    });
  }

  // ── Modal de Imagem (laudo fotográfico) ──────────────────────────────
  abrirModalImagem(url: string): void {
    this.pushFocus();
    this.urlImagemParaVisualizar = url;
    this.mostrarModalImagem = true;
    this.cdr.detectChanges();
  }

  fecharModalImagem(): void {
    this.popFocus();
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

  // ── Módulo Atestados (Modal e CRUD) ──────────────────────────────
  abrirModalGerenciamentoAtestados(): void {
    this.pushFocus();
    if (!this.alunoSelecionado) return;
    this.gerenciandoAtestados = true;
    this.statusAtestados = 'Janela de gerenciamento de atestados aberta.';
    this.carregarAtestados();
    this.liveAnnouncer.announce('Gerenciamento de atestados aberto. Pressione Tab para navegar e Escape para voltar ao perfil.', 'polite');
    this.cdr.detectChanges();
  }

  fecharModalGerenciamentoAtestados(event?: Event): void {
    if (event && (event.target as HTMLElement).classList.contains('modal-content')) return;
    if (this.modalAtestadoAberto) {
      this.limparFormularioAtestado(false);
    }
    this.gerenciandoAtestados = false;
    this.statusAtestados = '';
    this.popFocus();
    this.cdr.detectChanges();
  }

  abrirModalAtestadoForm(atestado?: Atestado): void {
    this.pushFocus();
    this.modalAtestadoAberto = true;
    this.atestadoEmEdicao = atestado || null;
    if (atestado) {
      this.novoAtestado = {
        dataInicio: atestado.dataInicio ? atestado.dataInicio.split('T')[0] : '',
        dataFim: atestado.dataFim ? atestado.dataFim.split('T')[0] : '',
        motivo: atestado.motivo,
        arquivoUrl: atestado.arquivoUrl
      };
    } else {
      this.novoAtestado = { dataInicio: '', dataFim: '', motivo: '', arquivoUrl: undefined };
    }
    this.atestadoPreview = null;
    this.erroAtestado = '';
    this.anunciarStatusModal('atestados', atestado ? 'Formulário de edição de atestado aberto.' : 'Formulário de novo atestado aberto.');
    this.cdr.detectChanges();
  }

  fecharModalAtestadoForm(): void {
    this.limparFormularioAtestado(true);
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

    if (file.size > 10 * 1024 * 1024) {
      this.toast.aviso('O arquivo selecionado excede o limite de 10MB permitido. Escolha um arquivo menor.');
      this.liveAnnouncer.announce('Erro: O arquivo selecionado excede o limite de 10 megabytes.', 'assertive');
      (event.target as HTMLInputElement).value = '';
      return;
    }

    this.uploadingAtestado = true;
    this.anunciarStatusModal('atestados', `Enviando arquivo ${file.name}. Aguarde.`);
    this.cdr.detectChanges();

    const ehPdf = file.type === 'application/pdf';
    const upload$ = ehPdf ? this.beneficiariosService.uploadPdf(file, 'atestado') : this.beneficiariosService.uploadImagem(file);

    upload$.subscribe({
      next: (res: any) => {
        this.novoAtestado.arquivoUrl = res.url ?? res.secure_url ?? res;
        this.uploadingAtestado = false;
        this.anunciarStatusModal('atestados', `Arquivo ${file.name} anexado ao atestado com sucesso.`);
        this.cdr.detectChanges();
      },
      error: () => {
        this.erroAtestado = 'Erro ao enviar arquivo. Tente novamente.';
        this.uploadingAtestado = false;
        this.anunciarStatusModal('atestados', this.erroAtestado, 'assertive');
        this.cdr.detectChanges();
      }
    });
  }

  salvarAtestado(): void {
    if (!this.alunoSelecionado || this.salvandoAtestado) return;
    const dto = this.novoAtestado;

    // Se não estiver em edição, exige campos de data. (Em edição alteramos só o motivo e arquivo)
    if (!this.atestadoEmEdicao && (!dto.dataInicio || !dto.dataFim || !dto.motivo)) {
      this.erroAtestado = 'Preencha Data Início, Data Fim e Motivo.';
      return;
    }
    if (this.atestadoEmEdicao && !dto.motivo) {
      this.erroAtestado = 'Preencha o Motivo do atestado.';
      return;
    }

    this.salvandoAtestado = true;
    this.erroAtestado = '';
    this.anunciarStatusModal('atestados', 'Salvando atestado. Aguarde.');

    if (this.atestadoEmEdicao) {
      // Editar
      const editDto: any = { motivo: dto.motivo, arquivoUrl: dto.arquivoUrl };
      this.atestadosService.atualizar(this.atestadoEmEdicao.id, editDto).subscribe({
        next: () => {
          this.salvandoAtestado = false;
          this.fecharModalAtestadoForm();
          this.toast.sucesso('Atestado editado com sucesso.');
          this.carregarAtestados();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.salvandoAtestado = false;
          this.erroAtestado = err?.error?.message ?? 'Erro ao atualizar atestado.';
          this.anunciarStatusModal('atestados', this.erroAtestado, 'assertive');
          this.cdr.detectChanges();
        }
      });
    } else {
      // Criar
      this.atestadosService.criar(this.alunoSelecionado.id, dto).subscribe({
        next: (res) => {
          this.salvandoAtestado = false;
          this.fecharModalAtestadoForm();
          this.toast.sucesso(`Atestado salvo! ${res.faltasJustificadas} falta(s) justificada(s).`);
          this.carregarAtestados();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.salvandoAtestado = false;
          this.erroAtestado = err?.error?.message ?? 'Erro ao salvar atestado.';
          this.anunciarStatusModal('atestados', this.erroAtestado, 'assertive');
          this.cdr.detectChanges();
        }
      });
    }
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
    this.statusAtestados = 'Buscando histórico de atestados.';
    this.atestadosService.listar(this.alunoSelecionado.id).subscribe({
      next: (lista: Atestado[]) => {
        this.atestadosDoAluno = lista;
        this.carregandoAtestados = false;
        this.statusAtestados = `${lista.length} atestado(s) carregado(s).`;
        this.cdr.detectChanges();
      },
      error: () => {
        this.carregandoAtestados = false;
        this.statusAtestados = 'Não foi possível carregar o histórico de atestados.';
        this.cdr.detectChanges();
      }
    });
  }

  // ── Módulo Laudos Médicos (Modal e CRUD) ──────────────────────────────
  abrirModalGerenciamentoLaudos(): void {
    this.pushFocus();
    if (!this.alunoSelecionado) return;
    this.gerenciandoLaudos = true;
    this.statusLaudos = 'Janela de histórico de laudos médicos aberta.';
    this.carregarLaudos();
    this.liveAnnouncer.announce('Histórico de laudos médicos aberto. Pressione Tab para navegar e Escape para voltar ao perfil.', 'polite');
    this.cdr.detectChanges();
  }

  fecharModalGerenciamentoLaudos(event?: Event): void {
    if (event && (event.target as HTMLElement).classList.contains('modal-content')) return;
    if (this.modalLaudoAberto) {
      this.limparFormularioLaudo(false);
    }
    this.gerenciandoLaudos = false;
    this.statusLaudos = '';
    this.popFocus();
    this.cdr.detectChanges();
  }

  abrirModalLaudoForm(laudo?: LaudoMedico): void {
    this.pushFocus();
    this.modalLaudoAberto = true;
    this.laudoEmEdicao = laudo || null;
    if (laudo) {
      this.novoLaudo = {
        dataEmissao: laudo.dataEmissao ? laudo.dataEmissao.split('T')[0] : '',
        medicoResponsavel: laudo.medicoResponsavel || '',
        descricao: laudo.descricao || '',
        arquivoUrl: laudo.arquivoUrl || ''
      };
    } else {
      this.novoLaudo = { dataEmissao: '', medicoResponsavel: '', descricao: '', arquivoUrl: '' };
    }
    this.erroLaudo = '';
    this.anunciarStatusModal('laudos', laudo ? 'Formulário de edição de laudo aberto.' : 'Formulário de novo laudo aberto.');
    this.cdr.detectChanges();
  }

  fecharModalLaudoForm(): void {
    this.limparFormularioLaudo(true);
    this.cdr.detectChanges();
  }

  uploadArquivoLaudo(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      this.toast.aviso('O arquivo selecionado excede o limite de 10MB permitido. Escolha um arquivo menor.');
      this.liveAnnouncer.announce('Erro: O arquivo selecionado excede o limite de 10 megabytes.', 'assertive');
      (event.target as HTMLInputElement).value = '';
      return;
    }

    this.uploadingLaudo = true;
    this.anunciarStatusModal('laudos', `Enviando arquivo ${file.name}. Aguarde.`);
    this.cdr.detectChanges();

    const ehPdf = file.type === 'application/pdf';
    const upload$ = ehPdf ? this.beneficiariosService.uploadPdf(file, 'laudo') : this.beneficiariosService.uploadImagem(file);

    upload$.subscribe({
      next: (res: any) => {
        this.novoLaudo.arquivoUrl = res.url ?? res.secure_url ?? res;
        this.uploadingLaudo = false;
        this.anunciarStatusModal('laudos', `Arquivo ${file.name} anexado ao laudo com sucesso.`);
        this.cdr.detectChanges();
      },
      error: () => {
        this.erroLaudo = 'Erro ao enviar arquivo. Tente novamente.';
        this.uploadingLaudo = false;
        this.anunciarStatusModal('laudos', this.erroLaudo, 'assertive');
        this.cdr.detectChanges();
      }
    });
  }

  salvarLaudo(): void {
    if (!this.alunoSelecionado || this.salvandoLaudo) return;
    const dto = this.novoLaudo;
    if (!dto.dataEmissao || !dto.arquivoUrl) {
      this.erroLaudo = 'Preencha a Data de Emissão e anexe o documento.';
      return;
    }
    this.salvandoLaudo = true;
    this.erroLaudo = '';
    this.anunciarStatusModal('laudos', 'Salvando laudo médico. Aguarde.');

    if (this.laudoEmEdicao) {
      // Editar
      const editDto: any = {
        dataEmissao: dto.dataEmissao,
        medicoResponsavel: dto.medicoResponsavel,
        descricao: dto.descricao,
        arquivoUrl: dto.arquivoUrl
      };
      this.laudosService.atualizar(this.laudoEmEdicao.id, editDto).subscribe({
        next: () => {
          this.salvandoLaudo = false;
          this.fecharModalLaudoForm();
          this.toast.sucesso('Laudo médico atualizado com sucesso!');
          this.carregarLaudos();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.salvandoLaudo = false;
          this.erroLaudo = err?.error?.message ?? 'Erro ao atualizar laudo.';
          this.anunciarStatusModal('laudos', this.erroLaudo, 'assertive');
          this.cdr.detectChanges();
        }
      });
    } else {
      // Criar
      this.laudosService.criar(this.alunoSelecionado.id, dto).subscribe({
        next: () => {
          this.salvandoLaudo = false;
          this.fecharModalLaudoForm();
          this.toast.sucesso('Laudo médico salvo com sucesso!');
          this.carregarLaudos();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.salvandoLaudo = false;
          this.erroLaudo = err?.error?.message ?? 'Erro ao salvar laudo.';
          this.anunciarStatusModal('laudos', this.erroLaudo, 'assertive');
          this.cdr.detectChanges();
        }
      });
    }
  }

  removerLaudo(id: string): void {
    this.confirmDialog.confirmar({
      titulo: 'Remover Laudo Médico',
      mensagem: 'Tem certeza que deseja excluir este laudo? Esta ação não pode ser desfeita.',
      textoBotaoConfirmar: 'Remover',
      tipo: 'danger'
    }).then((confirmado: boolean) => {
      if (!confirmado) return;
      this.laudosService.remover(id).subscribe({
        next: () => {
          this.toast.sucesso('Laudo médico removido.');
          this.carregarLaudos();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.toast.erro(err?.error?.message ?? 'Erro ao remover laudo.');
        }
      });
    });
  }

  carregarLaudos(): void {
    if (!this.alunoSelecionado) return;
    this.carregandoLaudos = true;
    this.statusLaudos = 'Buscando histórico de laudos médicos.';
    this.laudosService.listarPorAluno(this.alunoSelecionado.id).subscribe({
      next: (lista: LaudoMedico[]) => {
        this.laudosDoAluno = lista;
        this.carregandoLaudos = false;
        this.statusLaudos = `${lista.length} laudo(s) carregado(s).`;
        this.cdr.detectChanges();
      },
      error: () => {
        this.carregandoLaudos = false;
        this.statusLaudos = 'Não foi possível carregar o histórico de laudos médicos.';
        this.cdr.detectChanges();
      }
    });
  }

  // ============== TERMO LGPD ==============

  abrirModalLgpd(): void {
    this.pushFocus();
    this.modalLgpdAberto = true;
    this.novoLgpdUrl = '';
    this.erroLgpd = '';
    this.statusLgpd = 'Janela de termo LGPD aberta.';
    this.liveAnnouncer.announce('Janela de termo LGPD aberta. Pressione Tab para navegar e Escape para voltar ao perfil.', 'polite');
    this.cdr.detectChanges();
  }

  fecharModalLgpd(): void {
    this.popFocus();
    this.modalLgpdAberto = false;
    this.novoLgpdUrl = '';
    this.erroLgpd = '';
    this.statusLgpd = '';
    this.cdr.detectChanges();
  }

  uploadArquivoLgpd(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      this.toast.aviso('O arquivo selecionado excede o limite de 10MB permitido. Escolha um arquivo menor.');
      this.liveAnnouncer.announce('Erro: O arquivo selecionado excede o limite de 10 megabytes.', 'assertive');
      (event.target as HTMLInputElement).value = '';
      return;
    }

    this.uploadingLgpd = true;
    this.anunciarStatusModal('lgpd', `Enviando arquivo ${file.name}. Aguarde.`);
    this.cdr.detectChanges();

    const ehPdf = file.type === 'application/pdf';
    const upload$ = ehPdf ? this.beneficiariosService.uploadPdf(file, 'lgpd') : this.beneficiariosService.uploadImagem(file);

    upload$.subscribe({
      next: (res: any) => {
        this.novoLgpdUrl = res.url ?? res.secure_url ?? res;
        this.uploadingLgpd = false;
        this.anunciarStatusModal('lgpd', `Arquivo ${file.name} pronto para salvar no termo LGPD.`);
        this.cdr.detectChanges();
      },
      error: () => {
        this.erroLgpd = 'Erro ao enviar arquivo. Tente novamente.';
        this.uploadingLgpd = false;
        this.anunciarStatusModal('lgpd', this.erroLgpd, 'assertive');
        this.cdr.detectChanges();
      }
    });
  }

  salvarLgpd(): void {
    if (!this.alunoSelecionado || this.salvandoLgpd) return;
    if (!this.novoLgpdUrl) {
      this.erroLgpd = 'Você precisa anexar um arquivo.';
      return;
    }
    
    this.salvandoLgpd = true;
    this.erroLgpd = '';
    this.anunciarStatusModal('lgpd', 'Salvando termo LGPD. Aguarde.');
    const dadosAtualizar = { termoLgpdUrl: this.novoLgpdUrl };

    this.beneficiariosService.atualizar(this.alunoSelecionado.id, dadosAtualizar).subscribe({
      next: (alunoAtualizado) => {
        this.salvandoLgpd = false;
        this.alunoSelecionado!.termoLgpdUrl = alunoAtualizado.termoLgpdUrl;
        
        // Atualiza a lista da tabela base:
        const index = this.alunos.findIndex((b: Beneficiario) => b.id === this.alunoSelecionado!.id);
        if (index > -1) {
          this.alunos[index].termoLgpdUrl = alunoAtualizado.termoLgpdUrl;
        }

        this.fecharModalLgpd();
        this.toast.sucesso('Termo LGPD salvo com sucesso!');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.salvandoLgpd = false;
        this.erroLgpd = err?.error?.message ?? 'Erro ao salvar o termo LGPD.';
        this.anunciarStatusModal('lgpd', this.erroLgpd, 'assertive');
        this.cdr.detectChanges();
      }
    });
  }

}

