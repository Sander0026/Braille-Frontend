import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { BeneficiariosService } from '../../../../core/services/beneficiarios.service';

@Component({
  selector: 'app-cadastro-wizard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
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

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private beneficiariosService: BeneficiariosService,
  ) { }

  ngOnInit(): void {
    this.iniciarFormulario();
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
        },
        error: () => this.anunciarParaLeitorDeTela('Erro ao conectar com o serviço de CEP.'),
      });
    }
  }

  // Máscara de CPF / RG
  formatarDocumento(event: any) {
    const input = event.target;
    let valor = input.value.replace(/\D/g, '');

    if (valor.length > 11) valor = valor.substring(0, 11);

    if (valor.length <= 9) {
      valor = valor.replace(/(\d{2})(\d)/, '$1.$2');
      valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
      valor = valor.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
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

    const payloadBackend = {
      ...formValues.dadosPessoais,
      ...formValues.enderecoLocalizacao,
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

  private enviarDadosParaBanco(dados: any) {
    this.beneficiariosService.criarBeneficiario(dados).subscribe({
      next: () => {
        this.exibirFeedback('Aluno cadastrado com sucesso!', 'sucesso');
        this.cadastroForm.reset();
        this.passoAtual = 1;
        this.arquivoLaudoSelecionado = null;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (err) => {
        console.error('Erro ao salvar beneficiário:', err);
        const mensagemErro =
          err?.error?.message || 'Erro ao salvar. Verifique os dados e tente novamente.';
        this.exibirFeedback(
          Array.isArray(mensagemErro) ? mensagemErro.join(', ') : mensagemErro,
          'erro',
        );
      },
    });
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