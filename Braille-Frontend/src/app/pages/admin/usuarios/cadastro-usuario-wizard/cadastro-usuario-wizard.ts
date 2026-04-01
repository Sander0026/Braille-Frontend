import { Component, OnInit, ChangeDetectionStrategy, signal, inject, DestroyRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { A11yModule, LiveAnnouncer } from '@angular/cdk/a11y';

import { UsuariosService, CreateUsuarioResponse, ReativacaoResponse } from '../../../../core/services/usuarios.service';
import { BaseFormDescarte } from '../../../../shared/classes/base-form-descarte';

@Component({
    selector: 'app-cadastro-usuario-wizard',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, A11yModule],
    templateUrl: './cadastro-usuario-wizard.html',
    styleUrl: './cadastro-usuario-wizard.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CadastroUsuarioWizard extends BaseFormDescarte implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly http = inject(HttpClient);
    private readonly router = inject(Router);
    private readonly usuariosService = inject(UsuariosService);
    private readonly liveAnnouncer = inject(LiveAnnouncer);
    private readonly destroyRef = inject(DestroyRef);

    // Estado reativo via Signals
    readonly passoAtual = signal(1);
    readonly isSalvando = signal(false);
    
    // Feedback 
    readonly mensagemFeedback = signal('');
    readonly tipoFeedback = signal<'sucesso' | 'erro' | ''>('');
    
    readonly credenciaisGeradas = signal<{ username: string; senha: string } | null>(null);

    // Modais e Conflitos Internos (Signals)
    readonly modalReativacaoAberto = signal(false);
    readonly dadosReativacao = signal<ReativacaoResponse | null>(null);
    private _payloadPendente: any = null;

    readonly cpfStatus = signal<'livre' | 'ativo' | 'inativo' | 'verificando' | 'excluido' | ''>('');
    readonly cpfConflito = signal<{ nome: string; matricula: string | null } | null>(null);
    readonly modalReaproveitarAberto = signal(false);
    readonly dadosReaproveitar = signal<any>(null);

    cadastroUsuarioForm!: FormGroup;

    override isFormDirty(): boolean {
        if (this.credenciaisGeradas()) return false;
        return !!this.cadastroUsuarioForm?.dirty && !this.isSalvando();
    }

    ngOnInit(): void {
        this.cadastroUsuarioForm = this.fb.group({
            dadosPessoais: this.fb.group({
                nomeCompleto: ['', [Validators.required, Validators.minLength(3)]],
                cpf: ['', [Validators.required, Validators.minLength(14)]],
                funcao: ['', Validators.required],
                email: ['', [Validators.email]],
            }),
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

    buscarCep() {
        let cep = this.cadastroUsuarioForm.get('contato.cep')?.value ?? '';
        cep = cep.replace(/\D/g, '');
        if (cep.length !== 8) return;

        this.liveAnnouncer.announce('Buscando CEP para auto-preencher endereço...');
        this.http.get<any>(`https://viacep.com.br/ws/${cep}/json/`)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (dados) => {
                    if (dados.erro) {
                        this.exibirFeedback('CEP não encontrado.', 'erro');
                        return;
                    }
                    this.cadastroUsuarioForm.get('contato')?.patchValue({
                        rua: dados.logradouro,
                        bairro: dados.bairro,
                        cidade: dados.localidade,
                        uf: dados.uf
                    });
                    this.liveAnnouncer.announce('Endereço completado automaticamente via CEP');
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
        
        const currStatus = this.cpfStatus();
        if (currStatus === 'ativo' || currStatus === 'verificando') {
            this.cpfStatus.set('');
            this.cpfConflito.set(null);
        }
    }

    verificarCpfBlur() {
        const valor = this.cadastroUsuarioForm.get('dadosPessoais.cpf')?.value ?? '';
        const limpo = valor.replace(/\D/g, '');

        if (!limpo || limpo.length !== 11) {
            this.cpfStatus.set('');
            this.cpfConflito.set(null);
            return;
        }

        this.cpfStatus.set('verificando');
        this.cpfConflito.set(null);

        this.usuariosService.verificarCpf(limpo)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (res) => {
                    this.cpfStatus.set(res.status as any);
                    if (res.status === 'ativo') {
                        this.cpfConflito.set({ nome: res.nome, matricula: res.matricula });
                    } else if (res.status === 'inativo') {
                        this.dadosReativacao.set({
                            _reativacao: true,
                            id: res.id,
                            nome: res.nome,
                            username: res.nome.split(' ')[0].toLowerCase(), 
                            statusAtivo: false,
                            excluido: false,
                            message: 'Funcionário inativo encontrado',
                        });
                        this.modalReativacaoAberto.set(true);
                    } else if (res.status === 'excluido') {
                        this.dadosReaproveitar.set(res);
                        this.modalReaproveitarAberto.set(true);
                    }
                },
                error: () => this.cpfStatus.set('')
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
        if (this.passoAtual() === 1 && this.cpfStatus() === 'ativo') {
            return; 
        }

        const grupoNome = this.passoAtual() === 1 ? 'dadosPessoais' : 'contato';
        const grupo = this.cadastroUsuarioForm.get(grupoNome);
        if (grupo?.valid) {
            this.passoAtual.update(v => v + 1);
            this.liveAnnouncer.announce(`Avançado para a etapa ${this.passoAtual()}`);
        } else {
            grupo?.markAllAsTouched();
            this.liveAnnouncer.announce('Existem erros no formulário que impedem o avanço.');
        }
    }

    voltarPasso() {
        if (this.passoAtual() > 1) {
            this.passoAtual.update(v => v - 1);
            this.liveAnnouncer.announce('Voltando para preencher os dados essenciais.');
        }
    }

    salvarCadastro() {
        if (this.isSalvando()) return;

        const dadosPessoais = this.cadastroUsuarioForm.get('dadosPessoais');
        if (dadosPessoais?.invalid) {
            dadosPessoais.markAllAsTouched();
            this.passoAtual.set(1);
            return;
        }

        this.isSalvando.set(true);
        this.mensagemFeedback.set('');
        
        const v = this.cadastroUsuarioForm.getRawValue();
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

        this.usuariosService.criar(payload)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (resp) => {
                    this.isSalvando.set(false);

                    if ('_reativacao' in resp && resp._reativacao && 'id' in resp && 'nome' in resp && 'username' in resp && 'message' in resp && 'excluido' in resp) {
                        this.dadosReativacao.set(resp as ReativacaoResponse);
                        this._payloadPendente = payload;
                        this.modalReativacaoAberto.set(true);
                        return;
                    }

                    const criado = resp as CreateUsuarioResponse;
                    if(criado && criado._credenciais){
                        this.credenciaisGeradas.set({
                            username: criado._credenciais.username,
                            senha: criado._credenciais.senha,
                        });
                        this.exibirFeedback('Usuário cadastrado com sucesso! Anote as credenciais abaixo.', 'sucesso');
                    }
                },
                error: (err: HttpErrorResponse) => {
                    this.isSalvando.set(false);
                    const msgs = Array.isArray(err.error?.message)
                        ? err.error.message.join(' | ')
                        : err.error?.message;

                    const msg = err.status === 409
                        ? 'Já existe um funcionário ativo com este CPF.'
                        : `Erro na validação: ${msgs || 'Falha ao cadastrar. Tente novamente.'}`;
                    this.exibirFeedback(msg, 'erro');
                },
            });
    }

    // --- Modal Reativação ---
    confirmarReativacao() {
        const dados = this.dadosReativacao();
        if (!dados) return;

        this.isSalvando.set(true);
        this.usuariosService.reativar(dados.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (resp) => {
                    if (this._payloadPendente) {
                        this.usuariosService.atualizar(dados.id, this._payloadPendente)
                            .pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
                    }

                    this.isSalvando.set(false);
                    this.modalReativacaoAberto.set(false);
                    
                    if(resp && resp._credenciais){
                        this.credenciaisGeradas.set({
                            username: resp._credenciais.username,
                            senha: resp._credenciais.senha,
                        });
                        this.exibirFeedback(`Funcionário ${dados.nome} reativado com sucesso!`, 'sucesso');
                    }
                    this.dadosReativacao.set(null);
                    this._payloadPendente = null;
                },
                error: () => {
                    this.isSalvando.set(false);
                    this.exibirFeedback('Erro ao reativar. Tente novamente.', 'erro');
                }
            });
    }

    cancelarReativacao() {
        this.modalReativacaoAberto.set(false);
        this.dadosReativacao.set(null);
        this._payloadPendente = null;
    }

    // --- Modal Reaproveitar ---
    confirmarReaproveitar() {
        const dados = this.dadosReaproveitar();
        if (!dados) return;
        
        this.cadastroUsuarioForm.patchValue({
            dadosPessoais: {
                nomeCompleto: dados.nome,
                funcao: dados.role || '',
                email: dados.email || '',
            },
            contato: {
                telefone: dados.telefone || '',
                cep: dados.cep || '',
                rua: dados.rua || '',
                numero: dados.numero || '',
                complemento: dados.complemento || '',
                bairro: dados.bairro || '',
                cidade: dados.cidade || '',
                uf: dados.uf || '',
            }
        });
        
        const telefoneEv = { target: { value: dados.telefone || '' } };
        this.formatarTelefone(telefoneEv as any);
        
        this.cpfStatus.set('livre');
        this.modalReaproveitarAberto.set(false);
        
        this.exibirFeedback('Os dados antigos foram restaurados. Edite conforme a necessidade.', 'sucesso');
    }

    cancelarReaproveitar() {
        this.modalReaproveitarAberto.set(false);
        this.dadosReaproveitar.set(null);
        this.cadastroUsuarioForm.get('dadosPessoais.cpf')?.setValue('');
        this.cpfStatus.set('');
    }

    irParaLista() {
        this.router.navigate(['/admin/usuarios']);
    }

    private exibirFeedback(mensagem: string, tipo: 'sucesso' | 'erro') {
        this.mensagemFeedback.set(mensagem);
        this.tipoFeedback.set(tipo);
        if (tipo === 'sucesso') {
            setTimeout(() => this.mensagemFeedback.set(''), 10000);
        }
        this.liveAnnouncer.announce(mensagem, 'assertive');
    }
}
