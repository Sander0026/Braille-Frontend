import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Apoiador, ApoiadoresService } from '../apoiadores.service';
import { ModelosCertificadosService, ModeloCertificado } from '../../../../core/services/modelos-certificados.service';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { A11yModule } from '@angular/cdk/a11y';
import { BaseFormDescarte } from '../../../../shared/classes/base-form-descarte';

@Component({
  selector: 'app-apoiadores-lista',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, A11yModule],
  templateUrl: './apoiadores-lista.html',
  styleUrls: ['./apoiadores-lista.scss']
})
export class ApoiadoresLista extends BaseFormDescarte implements OnInit, OnDestroy {
  apoiadores: Apoiador[] = [];
  carregando = true;
  totalApoiadores = 0;
  
  // Filtros
  searchControl = new FormControl('');
  tipoControl = new FormControl('');
  private readonly destroy$ = new Subject<void>();

  // Modal de Perfil
  modalAberto = false;
  carregandoDetalhes = false;
  apoiadorVisualizado: Apoiador | null = null;

  // Modal de Formulário (Novo/Editar)
  modalFormAberto = false;
  modoEdicao = false;
  idApoiadorEditando: string | null = null;
  apoiadorForm: FormGroup;
  logoFile: File | null = null;
  logoPreview: string | ArrayBuffer | null = null;
  salvando = false;

  // Form Rápido do Perfil Visualizado
  novaAcaoForm: FormGroup;
  salvandoAcao = false;

  // Gerenciamento de Certificados (Honraria)
  modelosHonraria: ModeloCertificado[] = [];
  modalEmissaoAberto = false;
  emitindoCertificado = false;
  apoiadorParaEmissao: Apoiador | null = null;
  formEmissao: FormGroup;
  urlPdfParaVisualizar: SafeResourceUrl | null = null;
  mostrarVisualizadorPdf = false;
  
  // Wizard Steps
  passoAtual = 1;

  constructor(
    private readonly router: Router,
    private readonly apoiadoresService: ApoiadoresService,
    private readonly modelosCertificadosService: ModelosCertificadosService,
    private readonly sanitizer: DomSanitizer,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef
  ) {
    super();
    this.apoiadorForm = this.fb.group({
      informacoesPrincipais: this.fb.group({
        tipo: ['EMPRESA', Validators.required],
        nomeRazaoSocial: ['', Validators.required],
        nomeFantasia: [''],
        cpfCnpj: ['']
      }),
      contatoEndereco: this.fb.group({
        email: ['', [Validators.email, Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$')]],
        telefone: [''],
        contatoPessoa: [''],
        atividadeEspecialidade: [''],
        endereco: ['']
      }),
      visualVisibilidade: this.fb.group({
        exibirNoSite: [false]
      }),
      gerenciamento: this.fb.group({
        observacoes: ['']
      }),
      ativo: [true],
      acoes: this.fb.array([])
    });

    this.novaAcaoForm = this.fb.group({
      dataEvento: ['', Validators.required],
      descricaoAcao: ['', Validators.required]
    });

    this.formEmissao = this.fb.group({
      modeloId: ['', Validators.required],
      motivoPersonalizado: [''],
      dataEmissao: [this.hojeISO(), Validators.required]
    });
  }

  ngOnInit(): void {
    this.carregarApoiadores();
    this.configurarFiltros();
    this.carregarModelosHonraria();
  }

  carregarModelosHonraria(): void {
    this.modelosCertificadosService.listar().subscribe((modelos: ModeloCertificado[]) => {
      this.modelosHonraria = modelos.filter((m: ModeloCertificado) => m.tipo === 'HONRARIA');
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private configurarFiltros(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.carregarApoiadores());

    this.tipoControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.carregarApoiadores());
  }

  carregarApoiadores(): void {
    this.carregando = true;
    const search = this.searchControl.value || undefined;
    const tipo = this.tipoControl.value || undefined;

    this.apoiadoresService.listar(0, 50, tipo, search).subscribe({
      next: (res) => {
        this.apoiadores = res.data;
        this.totalApoiadores = res.total;
        this.carregando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao buscar apoiadores', err);
        this.carregando = false;
        this.cdr.detectChanges();
      }
    });
  }

  novoApoiador() {
    this.fecharModal();
    this.fecharModalForm();
    this.modoEdicao = false;
    this.idApoiadorEditando = null;
    this.logoFile = null;
    this.logoPreview = null;
    this.passoAtual = 1;
    this.apoiadorForm.reset({
      informacoesPrincipais: { tipo: 'EMPRESA' },
      visualVisibilidade: { exibirNoSite: false },
      ativo: true
    });
    this.acoesFormArray.clear();
    this.modalFormAberto = true;
  }

  editarApoiador(id: string) {
    this.fecharModal(); // Fecha view se aberto
    this.modoEdicao = true;
    this.idApoiadorEditando = id;
    this.logoFile = null;
    this.logoPreview = null;
    this.passoAtual = 1;
    this.modalFormAberto = true;
    this.apoiadorForm.reset();
    this.acoesFormArray.clear();
    
    this.apoiadoresService.obterPorId(id).subscribe({
      next: (res) => {
        this.apoiadorForm.patchValue({
          informacoesPrincipais: {
            tipo: res.tipo,
            nomeRazaoSocial: res.nomeRazaoSocial,
            nomeFantasia: res.nomeFantasia,
            cpfCnpj: res.cpfCnpj
          },
          contatoEndereco: {
            email: res.email,
            telefone: res.telefone,
            contatoPessoa: res.contatoPessoa,
            atividadeEspecialidade: res.atividadeEspecialidade,
            endereco: res.endereco
          },
          visualVisibilidade: {
            exibirNoSite: res.exibirNoSite
          },
          gerenciamento: {
            observacoes: res.observacoes
          },
          ativo: res.ativo
        });
        if (res.logoUrl) {
            this.logoPreview = res.logoUrl;
        }

        // Apply Masks
        if (res.cpfCnpj) this.formatarCpfCnpj({ target: { value: res.cpfCnpj } });
        if (res.telefone) this.formatarTelefone({ target: { value: res.telefone } });

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao buscar perfil para edição', err);
        this.cdr.detectChanges();
      }
    });
  }

  // --- MÁSCARAS ---
  formatarCpfCnpj(event: any): void {
    let valor = event.target.value.replace(/\D/g, '');
    if (valor.length <= 11) {
      // CPF
      valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
      valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
      valor = valor.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      // CNPJ (max 14 digitos numéricos)
      valor = valor.substring(0, 14);
      valor = valor.replace(/^(\d{2})(\d)/, '$1.$2');
      valor = valor.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
      valor = valor.replace(/\.(\d{3})(\d)/, '.$1/$2');
      valor = valor.replace(/(\d{4})(\d)/, '$1-$2');
    }
    event.target.value = valor;
    this.apoiadorForm.get('informacoesPrincipais.cpfCnpj')?.setValue(valor, { emitEvent: false });
  }

  formatarEmail(event: any): void {
    let v = event.target.value.replace(/\s/g, '').toLowerCase();
    event.target.value = v;
    this.apoiadorForm.get('contatoEndereco.email')?.setValue(v);
  }

  formatarTelefone(event: any): void {
    let valor = event.target.value.replace(/\D/g, '');
    valor = valor.substring(0, 11);
    
    if (valor.length > 10) {
      valor = valor.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
    } else if (valor.length > 6) {
      valor = valor.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
    } else if (valor.length > 2) {
      valor = valor.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
    } else if (valor.length > 0) {
      valor = valor.replace(/^(\d{0,2})/, '($1');
    }

    event.target.value = valor;
    this.apoiadorForm.get('contatoEndereco.telefone')?.setValue(valor, { emitEvent: false });
  }

  // --- CONTROLES DE ARRAY DE AÇÕES NO FORMULÁRIO GERAL ---
  get acoesFormArray() {
    return this.apoiadorForm.get('acoes') as FormArray;
  }

  addAcaoField(dataEvento = '', descricaoAcao = '') {
    this.acoesFormArray.push(this.fb.group({
      dataEvento: [dataEvento, Validators.required],
      descricaoAcao: [descricaoAcao, Validators.required]
    }));
  }

  removeAcaoField(index: number) {
    this.acoesFormArray.removeAt(index);
  }

  verPerfil(id: string) {
    this.modalAberto = true;
    this.carregandoDetalhes = true;
    this.apoiadorVisualizado = null;
    
    this.apoiadoresService.obterPorId(id).subscribe({
      next: (res) => {
        this.apoiadorVisualizado = res;
        this.carregandoDetalhes = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao buscar perfil', err);
        this.carregandoDetalhes = false;
        this.cdr.detectChanges();
      }
    });
  }

  fecharModal() {
    this.modalAberto = false;
    this.apoiadorVisualizado = null;
    this.novaAcaoForm.reset();
  }

  // Lógica do Modal de Histórico Pessoal (Rápido)
  adicionarAcaoPerfil(event: Event) {
    event.preventDefault();
    if (this.novaAcaoForm.invalid || !this.apoiadorVisualizado) {
      this.novaAcaoForm.markAllAsTouched();
      return;
    }
    this.salvandoAcao = true;
    const val = this.novaAcaoForm.value;
    
    this.apoiadoresService.adicionarAcao(this.apoiadorVisualizado.id, val.dataEvento, val.descricaoAcao).subscribe({
      next: (novaAcao) => {
        this.salvandoAcao = false;
        // Atualiza a view em tempo real
        if (!this.apoiadorVisualizado!.acoes) {
          this.apoiadorVisualizado!.acoes = [];
        }
        this.apoiadorVisualizado!.acoes.unshift(novaAcao);
        this.novaAcaoForm.reset();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao adicionar ação avulsa', err);
        alert('Falha ao adicionar histórico.');
        this.salvandoAcao = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Lógica do Form / Descarte Guard
  isFormDirty(): boolean {
    return this.modalFormAberto && this.apoiadorForm.dirty && !this.salvando;
  }

  async fecharFormSeguro() {
    if (await this.podeDescartar()) {
      this.fecharModalForm();
    }
  }

  fecharModalForm() {
    this.modalFormAberto = false;
    this.apoiadorForm.reset();
  }

  getGroupName(passo: number): string {
    switch (passo) {
      case 1: return 'informacoesPrincipais';
      case 2: return 'contatoEndereco';
      case 3: return 'visualVisibilidade';
      case 4: return 'gerenciamento';
      default: return 'informacoesPrincipais';
    }
  }

  avancarPasso() {
    const grupo = this.apoiadorForm.get(this.getGroupName(this.passoAtual));
    if (grupo && grupo.valid) {
      this.passoAtual++;
    } else {
      grupo?.markAllAsTouched();
    }
  }

  voltarPasso() {
    if (this.passoAtual > 1) {
      this.passoAtual--;
    }
  }

  isCampoInvalido(group: string, controlName: string): boolean {
    const control = this.apoiadorForm.get(`${group}.${controlName}`);
    return !!(control && control.invalid && control.touched);
  }

  onLogoSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.logoFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.logoPreview = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmitForm(): void {
    if (this.apoiadorForm.invalid) {
      this.apoiadorForm.markAllAsTouched();
      return;
    }

    this.salvando = true;
    const formData = this.apoiadorForm.value;
    
    // Preparando o Dto unificando os grupos
    const saveDto: Partial<Apoiador> = {
      tipo: formData.informacoesPrincipais.tipo,
      nomeRazaoSocial: formData.informacoesPrincipais.nomeRazaoSocial,
      nomeFantasia: formData.informacoesPrincipais.nomeFantasia || undefined,
      cpfCnpj: formData.informacoesPrincipais.cpfCnpj || undefined,
      contatoPessoa: formData.contatoEndereco.contatoPessoa || undefined,
      telefone: formData.contatoEndereco.telefone || undefined,
      email: formData.contatoEndereco.email || undefined,
      endereco: formData.contatoEndereco.endereco || undefined,
      atividadeEspecialidade: formData.contatoEndereco.atividadeEspecialidade || undefined,
      observacoes: formData.gerenciamento.observacoes || undefined,
      exibirNoSite: formData.visualVisibilidade.exibirNoSite,
      ativo: formData.ativo,
      acoes: (!this.modoEdicao && formData.acoes?.length) ? formData.acoes : undefined
    };

    const req$ = this.modoEdicao && this.idApoiadorEditando
      ? this.apoiadoresService.atualizar(this.idApoiadorEditando, saveDto)
      : this.apoiadoresService.criar(saveDto);

    req$.subscribe({
      next: (res) => {
        const id = this.modoEdicao && this.idApoiadorEditando ? this.idApoiadorEditando : (res as Apoiador).id;
        if (this.logoFile && id) {
          this.apoiadoresService.uploadLogo(id, this.logoFile).subscribe({
            next: () => this.sucessoForm(),
            error: (err) => {
              console.error('Erro no upload', err);
              this.sucessoForm();
            }
          });
        } else {
          this.sucessoForm();
        }
      },
      error: (err) => {
        console.error('Erro ao salvar apoiador', err);
        alert('Erro ao salvar no servidor. Verifique os dados e tente novamente.');
        this.salvando = false;
        this.cdr.detectChanges();
      }
    });
  }

  private sucessoForm(): void {
    this.salvando = false;
    this.cdr.detectChanges();
    this.fecharModalForm();
    this.carregarApoiadores(); // recarrega a lista
  }

  // ── Emissão de Honrarias (Certificados) ─────────────────────────────────────────

  abrirModalEmissao(apoiador: Apoiador): void {
    this.apoiadorParaEmissao = apoiador;
    this.modalEmissaoAberto = true;
    this.formEmissao.reset({
      modeloId: '',
      motivoPersonalizado: '',
      dataEmissao: this.hojeISO()
    });
    this.cdr.detectChanges();
  }

  fecharModalEmissao(): void {
    this.modalEmissaoAberto = false;
    this.apoiadorParaEmissao = null;
    this.cdr.detectChanges();
  }

  hojeISO(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  emitirHonraria(): void {
    if (this.formEmissao.invalid || !this.apoiadorParaEmissao) {
      this.formEmissao.markAllAsTouched();
      return;
    }

    this.emitindoCertificado = true;
    this.cdr.detectChanges();

    const payload = {
      apoiadorId: this.apoiadorParaEmissao.id,
      modeloId: this.formEmissao.value.modeloId,
      motivoPersonalizado: this.formEmissao.value.motivoPersonalizado,
      dataEmissao: this.formEmissao.value.dataEmissao
    };

    this.modelosCertificadosService.testarGeracaoGeometrica(payload).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        this.urlPdfParaVisualizar = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        this.mostrarVisualizadorPdf = true;
        this.emitindoCertificado = false;
        this.fecharModalEmissao();
      },
      error: (err: any) => {
        console.error('Erro ao emitir honraria', err);
        alert('Erro ao emitir documento.');
        this.emitindoCertificado = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── PDF Viewer ────────────────────────────────────────────────────────
  fecharVisualizadorPdf(): void {
    this.mostrarVisualizadorPdf = false;
    this.urlPdfParaVisualizar = null;
    this.cdr.detectChanges();
  }
}

