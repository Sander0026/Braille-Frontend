import { Component, OnInit, OnChanges, Input, Output, EventEmitter, ChangeDetectorRef, SimpleChanges } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BeneficiariosService, Beneficiario, ReativacaoAluno } from '../../../core/services/beneficiarios.service';
import { A11yModule } from '@angular/cdk/a11y';
import { TabEscapeDirective } from '../../../shared/directives/tab-escape.directive';
import { BaseFormDescarte } from '../../../shared/classes/base-form-descarte';

@Component({
  selector: 'app-beneficiary-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, A11yModule, TabEscapeDirective],
  templateUrl: './beneficiary-form.html',
  styleUrl: './beneficiary-form.scss',
})
export class BeneficiaryFormComponent extends BaseFormDescarte implements OnInit, OnChanges {
  @Input() alunoEmEdicao: Beneficiario | null = null;
  @Output() salvou = new EventEmitter<void>();
  @Output() cancelou = new EventEmitter<void>();

  isModoEdicao = false;
  passoAtual = 1;
  cadastroForm!: FormGroup;
  arquivoFotoSelecionado: File | null = null;
  arquivoTermoSelecionado: File | null = null;
  arquivoLaudoSelecionado: File | null = null;
  isSalvando = false;
  mensagemFeedback = '';
  tipoFeedback: 'sucesso' | 'erro' | '' = '';

  // Modal de Reativação de Aluno
  modalReativacao = false;
  dadosReativacao: ReativacaoAluno | null = null;
  _payloadPendente: Record<string, unknown> | null = null;

  // Validação CPF/RG em tempo real
  cpfStatus: 'livre' | 'ativo' | 'inativo' | 'verificando' | '' = '';
  cpfConflito: { nomeCompleto: string; matricula: string | null } | null = null;
  rgStatus: 'livre' | 'ativo' | 'inativo' | 'verificando' | '' = '';
  rgConflito: { nomeCompleto: string; matricula: string | null } | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly http: HttpClient,
    private readonly beneficiariosService: BeneficiariosService,
    private readonly cdr: ChangeDetectorRef,
    private readonly router: Router,
  ) {
    super();
    this.iniciarFormulario();
  }

  ngOnInit(): void {
    this.monitorarCausaDeficiencia();
    if (this.alunoEmEdicao) {
      this.aplicarModoEdicao(this.alunoEmEdicao);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['alunoEmEdicao']?.currentValue) {
      this.aplicarModoEdicao(changes['alunoEmEdicao'].currentValue);
    } else if (changes['alunoEmEdicao'] && !changes['alunoEmEdicao'].currentValue) {
      this.isModoEdicao = false;
      this.cadastroForm.reset();
      this.passoAtual = 1;
    }
  }

  isFormDirty(): boolean {
    return !!this.cadastroForm?.dirty && !this.isSalvando;
  }

  private aplicarModoEdicao(aluno: any) {
    this.isModoEdicao = true;
    this.passoAtual = 1;
    this.cadastroForm.patchValue({
      dadosPessoais: {
        nomeCompleto: aluno.nomeCompleto,
        dataNascimento: aluno.dataNascimento ? new Date(aluno.dataNascimento).toISOString().substring(0, 10) : '',
        cpf: aluno.cpf,
        rg: aluno.rg,
        genero: aluno.genero,
        estadoCivil: aluno.estadoCivil,
        corRaca: aluno.corRaca,
      },
      enderecoLocalizacao: {
        cep: aluno.cep,
        rua: aluno.rua,
        numero: aluno.numero,
        complemento: aluno.complemento,
        bairro: aluno.bairro,
        cidade: aluno.cidade,
        uf: aluno.uf,
        pontoReferencia: aluno.pontoReferencia,
        telefoneContato: aluno.telefoneContato,
        email: aluno.email,
        contatoEmergencia: aluno.contatoEmergencia,
      },
      perfilDeficiencia: {
        tipoDeficiencia: aluno.tipoDeficiencia,
        causaDeficiencia: aluno.causaDeficiencia,
        idadeOcorrencia: aluno.idadeOcorrencia,
        possuiLaudo: !!aluno.laudoUrl,
        tecAssistivas: aluno.tecAssistivas,
        prefAcessibilidade: aluno.prefAcessibilidade,
      },
      socioeconomico: {
        escolaridade: aluno.escolaridade,
        profissao: aluno.profissao,
        rendaFamiliar: aluno.rendaFamiliar,
        beneficiosGov: aluno.beneficiosGov,
        composicaoFamiliar: aluno.composicaoFamiliar,
        precisaAcompanhante: aluno.precisaAcompanhante,
        acompOftalmologico: aluno.acompOftalmologico,
        outrasComorbidades: aluno.outrasComorbidades,
      }
    });

    // Se estiver em modo de edição, CPF/RG assumimos como 'livre' para não bloquear, 
    // a menos que sejam alterados.
    this.cpfStatus = 'livre';
    this.rgStatus = 'livre';
    this.cdr.detectChanges();
  }

  private monitorarCausaDeficiencia(): void {
    const causaCtrl = this.cadastroForm.get('perfilDeficiencia.causaDeficiencia');
    const idadeCtrl = this.cadastroForm.get('perfilDeficiencia.idadeOcorrencia');
    if (!causaCtrl || !idadeCtrl) return;

    const aplicar = (valor: string) => {
      if (valor === 'ADQUIRIDA') {
        idadeCtrl.enable();
      } else {
        idadeCtrl.disable();
        idadeCtrl.setValue('');
      }
    };

    aplicar(causaCtrl.value);
    causaCtrl.valueChanges.subscribe(aplicar);
  }

  iniciarFormulario() {
    this.cadastroForm = this.fb.group({
      dadosPessoais: this.fb.group({
        nomeCompleto: ['', [Validators.required, Validators.minLength(3)]],
        dataNascimento: ['', Validators.required],
        cpf: [''],
        rg: [''],
        genero: [''],
        estadoCivil: [''],
        corRaca: [''],
      }),
      enderecoLocalizacao: this.fb.group({
        cep: ['', [Validators.required, Validators.minLength(8)]],
        rua: ['', Validators.required],
        numero: ['', Validators.required],
        complemento: [''],
        bairro: ['', Validators.required],
        cidade: ['', Validators.required],
        uf: ['', [Validators.required, Validators.maxLength(2)]],
        pontoReferencia: [''],
        telefoneContato: ['', Validators.required],
        email: ['', Validators.email],
        contatoEmergencia: [''],
      }),
      perfilDeficiencia: this.fb.group({
        tipoDeficiencia: ['', Validators.required],
        causaDeficiencia: [''],
        idadeOcorrencia: [''],
        possuiLaudo: [false],
        laudoArquivo: [''],
        tecAssistivas: [''],
        prefAcessibilidade: ['', Validators.required],
      }),
      socioeconomico: this.fb.group({
        escolaridade: [''],
        profissao: [''],
        rendaFamiliar: [''],
        beneficiosGov: [''],
        composicaoFamiliar: [''],
        precisaAcompanhante: [false],
        acompOftalmologico: [false],
        outrasComorbidades: [''],
      }),
    });
  }

  getControl(path: string): FormControl {
    return this.cadastroForm.get(path) as FormControl;
  }

  buscarCep() {
    let cep = this.cadastroForm.get('enderecoLocalizacao.cep')?.value;
    if (!cep) return;
    cep = cep.replaceAll(/\D/g, '');
    if (cep.length === 8) {
      this.anunciarParaLeitorDeTela('Buscando endereço pelo CEP...');
      this.http.get(`https://viacep.com.br/ws/${cep}/json/`).subscribe({
        next: (dados: any) => {
          if (dados.erro) {
            this.anunciarParaLeitorDeTela('CEP não encontrado. Verifique a digitação.');
            return;
          }
          this.cadastroForm.get('enderecoLocalizacao')?.patchValue({
            rua: dados.logradouro,
            bairro: dados.bairro,
            cidade: dados.localidade,
            uf: dados.uf,
          });
          this.anunciarParaLeitorDeTela(`Endereço encontrado: ${dados.logradouro}, ${dados.bairro}, ${dados.localidade} - ${dados.uf}.`);
          this.cdr.detectChanges();
        },
        error: () => { 
          this.anunciarParaLeitorDeTela('Erro ao conectar com o serviço de CEP.'); 
          this.cdr.detectChanges(); 
        },
      });
    }
  }

  verificarObrigatoriedadeCpfRg() {
    const cpf = this.cadastroForm.get('dadosPessoais.cpf')?.value;
    const rg = this.cadastroForm.get('dadosPessoais.rg')?.value;
    
    if (!cpf && !rg) {
       this.cadastroForm.get('dadosPessoais.cpf')?.setErrors({ required: true });
       this.cadastroForm.get('dadosPessoais.rg')?.setErrors({ required: true });
    } else {
       if (this.cadastroForm.get('dadosPessoais.cpf')?.hasError('required')) {
         this.cadastroForm.get('dadosPessoais.cpf')?.setErrors(null);
       }
       if (this.cadastroForm.get('dadosPessoais.rg')?.hasError('required')) {
         this.cadastroForm.get('dadosPessoais.rg')?.setErrors(null);
       }
    }
  }

  private atualizarStatusDocumento(tipo: 'cpf' | 'rg', status: 'livre' | 'ativo' | 'inativo' | 'verificando' | '', conflito: any = null) {
      if (tipo === 'cpf') {
        this.cpfStatus = status;
        this.cpfConflito = conflito;
      } else {
        this.rgStatus = status;
        this.rgConflito = conflito;
      }
      this.cdr.detectChanges();
  }

  private documentoInalteradoEmEdicao(tipo: 'cpf' | 'rg', valorLimpo: string): boolean {
    if (this.isModoEdicao && this.alunoEmEdicao) {
      const docOriginal = tipo === 'cpf' ? this.alunoEmEdicao.cpf : this.alunoEmEdicao.rg;
      return valorLimpo === docOriginal;
    }
    return false;
  }

  verificarCampoUnico(tipo: 'cpf' | 'rg') {
    this.verificarObrigatoriedadeCpfRg();
    const valor = this.cadastroForm.get(`dadosPessoais.${tipo}`)?.value ?? '';
    const limpo = tipo === 'cpf' ? String(valor).replaceAll(/\D/g, '') : String(valor).trim();
    
    if (!limpo) { 
        this.atualizarStatusDocumento(tipo, '');
        return; 
    }

    // Se é edição e o documento não mudou, não apitar como erro
    if (this.documentoInalteradoEmEdicao(tipo, limpo)) {
        this.atualizarStatusDocumento(tipo, 'livre');
        return;
    }

    this.atualizarStatusDocumento(tipo, 'verificando');

    const reqCpf = tipo === 'cpf' ? limpo : '';
    const reqRg = tipo === 'rg' ? limpo : '';
    const request = this.beneficiariosService.checkCpfRg(reqCpf, reqRg);

    request.subscribe({
      next: (res) => {
        this.atualizarStatusDocumento(tipo, res.status);

        if (res.status === 'ativo') {
          const conflito = { nomeCompleto: res.nomeCompleto, matricula: res.matricula };
          this.atualizarStatusDocumento(tipo, 'ativo', conflito);
          this.anunciarParaLeitorDeTela(`${tipo.toUpperCase()} já pertence ao aluno ativo: ${res.nomeCompleto}.`);
        } else if (res.status === 'inativo') {
          this.dadosReativacao = {
            _reativacao: true,
            id: res.id,
            nomeCompleto: res.nomeCompleto,
            matricula: res.matricula ?? undefined,
            statusAtivo: false,
            excluido: res.excluido,
            message: 'Aluno inativo/excluído encontrado',
          };
          this.modalReativacao = true;
          this.anunciarParaLeitorDeTela(`Aluno inativo encontrado: ${res.nomeCompleto}. Deseja reativar?`);
        }
      },
      error: () => this.atualizarStatusDocumento(tipo, ''),
    });
  }

  formatarDocumento(event: any) {
    const input = event.target;
    let valor = input.value.replaceAll(/\D/g, '');
    if (valor.length > 11) valor = valor.substring(0, 11);
    if (valor.length <= 9) {
      if (valor.length === 9) {
        valor = valor.replaceAll(/(\d{2})(\d{3})(\d{3})(\d)/g, '$1.$2.$3-$4');
      } else {
        valor = valor.replaceAll(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
      }
    } else {
      valor = valor.replaceAll(/(\d{3})(\d)/g, '$1.$2');
      valor = valor.replaceAll(/(\d{3})(\d)/g, '$1.$2');
      valor = valor.replaceAll(/(\d{3})(\d{1,2})$/g, '$1-$2');
    }
    input.value = valor;
    this.cadastroForm.get('dadosPessoais.cpf')?.setValue(valor, { emitEvent: false });
    this.verificarObrigatoriedadeCpfRg();
  }

  formatarRg(event: Event) {
    const input = event.target as HTMLInputElement;
    let digitos = input.value.replaceAll(/\D/g, '');
    if (digitos.length > 8) digitos = digitos.substring(0, 8);
    let mascara = '';
    if (digitos.length <= 7) {
      mascara = digitos.replaceAll(/(\d)(\d)/g, '$1.$2').replaceAll(/(\d{3})(\d)/g, '$1.$2');
    } else {
      mascara = digitos.replaceAll(/(\d{2})(\d)/g, '$1.$2').replaceAll(/(\d{3})(\d)/g, '$1.$2');
    }
    input.value = mascara;
    this.cadastroForm.get('dadosPessoais.rg')?.setValue(mascara, { emitEvent: false });
    this.verificarObrigatoriedadeCpfRg();
  }

  formatarTelefone(event: any) {
    const input = event.target;
    let valor = input.value.replaceAll(/\D/g, '');
    if (valor.length > 11) valor = valor.substring(0, 11);
    if (valor.length <= 10) {
      valor = valor.replaceAll(/(\d{2})(\d)/g, '($1) $2').replaceAll(/(\d{4})(\d)/g, '$1-$2');
    } else {
      valor = valor.replaceAll(/(\d{2})(\d)/g, '($1) $2').replaceAll(/(\d{5})(\d)/g, '$1-$2');
    }
    input.value = valor;
    this.cadastroForm.get('enderecoLocalizacao.telefoneContato')?.setValue(valor, { emitEvent: false });
  }

  isCampoInvalido(grupo: string, campo: string): boolean {
    const controle = this.cadastroForm.get(`${grupo}.${campo}`);
    return !!(controle && controle.invalid && (controle.dirty || controle.touched));
  }

  getGroupName(passo: number): string {
    const grupos = ['dadosPessoais', 'enderecoLocalizacao', 'perfilDeficiencia', 'socioeconomico'];
    return grupos[passo - 1];
  }

  avancarPasso() {
    const grupoAtual = this.getGroupName(this.passoAtual);
    const formGrupo = this.cadastroForm.get(grupoAtual);
    if (this.passoAtual === 1 && (this.cpfStatus === 'ativo' || this.rgStatus === 'ativo')) {
      this.anunciarParaLeitorDeTela('Não é possível avançar. Já existe um aluno ativo com este documento.');
      return;
    }
    if (this.passoAtual === 1) {
       this.verificarObrigatoriedadeCpfRg();
    }
    if (formGrupo?.valid) {
      this.passoAtual++;
      this.anunciarParaLeitorDeTela(`Avançou para a etapa ${this.passoAtual} de 4.`);
      document.querySelector('.wizard-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      formGrupo?.markAllAsTouched();
      this.anunciarParaLeitorDeTela('Existem campos obrigatórios não preenchidos nesta etapa.');
    }
  }

  voltarPasso() {
    if (this.passoAtual > 1) {
      this.passoAtual--;
      this.anunciarParaLeitorDeTela(`Voltou para a etapa ${this.passoAtual} de 4.`);
      document.querySelector('.wizard-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  emitirCancelamento() {
     this.cancelou.emit();
     if (!this.cancelou.observed) {
       this.router.navigate(['/admin/alunos']);
     }
  }

  anunciarParaLeitorDeTela(mensagem: string) {
    const anuncio = document.getElementById('leitor-tela-anuncio');
    if (anuncio) anuncio.textContent = mensagem;
  }

  salvarCadastro() {
    if (this.isSalvando) return;
    if (this.cadastroForm.invalid) {
      this.cadastroForm.markAllAsTouched();
      this.anunciarParaLeitorDeTela('Erro. Verifique os campos em vermelho antes de continuar.');
      return;
    }

    this.isSalvando = true;
    this.mensagemFeedback = '';
    this.anunciarParaLeitorDeTela('Salvando cadastro, por favor aguarde...');
    const formValues = this.cadastroForm.value;
    const { laudoArquivo, ...perfilDeficienciaSemArquivo } = formValues.perfilDeficiencia;
    const limparSinais = (val: string | null | undefined) => val ? val.replaceAll(/\D/g, '') : val;

    const payloadBackend = {
      ...formValues.dadosPessoais,
      cpf: limparSinais(formValues.dadosPessoais.cpf),
      rg: formValues.dadosPessoais.rg?.trim(),
      ...formValues.enderecoLocalizacao,
      cep: limparSinais(formValues.enderecoLocalizacao.cep),
      telefoneContato: limparSinais(formValues.enderecoLocalizacao.telefoneContato),
      ...perfilDeficienciaSemArquivo,
      ...formValues.socioeconomico,
    };

    const enumFields = ['tipoDeficiencia', 'causaDeficiencia', 'prefAcessibilidade'];
    for (const field of enumFields) {
      if (payloadBackend[field] === '' || payloadBackend[field] === null) {
        delete payloadBackend[field];
      }
    }

    const optionalStringFields = [
      'genero', 'estadoCivil', 'corRaca', 'complemento', 'pontoReferencia', 'email',
      'contatoEmergencia', 'idadeOcorrencia', 'tecAssistivas', 'escolaridade',
      'profissao', 'rendaFamiliar', 'beneficiosGov', 'composicaoFamiliar', 'outrasComorbidades',
    ];
    for (const field of optionalStringFields) {
      if (payloadBackend[field] === '') {
        delete payloadBackend[field];
      }
    }

    const uploadTasks: Array<Observable<{ tipo: string; url: string }>> = [];
    if (this.arquivoFotoSelecionado) {
      uploadTasks.push(this.beneficiariosService.uploadImagem(this.arquivoFotoSelecionado).pipe(map((res) => ({ tipo: 'fotoPerfil', url: res.url }))));
    }
    if (this.arquivoLaudoSelecionado) {
      uploadTasks.push(this.beneficiariosService.uploadImagem(this.arquivoLaudoSelecionado).pipe(map((res) => ({ tipo: 'laudoUrl', url: res.url }))));
    }
    if (this.arquivoTermoSelecionado) {
      uploadTasks.push(this.beneficiariosService.uploadPdf(this.arquivoTermoSelecionado, 'lgpd').pipe(map((res) => ({ tipo: 'termoLgpdUrl', url: res.url }))));
    }

    if (uploadTasks.length > 0) {
      forkJoin(uploadTasks).subscribe({
        next: (results) => {
          results.forEach((r) => {
            payloadBackend[r.tipo] = r.url;
            if (r.tipo === 'termoLgpdUrl') {
              payloadBackend['termoLgpdAceito'] = true;
              payloadBackend['termoLgpdAceitoEm'] = new Date().toISOString();
            }
          });
          this.enviarDadosParaBanco(payloadBackend);
        },
        error: () => {
          this.exibirFeedback('Erro ao enviar documentos. Tente novamente.', 'erro');
        },
      });
    } else {
      this.enviarDadosParaBanco(payloadBackend);
    }
  }

  private enviarDadosParaBanco(dados: Record<string, unknown>) {
    const call$: Observable<any> = this.isModoEdicao && this.alunoEmEdicao
       ? this.beneficiariosService.atualizar(this.alunoEmEdicao.id, { ...this.alunoEmEdicao, ...dados })
       : this.beneficiariosService.criarBeneficiario(dados);

    call$.subscribe({
      next: (resp) => {
        if (!this.isModoEdicao && 'reativacao' in resp && resp._reativacao) {
          this.isSalvando = false;
          this.dadosReativacao = resp as ReativacaoAluno;
          this._payloadPendente = dados;
          this.modalReativacao = true;
          this.cdr.detectChanges();
          return;
        }

        this.exibirFeedback(this.isModoEdicao ? 'Aluno atualizado com sucesso!' : 'Aluno cadastrado com sucesso!', 'sucesso');
        this.salvou.emit();

        if (!this.isModoEdicao) {
           this.cadastroForm.reset();
           this.passoAtual = 1;
           this.arquivoFotoSelecionado = null;
           this.arquivoTermoSelecionado = null;
           this.arquivoLaudoSelecionado = null;
           
           if (!this.salvou.observed) {
             setTimeout(() => this.router.navigate(['/admin/alunos']), 2500);
           } else {
             document.querySelector('.wizard-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
           }
        }
      },
      error: (err: { status: number; error?: { message?: string | string[] } }) => {
        console.error('Erro ao salvar beneficiário:', err);
        const mensagemErro = err?.error?.message ?? 'Erro ao salvar. Verifique os dados e tente novamente.';
        this.exibirFeedback(Array.isArray(mensagemErro) ? mensagemErro.join(', ') : mensagemErro, 'erro');
        this.cdr.detectChanges();
      },
    });
  }

  confirmarReativacao() {
    if (!this.dadosReativacao) return;
    this.isSalvando = true;
    this.beneficiariosService.reativar(this.dadosReativacao.id).subscribe({
      next: (aluno) => {
        this.isSalvando = false;
        this.modalReativacao = false;
        this.dadosReativacao = null;
        this._payloadPendente = null;
        this.exibirFeedback(`Aluno reativado com sucesso!`, 'sucesso');
        this.cadastroForm.reset();
        this.passoAtual = 1;
        this.salvou.emit();
        
        if (!this.salvou.observed) {
          setTimeout(() => this.router.navigate(['/admin/alunos']), 2500);
        } else {
          document.querySelector('.wizard-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        
        this.cdr.detectChanges();
      },
      error: () => {
        this.isSalvando = false;
        this.exibirFeedback('Erro ao reativar aluno. Tente novamente.', 'erro');
        this.cdr.detectChanges();
      }
    });
  }

  cancelarReativacao() {
    this.modalReativacao = false;
    this.dadosReativacao = null;
    this._payloadPendente = null;
  }

  private exibirFeedback(mensagem: string, tipo: 'sucesso' | 'erro') {
    this.isSalvando = false;
    this.mensagemFeedback = mensagem;
    this.tipoFeedback = tipo;
    this.anunciarParaLeitorDeTela(mensagem);
    if (tipo === 'sucesso') {
      setTimeout(() => (this.mensagemFeedback = ''), 6000);
    }
  }

  onFotoSelecionada(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.arquivoFotoSelecionado = file;
      this.anunciarParaLeitorDeTela(`Foto selecionada: ${file.name}`);
    }
  }

  onTermoSelecionado(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.arquivoTermoSelecionado = file;
      this.anunciarParaLeitorDeTela(`Termo selecionado: ${file.name}`);
    }
  }

  onLaudoSelecionado(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.arquivoLaudoSelecionado = file;
      this.anunciarParaLeitorDeTela(`Laudo selecionado: ${file.name}`);
    }
  }
}
