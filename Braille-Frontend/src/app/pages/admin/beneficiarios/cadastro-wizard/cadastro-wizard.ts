import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { BeneficiariosService, ReativacaoAluno } from '../../../../core/services/beneficiarios.service';
import { A11yModule } from '@angular/cdk/a11y';


@Component({
  selector: 'app-cadastro-wizard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, A11yModule],
  templateUrl: './cadastro-wizard.html',
  styleUrl: './cadastro-wizard.scss',
})
export class CadastroWizard implements OnInit {
  passoAtual = 1;
  cadastroForm!: FormGroup;
  arquivoLaudoSelecionado: File | null = null;
  isSalvando = false;
  mensagemFeedback = '';
  tipoFeedback: 'sucesso' | 'erro' | '' = '';

  // Modal de Reativoão de Aluno
  modalReativacao = false;
  dadosReativacao: ReativacaoAluno | null = null;
  _payloadPendente: Record<string, unknown> | null = null; // guarda dados para re-usar após reativar

  // Validação CPF/RG em tempo real (blur)
  cpfRgStatus: 'livre' | 'ativo' | 'inativo' | 'verificando' | '' = '';
  cpfRgConflito: { nomeCompleto: string; matricula: string | null } | null = null;


  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private beneficiariosService: BeneficiariosService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.iniciarFormulario();
    this.monitorarCausaDeficiencia();
  }

  /** Desabilita "Idade em que ocorreu" quando a causa for CONGENITA */
  private monitorarCausaDeficiencia(): void {
    const causaCtrl = this.cadastroForm.get('perfilDeficiencia.causaDeficiencia');
    const idadeCtrl = this.cadastroForm.get('perfilDeficiencia.idadeOcorrencia');
    if (!causaCtrl || !idadeCtrl) return;

    // Estado inicial (desabilitado se não for ADQUIRIDA)
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
        cpfRg: ['', Validators.required],
        genero: [''],
        estadoCivil: [''],
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
        // laudoArquivo é SOMENTE para a UI — NÃO é enviado ao backend diretamente
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

  // ViaCEP — Busca automática de endereço pelo CEP
  buscarCep() {
    let cep = this.cadastroForm.get('enderecoLocalizacao.cep')?.value;
    if (!cep) return;

    cep = cep.replace(/\D/g, '');

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

          this.anunciarParaLeitorDeTela(
            `Endereço encontrado: ${dados.logradouro}, ${dados.bairro}, ${dados.localidade} - ${dados.uf}.`,
          );
          this.cdr.detectChanges();
        },
        error: () => { this.anunciarParaLeitorDeTela('Erro ao conectar com o serviço de CEP.'); this.cdr.detectChanges(); },
      });
    }
  }

  // Verifica CPF/RG ao sair do campo (blur)
  verificarCpfRg() {
    const valor = this.cadastroForm.get('dadosPessoais.cpfRg')?.value ?? '';
    const limpo = valor.replace(/\D/g, '');
    if (!limpo) { this.cpfRgStatus = ''; this.cpfRgConflito = null; return; }

    this.cpfRgStatus = 'verificando';
    this.cpfRgConflito = null;
    this.cdr.detectChanges();

    this.beneficiariosService.checkCpfRg(limpo).subscribe({
      next: (res) => {
        this.cpfRgStatus = res.status;
        if (res.status === 'ativo') {
          this.cpfRgConflito = { nomeCompleto: res.nomeCompleto, matricula: res.matricula };
          this.anunciarParaLeitorDeTela(`CPF/RG já pertence ao aluno ativo: ${res.nomeCompleto}.`);
        } else if (res.status === 'inativo') {
          // Abre modal de reativação imediatamente
          this.dadosReativacao = {
            _reativacao: true,
            id: res.id,
            nomeCompleto: res.nomeCompleto,
            matricula: res.matricula ?? undefined,
            statusAtivo: false,
            excluido: res.excluido,
            message: 'Aluno inativo/excluido encontrado',
          };
          this.modalReativacao = true;
          this.anunciarParaLeitorDeTela(`Aluno inativo encontrado: ${res.nomeCompleto}. Deseja reativar?`);
        }
        this.cdr.detectChanges();
      },
      error: () => { this.cpfRgStatus = ''; this.cdr.detectChanges(); },
    });
  }

  // Máscara de CPF / RG
  formatarDocumento(event: any) {
    const input = event.target;
    let valor = input.value.replace(/\D/g, '');

    if (valor.length > 11) valor = valor.substring(0, 11);

    if (valor.length <= 9) {
      if (valor.length === 9) {
        valor = valor.replace(/(\d{2})(\d{3})(\d{3})(\d{1})/, '$1.$2.$3-$4');
      } else {
        valor = valor.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
      }
    } else {
      valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
      valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
      valor = valor.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }

    input.value = valor;
    this.cadastroForm.get('dadosPessoais.cpfRg')?.setValue(valor, { emitEvent: false });
  }

  // Máscara de Telefone
  formatarTelefone(event: any) {
    const input = event.target;
    let valor = input.value.replace(/\D/g, '');

    if (valor.length > 11) valor = valor.substring(0, 11);

    if (valor.length <= 10) {
      valor = valor.replace(/(\d{2})(\d)/, '($1) $2');
      valor = valor.replace(/(\d{4})(\d)/, '$1-$2');
    } else {
      valor = valor.replace(/(\d{2})(\d)/, '($1) $2');
      valor = valor.replace(/(\d{5})(\d)/, '$1-$2');
    }

    input.value = valor;
    this.cadastroForm
      .get('enderecoLocalizacao.telefoneContato')
      ?.setValue(valor, { emitEvent: false });
  }

  // Verifica se campo é inválido (para exibir erro)
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

    // Bloqueia avanço se CPF/RG conflitou com aluno ativo
    if (this.passoAtual === 1 && this.cpfRgStatus === 'ativo') {
      this.anunciarParaLeitorDeTela('Não é possível avançar. Já existe um aluno ativo com este CPF/RG.');
      return;
    }

    if (formGrupo?.valid) {
      this.passoAtual++;
      this.anunciarParaLeitorDeTela(`Avançou para a etapa ${this.passoAtual} de 4.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      formGrupo?.markAllAsTouched();
      this.anunciarParaLeitorDeTela('Existem campos obrigatórios não preenchidos nesta etapa.');
    }
  }

  voltarPasso() {
    if (this.passoAtual > 1) {
      this.passoAtual--;
      this.anunciarParaLeitorDeTela(`Voltou para a etapa ${this.passoAtual} de 4.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  anunciarParaLeitorDeTela(mensagem: string) {
    const anuncio = document.getElementById('leitor-tela-anuncio');
    if (anuncio) anuncio.textContent = mensagem;
  }

  salvarCadastro() {
    if (this.isSalvando) return; // Previne duplo envio
    if (this.cadastroForm.invalid) {
      this.cadastroForm.markAllAsTouched();
      this.anunciarParaLeitorDeTela('Erro. Verifique os campos em vermelho antes de continuar.');
      return;
    }

    this.isSalvando = true;
    this.mensagemFeedback = '';
    this.anunciarParaLeitorDeTela('Salvando cadastro, por favor aguarde...');

    const formValues = this.cadastroForm.value;

    // ✅ FIX: Monta o payload SEM o campo laudoArquivo (campo exclusivo da UI)
    // e SEM campos de endereço que não existem no grupo correto
    const { laudoArquivo, ...perfilDeficienciaSemArquivo } = formValues.perfilDeficiencia;

    const limparSinais = (val: string | null | undefined) => val ? val.replace(/\D/g, '') : val;

    const payloadBackend = {
      ...formValues.dadosPessoais,
      cpfRg: limparSinais(formValues.dadosPessoais.cpfRg),
      ...formValues.enderecoLocalizacao,
      cep: limparSinais(formValues.enderecoLocalizacao.cep),
      telefoneContato: limparSinais(formValues.enderecoLocalizacao.telefoneContato),
      ...perfilDeficienciaSemArquivo,
      ...formValues.socioeconomico,
    };

    // ✅ FIX: Remove campos com string vazia para não falhar @IsEnum() do backend
    // O backend usa @IsOptional() em todos os enums, então undefined é aceito
    const enumFields = ['tipoDeficiencia', 'causaDeficiencia', 'prefAcessibilidade'];
    for (const field of enumFields) {
      if (payloadBackend[field] === '' || payloadBackend[field] === null) {
        delete payloadBackend[field];
      }
    }

    // ✅ FIX: Remove strings vazias de campos opcionais para manter o banco limpo
    const optionalStringFields = [
      'genero', 'estadoCivil', 'complemento', 'pontoReferencia', 'email',
      'contatoEmergencia', 'idadeOcorrencia', 'tecAssistivas', 'escolaridade',
      'profissao', 'rendaFamiliar', 'beneficiosGov', 'composicaoFamiliar', 'outrasComorbidades',
    ];
    for (const field of optionalStringFields) {
      if (payloadBackend[field] === '') {
        delete payloadBackend[field];
      }
    }

    // Se tem laudo para subir, faz o upload primeiro
    if (this.arquivoLaudoSelecionado) {
      this.beneficiariosService.uploadImagem(this.arquivoLaudoSelecionado).subscribe({
        next: (resposta) => {
          // Foto subiu com sucesso no Cloudinary — salva a URL no campo correto
          payloadBackend['laudoUrl'] = resposta.url;
          this.enviarDadosParaBanco(payloadBackend);
        },
        error: () => {
          this.exibirFeedback('Erro ao enviar a imagem do laudo. Tente novamente.', 'erro');
        },
      });
    } else {
      this.enviarDadosParaBanco(payloadBackend);
    }
  }

  private enviarDadosParaBanco(dados: Record<string, unknown>) {
    this.beneficiariosService.criarBeneficiario(dados).subscribe({
      next: (resp) => {
        // Backend retornou sinal de reativação (CPF/RG inativo)
        if ('_reativacao' in resp && resp._reativacao) {
          this.isSalvando = false;
          this.dadosReativacao = resp as ReativacaoAluno;
          this._payloadPendente = dados;
          this.modalReativacao = true;
          this.cdr.detectChanges();
          return;
        }

        // Criação normal bem-sucedida
        this.exibirFeedback('Aluno cadastrado com sucesso!', 'sucesso');
        this.cadastroForm.reset();
        this.passoAtual = 1;
        this.arquivoLaudoSelecionado = null;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (err: { status: number; error?: { message?: string | string[] } }) => {
        console.error('Erro ao salvar beneficiário:', err);
        const mensagemErro = err?.error?.message ?? 'Erro ao salvar. Verifique os dados e tente novamente.';
        this.exibirFeedback(
          Array.isArray(mensagemErro) ? mensagemErro.join(', ') : mensagemErro,
          'erro',
        );
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
        this.exibirFeedback(
          `Aluno ${aluno.nomeCompleto} reativado com sucesso! (Matrícula: ${aluno.matricula ?? '—'})`,
          'sucesso'
        );
        this.cadastroForm.reset();
        this.passoAtual = 1;
        window.scrollTo({ top: 0, behavior: 'smooth' });
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

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.arquivoLaudoSelecionado = file;
      this.anunciarParaLeitorDeTela(`Arquivo de laudo selecionado: ${file.name}`);
    }
  }
}