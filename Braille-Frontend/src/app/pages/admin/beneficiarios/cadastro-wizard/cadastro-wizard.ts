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
}