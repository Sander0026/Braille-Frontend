import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
    selector: 'app-cadastro-usuario-wizard',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
    templateUrl: './cadastro-usuario-wizard.html',
    styleUrls: ['./cadastro-usuario-wizard.scss']
})
export class CadastroUsuarioWizard implements OnInit {

    passoAtual = 1;
    cadastroUsuarioForm!: FormGroup;
    arquivoFotoSelecionado: File | null = null;
    isSalvando = false;
    mensagemFeedback = '';
    tipoFeedback: 'sucesso' | 'erro' | '' = '';

    constructor(
        private fb: FormBuilder,
        private http: HttpClient,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.iniciarFormulario();
    }

    iniciarFormulario() {
        this.cadastroUsuarioForm = this.fb.group({
            dadosPessoais: this.fb.group({
                nomeCompleto: ['', [Validators.required, Validators.minLength(3)]],
                cpf: ['', [Validators.required, Validators.minLength(14)]],
                idade: ['', [Validators.required, Validators.min(18)]],
                fotoPerfil: ['']
            }),

            enderecoLocalizacao: this.fb.group({
                cep: ['', [Validators.required, Validators.minLength(8)]],
                rua: ['', Validators.required],
                numero: ['', Validators.required],
                bairro: ['', Validators.required],
                cidade: ['', Validators.required],
                uf: ['', Validators.required],
                telefoneContato: ['', Validators.required]
            }),

            credenciais: this.fb.group({
                funcao: ['', Validators.required],
                login: ['', [Validators.required, Validators.minLength(4)]],
                senha: ['', [Validators.required, Validators.minLength(6)]],
                confirmarSenha: ['', [Validators.required]]
            })
        }, { validators: this.senhasIguaisValidator });
    }

    // Validador customizado para confirmar a senha
    senhasIguaisValidator(control: AbstractControl): ValidationErrors | null {
        const senha = control.get('credenciais.senha')?.value;
        const confirmarSenha = control.get('credenciais.confirmarSenha')?.value;

        if (senha && confirmarSenha && senha !== confirmarSenha) {
            return { 'senhasNaoCoincidem': true };
        }
        return null;
    }

    // ViaCEP integration
    buscarCep() {
        let cep = this.cadastroUsuarioForm.get('enderecoLocalizacao.cep')?.value;
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

                    this.cadastroUsuarioForm.get('enderecoLocalizacao')?.patchValue({
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

    formatarCpf(event: any) {
        let input = event.target;
        let valor = input.value.replace(/\D/g, '');

        if (valor.length > 11) {
            valor = valor.substring(0, 11);
        }
        valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
        valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
        valor = valor.replace(/(\d{3})(\d{1,2})$/, '$1-$2');

        input.value = valor;
        this.cadastroUsuarioForm.get('dadosPessoais.cpf')?.setValue(valor, { emitEvent: false });
    }

    formatarTelefone(event: any) {
        let input = event.target;
        let valor = input.value.replace(/\D/g, '');

        if (valor.length > 11) {
            valor = valor.substring(0, 11);
        }

        if (valor.length <= 10) {
            valor = valor.replace(/(\d{2})(\d)/, '($1) $2');
            valor = valor.replace(/(\d{4})(\d)/, '$1-$2');
        } else {
            valor = valor.replace(/(\d{2})(\d)/, '($1) $2');
            valor = valor.replace(/(\d{5})(\d)/, '$1-$2');
        }

        input.value = valor;
        this.cadastroUsuarioForm.get('enderecoLocalizacao.telefoneContato')?.setValue(valor, { emitEvent: false });
    }

    isCampoInvalido(grupo: string, campo: string): boolean {
        const controle = this.cadastroUsuarioForm.get(`${grupo}.${campo}`);
        return !!(controle && controle.invalid && (controle.dirty || controle.touched));
    }

    getGroupName(passo: number): string {
        const grupos = ['dadosPessoais', 'enderecoLocalizacao', 'credenciais'];
        return grupos[passo - 1];
    }

    avancarPasso() {
        const grupoAtual = this.getGroupName(this.passoAtual);
        const formGrupo = this.cadastroUsuarioForm.get(grupoAtual);

        if (formGrupo?.valid) {
            this.passoAtual++;
            this.anunciarParaLeitorDeTela(`Avançou para a etapa ${this.passoAtual}`);
        } else {
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
        if (this.cadastroUsuarioForm.invalid || this.cadastroUsuarioForm.hasError('senhasNaoCoincidem')) {
            this.cadastroUsuarioForm.markAllAsTouched();
            this.anunciarParaLeitorDeTela('Erro. Verifique os campos em vermelho ou senhas não coincidem.');
            return;
        }

        this.isSalvando = true;
        this.mensagemFeedback = '';
        this.anunciarParaLeitorDeTela('Salvando cadastro do usuário, por favor aguarde...');

        const formValues = this.cadastroUsuarioForm.value;
        const payloadBackend = {
            ...formValues.dadosPessoais,
            ...formValues.enderecoLocalizacao,
            // Only send the necessary credentials (not the confirmed password check)
            login: formValues.credenciais.login,
            senha: formValues.credenciais.senha,
            funcao: formValues.credenciais.funcao
        };

        // TODO: Connect this with a real UsuariosService
        // For now, mock successful request
        setTimeout(() => {
            this.exibirFeedback('Usuário cadastrado com sucesso!', 'sucesso');
            this.cadastroUsuarioForm.reset();
            this.passoAtual = 1;
            this.arquivoFotoSelecionado = null;

            // Redirect to list after short delay 
            setTimeout(() => {
                this.router.navigate(['/admin/usuarios']);
            }, 3000);

        }, 1500);
    }

    private exibirFeedback(mensagem: string, tipo: 'sucesso' | 'erro') {
        this.isSalvando = false;
        this.mensagemFeedback = mensagem;
        this.tipoFeedback = tipo;
        this.anunciarParaLeitorDeTela(mensagem);

        if (tipo === 'sucesso') {
            setTimeout(() => this.mensagemFeedback = '', 5000);
        }
    }

    onFileSelected(event: any) {
        const file = event.target.files[0];
        if (file) {
            this.arquivoFotoSelecionado = file;
            this.anunciarParaLeitorDeTela(`Foto de perfil selecionada: ${file.name}`);
        }
    }
}
