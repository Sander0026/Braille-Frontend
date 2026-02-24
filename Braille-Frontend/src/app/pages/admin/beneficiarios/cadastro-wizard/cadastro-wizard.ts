import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http'; 

@Component({
  selector: 'app-cadastro-wizard',
  standalone: true, 
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule], 
  templateUrl: './cadastro-wizard.html',
  styleUrls: ['./cadastro-wizard.scss']
})
export class CadastroWizard implements OnInit {
  
  passoAtual = 1;
  cadastroForm!: FormGroup;

  // Injetamos o HttpClient aqui no construtor
  constructor(private fb: FormBuilder, private http: HttpClient) {}

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
        estadoCivil: ['']
      }),

      enderecoLocalizacao: this.fb.group({
        cep: ['', [Validators.required, Validators.minLength(8)]],
        rua: ['', Validators.required],
        numero: ['', Validators.required],
        complemento: [''],
        bairro: ['', Validators.required],
        cidade: ['', Validators.required],
        uf: ['', Validators.required],
        telefoneContato: ['', Validators.required],
        email: [''],
        contatoEmergencia: ['']
      }),

      perfilDeficiencia: this.fb.group({
        tipoDeficiencia: ['', Validators.required],
        causaDeficiencia: [''],
        idadeOcorrencia: [''],
        possuiLaudo: [false],
        laudoArquivo: [''],
        tecAssistivas: [''],
        prefAcessibilidade: ['', Validators.required]
      }),

      socioeconomico: this.fb.group({
        escolaridade: [''],
        profissao: [''],
        rendaFamiliar: [''],
        beneficiosGov: [''],
        precisaAcompanhante: [false],
        acompOftalmologico: [false],
        outrasComorbidades: ['']
      })
    });
  }

  // A MÁGICA DO VIACEP
  buscarCep() {
    let cep = this.cadastroForm.get('enderecoLocalizacao.cep')?.value;
    if (!cep) return;
    
    cep = cep.replace(/\D/g, ''); // Limpa traços e pontos

    if (cep.length === 8) {
      this.anunciarParaLeitorDeTela('Buscando endereço pelo CEP...');
      
      this.http.get(`https://viacep.com.br/ws/${cep}/json/`).subscribe({
        next: (dados: any) => {
          if (dados.erro) {
            this.anunciarParaLeitorDeTela('CEP não encontrado. Verifique a digitação.');
            return;
          }
          
          // Preenche os campos sozinhos!
          this.cadastroForm.get('enderecoLocalizacao')?.patchValue({
            rua: dados.logradouro,
            bairro: dados.bairro,
            cidade: dados.localidade,
            uf: dados.uf
          });
          
          this.anunciarParaLeitorDeTela(`Endereço encontrado e preenchido: Rua ${dados.logradouro}, Bairro ${dados.bairro}.`);
        },
        error: () => this.anunciarParaLeitorDeTela('Erro ao conectar com o serviço de CEP.')
      });
    }
  }

  // Máscara Dinâmica de CPF e RG
  formatarDocumento(event: any) {
    let input = event.target;
    // 1. Remove tudo que não for número
    let valor = input.value.replace(/\D/g, ''); 
    
    // 2. Limita a 11 dígitos no máximo (Tamanho do CPF)
    if (valor.length > 11) {
      valor = valor.substring(0, 11);
    }

    // 3. Aplica a máscara enquanto digita
    if (valor.length <= 9) {
      // Máscara genérica de RG (Ex: 12.345.678-9)
      valor = valor.replace(/(\d{2})(\d)/, '$1.$2');
      valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
      valor = valor.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      // Máscara de CPF (Ex: 123.456.789-00)
      valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
      valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
      valor = valor.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }

    // 4. Atualiza o valor no HTML e no "Cérebro" do formulário
    input.value = valor;
    this.cadastroForm.get('dadosPessoais.cpfRg')?.setValue(valor, { emitEvent: false });
  }

  // Máscara Dinâmica de Telefone (Fixo e Celular)
  formatarTelefone(event: any) {
    let input = event.target;
    // 1. Remove tudo que não for número
    let valor = input.value.replace(/\D/g, ''); 
    
    // 2. Limita a 11 dígitos no máximo (DDD + 9 dígitos)
    if (valor.length > 11) {
      valor = valor.substring(0, 11);
    }

    // 3. Aplica a máscara enquanto digita
    if (valor.length <= 10) {
      // Máscara para Fixo (Ex: (27) 3333-4444)
      valor = valor.replace(/(\d{2})(\d)/, '($1) $2');
      valor = valor.replace(/(\d{4})(\d)/, '$1-$2');
    } else {
      // Máscara para Celular (Ex: (27) 99999-8888)
      valor = valor.replace(/(\d{2})(\d)/, '($1) $2');
      valor = valor.replace(/(\d{5})(\d)/, '$1-$2');
    }

    // 4. Atualiza o valor no HTML e no "Cérebro" do formulário
    input.value = valor;
    this.cadastroForm.get('enderecoLocalizacao.telefoneContato')?.setValue(valor, { emitEvent: false });
  }

  //  VERIFICADOR DE ERRO PARA O HTML
  isCampoInvalido(grupo: string, campo: string): boolean {
    const controle = this.cadastroForm.get(`${grupo}.${campo}`);
    // Retorna TRUE se o campo for inválido E o usuário já tiver tocado/digitado nele
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
      this.anunciarParaLeitorDeTela(`Avançou para a etapa ${this.passoAtual}`);
    } else {
      // Se tiver erro, marca tudo como "tocado" para acender os alertas vermelhos
      formGrupo?.markAllAsTouched();
      this.anunciarParaLeitorDeTela('Existem campos obrigatórios não preenchidos nesta etapa.');
    }
  }

  voltarPasso() {
    if (this.passoAtual > 1) {
      this.passoAtual--;
      this.anunciarParaLeitorDeTela(`Voltou para a etapa ${this.passoAtual}`);
    }
  }

  anunciarParaLeitorDeTela(mensagem: string) {
    const anuncio = document.getElementById('leitor-tela-anuncio');
    if (anuncio) anuncio.textContent = mensagem;
  }

  salvarCadastro() {
    if (this.cadastroForm.valid) {
      console.log('Dados prontos:', this.cadastroForm.value);
    } else {
      this.cadastroForm.markAllAsTouched();
    }
  }

  // 👇 NOVA FUNÇÃO: Captura o arquivo de imagem do laudo
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.anunciarParaLeitorDeTela(`Foto do laudo selecionada: ${file.name}`);
      // Futuramente, enviaremos isso para o Cloudinary!
    }
  }
}