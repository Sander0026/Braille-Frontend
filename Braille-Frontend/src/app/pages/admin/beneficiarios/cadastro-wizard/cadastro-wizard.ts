import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cadastro-wizard',
  standalone: true, // Se o seu Angular for 17+, usamos standalone components
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cadastro-wizard.html',
  styleUrls: ['./cadastro-wizard.scss']
})
export class CadastroWizard implements OnInit {
  
  // Controle de qual passo o usuário está (1 a 4)
  passoAtual = 1;

  // O Formulário Gigante dividido em pedaços
  cadastroForm!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.iniciarFormulario();
  }

  iniciarFormulario() {
    this.cadastroForm = this.fb.group({
      // Passo 1: Dados Pessoais
      dadosPessoais: this.fb.group({
        nomeCompleto: ['', Validators.required],
        dataNascimento: ['', Validators.required],
        cpfRg: ['', Validators.required],
        genero: [''],
        estadoCivil: ['']
      }),

      // Passo 2: Endereço (com busca de CEP futura)
      enderecoLocalizacao: this.fb.group({
        cep: ['', Validators.required],
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

      // Passo 3: Perfil da Deficiência
      perfilDeficiencia: this.fb.group({
        tipoDeficiencia: ['', Validators.required],
        causaDeficiencia: [''],
        idadeOcorrencia: [''],
        possuiLaudo: [false],
        tecAssistivas: [''],
        prefAcessibilidade: ['', Validators.required]
      }),

      // Passo 4: Socioeconômico e Saúde
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

  // Funções de Navegação para a Tela
  avancarPasso() {
    if (this.passoAtual < 4) {
      this.passoAtual++;
      this.anunciarParaLeitorDeTela(`Avançou para a etapa ${this.passoAtual}`);
    }
  }

  voltarPasso() {
    if (this.passoAtual > 1) {
      this.passoAtual--;
      this.anunciarParaLeitorDeTela(`Voltou para a etapa ${this.passoAtual}`);
    }
  }

  // Acessibilidade: Força o leitor de tela (NVDA/VoiceOver) a falar que a página mudou
  anunciarParaLeitorDeTela(mensagem: string) {
    // Isso é uma técnica avançada de acessibilidade (Aria-Live)
    const anuncio = document.getElementById('leitor-tela-anuncio');
    if (anuncio) {
      anuncio.textContent = mensagem;
    }
  }

  salvarCadastro() {
    if (this.cadastroForm.valid) {
      console.log('Dados prontos para o Backend:', this.cadastroForm.value);
      // Aqui chamaremos o Serviço de Beneficiários depois!
    } else {
      this.anunciarParaLeitorDeTela('Erro. Preencha os campos obrigatórios antes de salvar.');
      this.cadastroForm.markAllAsTouched();
    }
  }

  getGroupName(passo: number): string {
    const grupos = ['dadosPessoais', 'enderecoLocalizacao', 'perfilDeficiencia', 'socioeconomico'];
    return grupos[passo - 1];
  }
}