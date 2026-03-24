import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { A11yModule } from '@angular/cdk/a11y';
import { UsuariosService, CreateUsuarioResponse, ReativacaoResponse } from '../../../../core/services/usuarios.service';
import { BaseFormDescarte } from '../../../../shared/classes/base-form-descarte';

@Component({
    selector: 'app-cadastro-usuario-wizard',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, HttpClientModule, A11yModule],
    templateUrl: './cadastro-usuario-wizard.html',
    styleUrl: './cadastro-usuario-wizard.scss'
})
export class CadastroUsuarioWizard extends BaseFormDescarte implements OnInit {

    passoAtual = 1;
    cadastroUsuarioForm!: FormGroup;
    isSalvando = false;
    mensagemFeedback = '';
    tipoFeedback: 'sucesso' | 'erro' | '' = '';

    // Credenciais geradas após cadastro bem-sucedido
    credenciaisGeradas: { username: string; senha: string } | null = null;

    // Modal de Reativação
    modalReativacao = false;
    dadosReativacao: ReativacaoResponse | null = null;
    _payloadPendente: any = null;

    // Validação CPF em tempo real (blur)
    cpfStatus: 'livre' | 'ativo' | 'inativo' | 'verificando' | 'excluido' | '' = '';
    cpfConflito: { nome: string; matricula: string | null } | null = null;
    modalReaproveitar = false;
    dadosReaproveitar: any = null;

    constructor(
        private fb: FormBuilder,
        private http: HttpClient,
        private router: Router,
        private usuariosService: UsuariosService,
        private cdr: ChangeDetectorRef
    ) {
        super();
    }

    isFormDirty(): boolean {
        if (this.credenciaisGeradas) return false;
        return !!this.cadastroUsuarioForm?.dirty && !this.isSalvando;
    }

    ngOnInit(): void {
        this.iniciarFormulario();
    }

    iniciarFormulario() {
        this.cadastroUsuarioForm = this.fb.group({
            // Passo 1 — Dados Essenciais (obrigatórios)
            dadosPessoais: this.fb.group({
                nomeCompleto: ['', [Validators.required, Validators.minLength(3)]],
                cpf: ['', [Validators.required, Validators.minLength(14)]],
                funcao: ['', Validators.required],
                email: ['', [Validators.email]],
            }),

            // Passo 2 — Contato e Endereço (opcionais)
            contato: this.fb.group({
                telefone: [''],
                cep: [''],
                rua: [''],
                numero: [''],
                complemento: [''],
                bairro: [''],
                cidade: [''],
                uf: [''],
            }),
        });
    }

    // ViaCEP
    buscarCep() {
        let cep = this.cadastroUsuarioForm.get('contato.cep')?.value ?? '';
        cep = cep.replace(/\D/g, '');
        if (cep.length !== 8) return;

        this.http.get<any>(`https://viacep.com.br/ws/${cep}/json/`).subscribe({
            next: (dados) => {
                if (dados.erro) return;
                this.cadastroUsuarioForm.get('contato')?.patchValue({
                    rua: dados.logradouro,
                    bairro: dados.bairro,
                    cidade: dados.localidade,
                    uf: dados.uf
                });
            }
        });
    }

    formatarCpf(event: any) {
        let v = event.target.value.replace(/\D/g, '').substring(0, 11);
        v = v.replace(/(\d{3})(\d)/, '$1.$2');
        v = v.replace(/(\d{3})(\d)/, '$1.$2');
        v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        event.target.value = v;
        this.cadastroUsuarioForm.get('dadosPessoais.cpf')?.setValue(v, { emitEvent: false });
        
        // Limpa erro customizado ao digitar
        if (this.cpfStatus === 'ativo' || this.cpfStatus === 'verificando') {
            this.cpfStatus = '';
            this.cpfConflito = null;
        }
    }

    verificarCpfBlur() {
        const cpfCtrl = this.cadastroUsuarioForm.get('dadosPessoais.cpf');
        const valor = cpfCtrl?.value ?? '';
        const limpo = valor.replace(/\D/g, '');

        if (!limpo || limpo.length !== 11) {
            this.cpfStatus = '';
            this.cpfConflito = null;
            return;
        }

        this.cpfStatus = 'verificando';
        this.cpfConflito = null;
        this.cdr.detectChanges();

        this.usuariosService.verificarCpf(limpo).subscribe({
            next: (res) => {
                this.cpfStatus = res.status;
                if (res.status === 'ativo') {
                    this.cpfConflito = { nome: res.nome, matricula: res.matricula };
                } else if (res.status === 'inativo') {
                    this.dadosReativacao = {
                        _reativacao: true,
                        id: res.id,
                        nome: res.nome,
                        username: res.nome.split(' ')[0].toLowerCase(), // mock
                        statusAtivo: false,
                        excluido: false,
                        message: 'Funcionário inativo encontrado',
                    };
                    this.modalReativacao = true;
                } else if (res.status === 'excluido') {
                    this.dadosReaproveitar = res;
                    this.modalReaproveitar = true;
                }
                this.cdr.detectChanges();
            },
            error: () => {
                this.cpfStatus = '';
                this.cdr.detectChanges();
            }
        });
    }

    formatarTelefone(event: any) {
        let v = event.target.value.replace(/\D/g, '').substring(0, 11);
        v = v.length <= 10
            ? v.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
            : v.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
        event.target.value = v;
        this.cadastroUsuarioForm.get('contato.telefone')?.setValue(v, { emitEvent: false });
    }

    isCampoInvalido(grupo: string, campo: string): boolean {
        const c = this.cadastroUsuarioForm.get(`${grupo}.${campo}`);
        return !!(c && c.invalid && (c.dirty || c.touched));
    }

    avancarPasso() {
        if (this.passoAtual === 1 && this.cpfStatus === 'ativo') {
            return; // Bloqueia avanço se tiver dono
        }

        const grupoNome = this.passoAtual === 1 ? 'dadosPessoais' : 'contato';
        const grupo = this.cadastroUsuarioForm.get(grupoNome);
        if (grupo?.valid) {
            this.passoAtual++;
        } else {
            grupo?.markAllAsTouched();
        }
    }

    voltarPasso() {
        if (this.passoAtual > 1) this.passoAtual--;
    }

    salvarCadastro() {
        if (this.isSalvando) return;

        const dadosPessoais = this.cadastroUsuarioForm.get('dadosPessoais');
        if (dadosPessoais?.invalid) {
            dadosPessoais.markAllAsTouched();
            this.passoAtual = 1;
            return;
        }

        this.isSalvando = true;
        this.mensagemFeedback = '';
        const v = this.cadastroUsuarioForm.value;

        const cpfSomenteNumeros = (v.dadosPessoais.cpf as string).replace(/\D/g, '');

        const sanitize = (str: any) => {
            if (typeof str !== 'string') return str || undefined;
            const trimmed = str.trim();
            return trimmed === '' ? undefined : trimmed;
        };

        const limparSinais = (str: any) => {
            const limpo = sanitize(str);
            return limpo ? limpo.replace(/\D/g, '') : limpo;
        };

        const payload = {
            nome: sanitize(v.dadosPessoais.nomeCompleto)!,
            cpf: cpfSomenteNumeros,
            role: sanitize(v.dadosPessoais.funcao)!,
            email: sanitize(v.dadosPessoais.email),
            telefone: limparSinais(v.contato.telefone),
            cep: limparSinais(v.contato.cep),
            rua: sanitize(v.contato.rua),
            numero: sanitize(v.contato.numero),
            complemento: sanitize(v.contato.complemento),
            bairro: sanitize(v.contato.bairro),
            cidade: sanitize(v.contato.cidade),
            uf: sanitize(v.contato.uf),
        };

        this.usuariosService.criar(payload).subscribe({
            next: (resp) => {
                this.isSalvando = false;

                // Backend retornou sinal de reativação (CPF inativo/excluído)
                if ('_reativacao' in resp && resp._reativacao) {
                    this.dadosReativacao = resp as ReativacaoResponse;
                    this._payloadPendente = payload;
                    this.modalReativacao = true;
                    this.cdr.detectChanges();
                    return;
                }

                // Criação bem-sucedida — exibir credenciais geradas
                const criado = resp as CreateUsuarioResponse;
                this.credenciaisGeradas = {
                    username: criado._credenciais.username,
                    senha: criado._credenciais.senha,
                };
                this.exibirFeedback('Usuário cadastrado com sucesso! Anote as credenciais abaixo.', 'sucesso');
                this.cdr.detectChanges();
            },
            error: (err: HttpErrorResponse) => {
                this.isSalvando = false;
                const msgs = Array.isArray(err.error?.message)
                    ? err.error.message.join(' | ')
                    : err.error?.message;

                const msg = err.status === 409
                    ? 'Já existe um funcionário ativo com este CPF.'
                    : `Erro na validação: ${msgs || 'Falha ao cadastrar. Tente novamente.'}`;
                this.exibirFeedback(msg, 'erro');
                this.cdr.detectChanges();
            },
        });
    }

    // ── Modal Reativação e Reaproveitamento ─────────────────────────────────────────────
    confirmarReativacao() {
        if (!this.dadosReativacao) return;
        this.isSalvando = true;

        this.usuariosService.reativar(this.dadosReativacao.id).subscribe({
            next: (resp) => {
                // Se havia alterações no formulário (payload), poderiamos fazer um patch aqui (Opcional)
                if (this._payloadPendente) {
                    this.usuariosService.atualizar(this.dadosReativacao!.id, this._payloadPendente).subscribe();
                }

                this.isSalvando = false;
                this.modalReativacao = false;
                this.credenciaisGeradas = {
                    username: resp._credenciais.username,
                    senha: resp._credenciais.senha,
                };
                this.exibirFeedback(`Funcionário ${this.dadosReativacao!.nome} reativado com sucesso!`, 'sucesso');
                this.dadosReativacao = null;
                this._payloadPendente = null;
                this.cdr.detectChanges();
            },
            error: () => {
                this.isSalvando = false;
                this.exibirFeedback('Erro ao reativar. Tente novamente.', 'erro');
                this.cdr.detectChanges();
            }
        });
    }

    cancelarReativacao() {
        this.modalReativacao = false;
        this.dadosReativacao = null;
        this._payloadPendente = null;
    }

    confirmarReaproveitar() {
        if (!this.dadosReaproveitar) return;
        
        // Preenche o formulário
        this.cadastroUsuarioForm.patchValue({
            dadosPessoais: {
                nomeCompleto: this.dadosReaproveitar.nome,
                funcao: this.dadosReaproveitar.role || '',
                email: this.dadosReaproveitar.email || '',
            },
            contato: {
                telefone: this.dadosReaproveitar.telefone || '',
                cep: this.dadosReaproveitar.cep || '',
                rua: this.dadosReaproveitar.rua || '',
                numero: this.dadosReaproveitar.numero || '',
                complemento: this.dadosReaproveitar.complemento || '',
                bairro: this.dadosReaproveitar.bairro || '',
                cidade: this.dadosReaproveitar.cidade || '',
                uf: this.dadosReaproveitar.uf || '',
            }
        });
        
        const telefoneEv = { target: { value: this.dadosReaproveitar.telefone || '' } };
        this.formatarTelefone(telefoneEv as any);
        
        // Define cep livre para salvar (causará reactivate nativamente na submissão)
        this.cpfStatus = 'livre';
        this.modalReaproveitar = false;
        
        this.exibirFeedback('Os dados antigos foram restaurados. Edite conforme a necessidade.', 'sucesso');
    }

    cancelarReaproveitar() {
        this.modalReaproveitar = false;
        this.dadosReaproveitar = null;
        this.cadastroUsuarioForm.get('dadosPessoais.cpf')?.setValue('');
        this.cpfStatus = '';
    }

    irParaLista() {
        this.router.navigate(['/admin/usuarios']);
    }

    private exibirFeedback(mensagem: string, tipo: 'sucesso' | 'erro') {
        this.isSalvando = false;
        this.mensagemFeedback = mensagem;
        this.tipoFeedback = tipo;
        if (tipo === 'sucesso') {
            setTimeout(() => this.mensagemFeedback = '', 10000);
        }
    }
}
