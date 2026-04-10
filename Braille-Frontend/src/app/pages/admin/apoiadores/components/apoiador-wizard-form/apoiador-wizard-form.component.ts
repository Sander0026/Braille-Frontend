import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Apoiador, ApoiadoresService } from '../../apoiadores.service';
import { MasksUtil } from '../../../../../shared/utils/masks.util';
import { A11yModule, LiveAnnouncer } from '@angular/cdk/a11y';

@Component({
  selector: 'app-apoiador-wizard-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, A11yModule],
  templateUrl: './apoiador-wizard-form.component.html',
  styleUrl: './apoiador-wizard-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ApoiadorWizardFormComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() modoEdicao = false;
  @Input() apoiadorIdEditando: string | null = null;
  // Pode opcionalmente injetar o Apoiador em edicao para preenchimento.
  @Input() apoiadorDetalhes: Apoiador | null = null;

  @Output() formClosed = new EventEmitter<void>();
  @Output() formSaved = new EventEmitter<void>();

  apoiadorForm!: FormGroup;
  passoAtual = 1;

  logoFile: File | null = null;
  logoPreview: string | ArrayBuffer | null = null;
  carregandoLogo = false;
  logoFeedback: string | null = null;
  logoFeedbackType: 'success' | 'error' = 'success';
  salvando = false;

  private readonly announcer = inject(LiveAnnouncer);

  constructor(
    private readonly fb: FormBuilder,
    private readonly apoiadoresService: ApoiadoresService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.construirFormulario();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      if (this.apoiadorForm) {
        this.resetarAssistente();
        if (this.modoEdicao && this.apoiadorDetalhes) {
          this.preencherFormularioEdicao(this.apoiadorDetalhes);
        }
      }
    }
  }

  private construirFormulario(): void {
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
        cep: [''],
        rua: [''],
        numero: [''],
        complemento: [''],
        bairro: [''],
        cidade: [''],
        uf: ['']
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
  }

  private resetarAssistente(): void {
    this.passoAtual = 1;
    this.logoFile = null;
    this.logoPreview = null;
    this.carregandoLogo = false;
    this.logoFeedback = null;
    this.salvando = false;
    this.apoiadorForm.reset({
      informacoesPrincipais: { tipo: 'EMPRESA' },
      visualVisibilidade: { exibirNoSite: false },
      ativo: true
    });
    this.acoesFormArray.clear();
  }

  private preencherFormularioEdicao(res: Apoiador): void {
    this.apoiadorForm.patchValue({
      informacoesPrincipais: {
        tipo: res.tipo,
        nomeRazaoSocial: res.nomeRazaoSocial,
        nomeFantasia: res.nomeFantasia,
        cpfCnpj: MasksUtil.formatarCpfCnpj(res.cpfCnpj || '')
      },
      contatoEndereco: {
        email: res.email,
        telefone: MasksUtil.formatarTelefone(res.telefone || ''),
        contatoPessoa: res.contatoPessoa,
        atividadeEspecialidade: res.atividadeEspecialidade,
        cep: MasksUtil.formatarCep(res.cep || ''),
        rua: res.rua,
        numero: res.numero,
        complemento: res.complemento,
        bairro: res.bairro,
        cidade: res.cidade,
        uf: res.uf
      },
      visualVisibilidade: { exibirNoSite: res.exibirNoSite },
      gerenciamento: { observacoes: res.observacoes },
      ativo: res.ativo
    });
    if (res.logoUrl) {
        this.logoPreview = res.logoUrl;
    }
  }

  // Máscaras Dinâmicas
  onMaskCpfCnpj(event: any): void {
    const limpo = MasksUtil.formatarCpfCnpj(event.target.value);
    event.target.value = limpo;
    this.apoiadorForm.get('informacoesPrincipais.cpfCnpj')?.setValue(limpo, { emitEvent: false });
  }

  onMaskEmail(event: any): void {
    const limpo = MasksUtil.limparEmail(event.target.value);
    event.target.value = limpo;
    this.apoiadorForm.get('contatoEndereco.email')?.setValue(limpo);
  }

  onMaskTelefone(event: any): void {
    const limpo = MasksUtil.formatarTelefone(event.target.value);
    event.target.value = limpo;
    this.apoiadorForm.get('contatoEndereco.telefone')?.setValue(limpo, { emitEvent: false });
  }

  onMaskCep(event: any): void {
    const limpo = MasksUtil.formatarCep(event.target.value);
    event.target.value = limpo;
    this.apoiadorForm.get('contatoEndereco.cep')?.setValue(limpo, { emitEvent: false });
    
    if (limpo.length === 9) {
      this.buscarCep(limpo.replace(/\D/g, ''));
    }
  }

  async buscarCep(cepUnformatted: string): Promise<void> {
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepUnformatted}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        this.apoiadorForm.patchValue({
          contatoEndereco: {
            rua: data.logradouro,
            bairro: data.bairro,
            cidade: data.localidade,
            uf: data.uf
          }
        });
        this.cdr.detectChanges();
      }
    } catch (e) {
      console.error('Erro ao buscar CEP', e);
    }
  }

  // Arrays Helper
  get acoesFormArray(): FormArray {
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

  // Navegação do Form
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
      this.announcer.announce(`Avançado para a etapa ${this.passoAtual} de 4`, 'polite');
    } else {
      grupo?.markAllAsTouched();
      this.announcer.announce('Por favor, preencha os campos obrigatórios corretamente antes de avançar.', 'assertive');
    }
  }

  voltarPasso() {
    if (this.passoAtual > 1) {
      this.passoAtual--;
      this.announcer.announce(`Retornado para a etapa ${this.passoAtual} de 4`, 'polite');
    }
  }

  isCampoInvalido(group: string, controlName: string): boolean {
    const control = this.apoiadorForm.get(`${group}.${controlName}`);
    return !!(control && control.invalid && control.touched);
  }

  onLogoSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.carregandoLogo = true;
      this.logoFeedback = null;
      this.cdr.detectChanges();

      this.logoFile = file;
      const reader = new FileReader();
      
      reader.onload = () => {
        setTimeout(() => {
          this.logoPreview = reader.result;
          this.carregandoLogo = false;
          this.logoFeedback = 'Foto atualizada!';
          this.logoFeedbackType = 'success';
          this.cdr.detectChanges();
        }, 800);
      };

      reader.onerror = () => {
        this.carregandoLogo = false;
        this.logoFeedback = 'Houve algum erro, tente novamente!';
        this.logoFeedbackType = 'error';
        this.cdr.detectChanges();
      };
      
      reader.readAsDataURL(file);
    }
  }

  // Submissão a API Isolada
  onSubmitForm(): void {
    if (this.apoiadorForm.invalid) {
      this.apoiadorForm.markAllAsTouched();
      this.announcer.announce('O formulário contém erros de validação. Revise antes de salvar.', 'assertive');
      return;
    }

    this.salvando = true;
    const formData = this.apoiadorForm.value;
    
    const saveDto: Partial<Apoiador> = {
      tipo: formData.informacoesPrincipais.tipo,
      nomeRazaoSocial: formData.informacoesPrincipais.nomeRazaoSocial,
      nomeFantasia: formData.informacoesPrincipais.nomeFantasia || undefined,
      cpfCnpj: formData.informacoesPrincipais.cpfCnpj || undefined,
      contatoPessoa: formData.contatoEndereco.contatoPessoa || undefined,
      telefone: formData.contatoEndereco.telefone || undefined,
      email: formData.contatoEndereco.email || undefined,
      cep: formData.contatoEndereco.cep ? formData.contatoEndereco.cep.replace(/\D/g, '') : undefined,
      rua: formData.contatoEndereco.rua || undefined,
      numero: formData.contatoEndereco.numero || undefined,
      complemento: formData.contatoEndereco.complemento || undefined,
      bairro: formData.contatoEndereco.bairro || undefined,
      cidade: formData.contatoEndereco.cidade || undefined,
      uf: formData.contatoEndereco.uf || undefined,
      atividadeEspecialidade: formData.contatoEndereco.atividadeEspecialidade || undefined,
      observacoes: formData.gerenciamento.observacoes || undefined,
      exibirNoSite: formData.visualVisibilidade.exibirNoSite,
      ativo: formData.ativo,
      acoes: (!this.modoEdicao && formData.acoes?.length) ? formData.acoes : undefined
    };

    const req$ = this.modoEdicao && this.apoiadorIdEditando
      ? this.apoiadoresService.atualizar(this.apoiadorIdEditando, saveDto)
      : this.apoiadoresService.criar(saveDto);

    req$.subscribe({
      next: (res) => {
        const id = this.modoEdicao && this.apoiadorIdEditando ? this.apoiadorIdEditando : res.id;
        if (this.logoFile && id) {
          this.apoiadoresService.uploadLogo(id, this.logoFile).subscribe({
            next: () => this.sucessoForm(),
            error: (err) => {
              console.error('Erro no upload logo', err);
              this.announcer.announce('Apoiador salvo, mas houve uma falha ao enviar o logotipo.', 'assertive');
              this.sucessoForm(); // Finaliza do mesmo modo
            }
          });
        } else {
          this.sucessoForm();
        }
      },
      error: (err) => {
        console.error('Erro ao salvar apoiador', err);
        this.announcer.announce('Erro ao salvar no servidor. Verifique os dados e tente novamente.', 'assertive');
        this.salvando = false;
        this.cdr.detectChanges();
      }
    });
  }

  private sucessoForm(): void {
    this.salvando = false;
    this.announcer.announce('Apoiador cadastrado ou atualizado com sucesso.', 'polite');
    this.cdr.detectChanges();
    this.formSaved.emit();
  }

  fecharFormSeguro(): void {
    // Para simplificar a logica isolada do guard, podemos so emitir a requisicao de close
    this.formClosed.emit();
  }
}
