import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { FocusKeyManager, FocusableOption, A11yModule, LiveAnnouncer } from '@angular/cdk/a11y';
import { Directive, ElementRef, HostListener, Input, ViewChildren, QueryList, AfterViewInit } from '@angular/core';
import { UsuariosService, Usuario } from '../../../../core/services/usuarios.service';
import { ConfirmDialogService } from '../../../../core/services/confirm-dialog.service';
import { ToastService } from '../../../../core/services/toast.service';


@Directive({
    selector: '[appTabelaTrFocavel]',
    standalone: true
})
export class TabelaTrFocavelDirective implements FocusableOption {
    @Input() disabled = false;

    constructor(public element: ElementRef<HTMLElement>) { }

    focus(): void {
        this.element.nativeElement.focus();
    }
}

@Component({
    selector: 'app-usuarios-lista',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, A11yModule],
    templateUrl: './usuarios-lista.html',
    styleUrl: './usuarios-lista.scss'
})
export class UsuariosLista implements OnInit, OnDestroy {
    usuarios: Usuario[] = [];
    isLoading = true;
    erro = '';
    total = 0;
    paginaAtual = 1;
    totalPaginas = 1;
    readonly limite = 10;

    buscaCtrl = new FormControl('');
    abaAtiva: 'ativos' | 'inativos' = 'ativos';
    usuarioEmEdicao: Usuario | null = null;
    usuarioVisualizado: Usuario | null = null;
    usuarioParaExcluir: Usuario | null = null;
    usuarioParaExcluirDefinitivo: Usuario | null = null;
    usuarioParaRestaurar: Usuario | null = null;
    usuarioParaResetar: Usuario | null = null;
    editForm!: FormGroup;
    salvando = false;

    // Acessibilidade: WCAG 2.4.3
    lastFocusBeforeModal: HTMLElement | null = null;

    // ── KeyManager ─────────────────────────────────────────────
    @ViewChildren(TabelaTrFocavelDirective) linhasTabela!: QueryList<TabelaTrFocavelDirective>;
    public keyManager!: FocusKeyManager<TabelaTrFocavelDirective>;

    private destroy$ = new Subject<void>();

    readonly roles = [
        { value: 'ADMIN', label: 'Administrador' },
        { value: 'SECRETARIA', label: 'Secretaria' },
        { value: 'PROFESSOR', label: 'Professor' },
        { value: 'COMUNICACAO', label: 'Comunicação' }
    ];

    constructor(
        private usuariosService: UsuariosService,
        private fb: FormBuilder,
        private cdr: ChangeDetectorRef,
        private confirmDialog: ConfirmDialogService,
        private toast: ToastService,
        private liveAnnouncer: LiveAnnouncer,
        private http: HttpClient
    ) {
        this.editForm = this.fb.group({
            nome: ['', [Validators.required, Validators.minLength(3)]],
            cpf: ['', [Validators.required, Validators.minLength(14)]],
            email: ['', [Validators.email]],
            role: ['', Validators.required],
            telefone: [''],
            cep: [''],
            rua: [''],
            numero: [''],
            complemento: [''],
            bairro: [''],
            cidade: [''],
            uf: ['', [Validators.maxLength(2)]],
        });

    }

    ngOnInit(): void {
        this.buscaCtrl.valueChanges.pipe(
            debounceTime(400),
            distinctUntilChanged(),
            takeUntil(this.destroy$)
        ).subscribe(() => { this.paginaAtual = 1; this.carregar(); });

        this.carregar();
    }

    ngAfterViewInit(): void {
        this.keyManager = new FocusKeyManager(this.linhasTabela).withWrap();
        this.linhasTabela.changes.subscribe(() => {
            this.keyManager.withWrap();
        });
    }

    @HostListener('keydown', ['$event'])
    onKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            if (this.usuarioEmEdicao) {
                this.fecharModal();
                event.preventDefault();
            } else if (this.usuarioVisualizado) {
                this.fecharPerfil();
                event.preventDefault();
            }
            return;
        }

        if (this.keyManager && !this.usuarioEmEdicao && !this.usuarioVisualizado && !this.usuarioParaExcluir && !this.usuarioParaExcluirDefinitivo && !this.usuarioParaRestaurar && !this.usuarioParaResetar) {
            if (['ArrowUp', 'ArrowDown'].includes(event.key)) {
                this.keyManager.onKeydown(event);
                event.preventDefault();
            }
        }
    }

    ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

    setAba(aba: 'ativos' | 'inativos'): void {
        this.abaAtiva = aba;
        this.paginaAtual = 1;
        this.carregar();
    }

    carregar(): void {
        this.isLoading = true;
        const nome = this.buscaCtrl.value?.trim() || undefined;
        const inativos = this.abaAtiva === 'inativos';
        this.usuariosService.listar(this.paginaAtual, this.limite, nome, inativos).subscribe({
            next: (res) => {
                this.usuarios = res.data;
                this.total = res.meta.total;
                this.totalPaginas = res.meta.lastPage;
                this.isLoading = false;
                this.cdr.markForCheck();
                this.liveAnnouncer.announce(`Lista de usuários atualizada: ${this.total} encontrados.`);
            },
            error: () => { this.erro = 'Erro ao carregar usuários.'; this.isLoading = false; this.cdr.markForCheck(); }
        });
    }

    abrirPerfil(usuario: Usuario): void {
        this.lastFocusBeforeModal = document.activeElement as HTMLElement;
        this.usuarioVisualizado = usuario;
    }

    fecharPerfil(): void {
        this.usuarioVisualizado = null;
        setTimeout(() => this.lastFocusBeforeModal?.focus(), 0);
    }

    abrirModal(usuario: Usuario): void {
        this.lastFocusBeforeModal = document.activeElement as HTMLElement;
        this.usuarioEmEdicao = usuario;
        // Primeiro define o usuario, depois popula o form e força detecção de mudanças
        // (necessário por conta do withFetch() que roda fora do Zone.js)
        Promise.resolve().then(() => {
            const telFormated = usuario.telefone
                ? usuario.telefone.replace(/\D/g, '').length <= 10
                    ? usuario.telefone.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
                    : usuario.telefone.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
                : '';

            this.editForm.patchValue({
                nome: usuario.nome,
                cpf: usuario.cpf ? usuario.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : '',
                email: usuario.email ?? '',
                role: usuario.role,
                telefone: telFormated,
                cep: usuario.cep ?? '',
                rua: usuario.rua ?? '',
                numero: usuario.numero ?? '',
                complemento: usuario.complemento ?? '',
                bairro: usuario.bairro ?? '',
                cidade: usuario.cidade ?? '',
                uf: usuario.uf ?? '',
            });



            this.cdr.markForCheck();
            this.cdr.detectChanges();
        });
    }

    async fecharModal(forcar = false): Promise<void> {
        if (!forcar && this.editForm.dirty && !this.salvando) {
            const ok = await this.confirmDialog.confirmar({
                titulo: 'Sair sem salvar?',
                mensagem: 'Você tem alterações não salvas. Se sair agora, todos os dados preenchidos serão perdidos.',
                textoBotaoConfirmar: 'Sair e perder dados',
                textoBotaoCancelar: 'Continuar editando',
                tipo: 'warning'
            });
            if (!ok) return;
        }
        this.usuarioEmEdicao = null;
        this.editForm.reset();
        setTimeout(() => this.lastFocusBeforeModal?.focus(), 0);
    }

    cpfStatus: 'livre' | 'ativo' | 'inativo' | 'verificando' | 'excluido' | '' = '';
    cpfConflito: { nome: string; matricula: string | null } | null = null;

    formatarCpf(event: any) {
        let v = event.target.value.replace(/\D/g, '').substring(0, 11);
        v = v.replace(/(\d{3})(\d)/, '$1.$2');
        v = v.replace(/(\d{3})(\d)/, '$1.$2');
        v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        event.target.value = v;
        this.editForm.get('cpf')?.setValue(v, { emitEvent: false });
        
        if (this.cpfStatus && this.cpfStatus !== 'livre') {
            this.cpfStatus = '';
            this.cpfConflito = null;
        }
    }

    formatarTelefone(event: any) {
        let v = event.target.value.replace(/\D/g, '').substring(0, 11);
        v = v.length <= 10
            ? v.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
            : v.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
        event.target.value = v;
        this.editForm.get('telefone')?.setValue(v, { emitEvent: false });
    }

    verificarCpfBlur() {
        const valor = this.editForm.get('cpf')?.value ?? '';
        const limpo = valor.replace(/\D/g, '');

        if (!limpo || limpo.length !== 11) {
            this.cpfStatus = '';
            this.cpfConflito = null;
            return;
        }

        // Se é o mesmo CPF do próprio usuário sendo editado, é válido
        if (this.usuarioEmEdicao?.cpf === limpo) {
            this.cpfStatus = 'livre';
            this.cpfConflito = null;
            return;
        }

        this.cpfStatus = 'verificando';
        this.cpfConflito = null;
        this.cdr.detectChanges();

        this.usuariosService.verificarCpf(limpo).subscribe({
            next: (res) => {
                if (res.status === 'livre' || res.id === this.usuarioEmEdicao?.id) {
                    this.cpfStatus = 'livre';
                } else {
                    // CPF já cadastrado para outra pessoa
                    this.cpfStatus = res.status as any;
                    this.cpfConflito = { nome: res.nome, matricula: res.matricula };
                }
                this.cdr.detectChanges();
            },
            error: () => {
                this.cpfStatus = '';
                this.cdr.detectChanges();
            }
        });
    }

    salvar(): void {
        const cpfLimpo = this.editForm.get('cpf')?.value?.replace(/\D/g, '');
        if (this.editForm.invalid || !this.usuarioEmEdicao || (this.cpfStatus && this.cpfStatus !== 'livre' && cpfLimpo !== this.usuarioEmEdicao.cpf)) {
            this.editForm.markAllAsTouched();
            return;
        }
        
        this.salvando = true;

        const rawVal = this.editForm.value;
        const payload = {
            ...rawVal,
            telefone: rawVal.telefone ? rawVal.telefone.replace(/\D/g, '') : rawVal.telefone,
            cep: rawVal.cep ? rawVal.cep.replace(/\D/g, '') : rawVal.cep
        };

        this.usuariosService.atualizar(this.usuarioEmEdicao.id, payload).subscribe({
            next: () => {
                this.salvando = false;
                this.fecharModal(true);
                this.toast.sucesso('Usuário editado com sucesso!');
                setTimeout(() => this.carregar(), 0);
            },
            error: (err) => {
                this.salvando = false;
                const msg = err.error?.message || 'Erro ao editar usuário.';
                this.toast.erro(typeof msg === 'string' ? msg : msg[0]);
                this.cdr.markForCheck();
            }
        });
    }

    buscarCep(): void {
        let cep = this.editForm.get('cep')?.value;
        if (!cep) return;
        cep = cep.replace(/\D/g, '');
        if (cep.length === 8) {
            this.liveAnnouncer.announce('Buscando endereço pelo CEP...');
            this.http.get(`https://viacep.com.br/ws/${cep}/json/`).subscribe({
                next: (dados: any) => {
                    if (dados.erro) {
                        this.toast.erro('CEP não encontrado.');
                        this.liveAnnouncer.announce('CEP não encontrado. Verifique a digitação.');
                    } else {
                        this.editForm.patchValue({
                            rua: dados.logradouro,
                            bairro: dados.bairro,
                            cidade: dados.localidade,
                            uf: dados.uf
                        });
                        this.liveAnnouncer.announce('Endereço preenchido automaticamente.');
                        this.cdr.markForCheck();
                    }
                },
                error: () => {
                    this.toast.erro('Erro ao buscar o CEP.');
                    this.liveAnnouncer.announce('Erro ao conectar com o serviço de CEP.');
                    this.cdr.markForCheck();
                }
            });
        }
    }

    excluir(usuario: Usuario): void {
        this.usuarioParaExcluir = usuario;
    }

    cancelarExclusao(): void {
        this.usuarioParaExcluir = null;
    }

    confirmarExclusao(): void {
        if (!this.usuarioParaExcluir) return;
        this.salvando = true;
        this.usuariosService.excluir(this.usuarioParaExcluir.id).subscribe({
            next: () => {
                this.salvando = false;
                this.usuarioParaExcluir = null;
                this.toast.sucesso('Usuário inativado com sucesso!');
                setTimeout(() => this.carregar(), 0);
            },
            error: (err) => {
                this.salvando = false;
                const msg = err.error?.message || 'Erro ao inativar usuário.';
                this.toast.erro(typeof msg === 'string' ? msg : msg[0]);
                this.cdr.markForCheck();
            }
        });
    }

    // --- Hard Delete ---
    excluirDefinitivamente(usuario: Usuario): void {
        this.usuarioParaExcluirDefinitivo = usuario;
    }

    cancelarExclusaoDefinitiva(): void {
        this.usuarioParaExcluirDefinitivo = null;
    }

    confirmarExclusaoDefinitiva(): void {
        if (!this.usuarioParaExcluirDefinitivo) return;
        this.salvando = true;
        this.usuariosService.excluirDefinitivo(this.usuarioParaExcluirDefinitivo.id).subscribe({
            next: () => {
                this.salvando = false;
                this.usuarioParaExcluirDefinitivo = null;
                this.toast.sucesso('Usuário excluído definitivamente.');
                setTimeout(() => this.carregar(), 0);
            },
            error: (err) => {
                this.salvando = false;
                const msg = err.error?.message || 'Erro ao excluir usuário definitivamente.';
                this.toast.erro(typeof msg === 'string' ? msg : msg[0]);
                this.cdr.markForCheck();
            }
        });
    }

    // --- Restauração ---
    restaurarConta(usuario: Usuario): void {
        this.usuarioParaRestaurar = usuario;
    }

    cancelarRestauracao(): void {
        this.usuarioParaRestaurar = null;
    }

    confirmarRestauracao(): void {
        if (!this.usuarioParaRestaurar) return;
        this.salvando = true;
        this.usuariosService.restaurar(this.usuarioParaRestaurar.id).subscribe({
            next: () => {
                this.salvando = false;
                this.usuarioParaRestaurar = null;
                this.toast.sucesso('Conta de usuário restaurada.');
                setTimeout(() => this.carregar(), 0);
            },
            error: (err) => {
                this.salvando = false;
                const msg = err.error?.message || 'Erro ao restaurar usuário.';
                this.toast.erro(typeof msg === 'string' ? msg : msg[0]);
                this.cdr.markForCheck();
            }
        });
    }

    labelRole(role: string): string {
        return this.roles.find(r => r.value === role)?.label ?? role;
    }

    irParaPagina(p: number): void {
        if (p < 1 || p > this.totalPaginas) return;
        this.paginaAtual = p;
        this.carregar();
    }

    get paginas(): number[] {
        return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
    }

    // --- Novas Ações de Perfil ---
    onFileSelected(event: any): void {
        const file = event.target.files?.[0];
        if (!file || !this.usuarioVisualizado) return;

        this.usuariosService.uploadFoto(file).subscribe({
            next: (res) => {
                const url = res.url;
                if (!this.usuarioVisualizado) return;

                this.usuariosService.atualizar(this.usuarioVisualizado.id, { fotoPerfil: url }).subscribe({
                    next: () => {
                        if (this.usuarioVisualizado) this.usuarioVisualizado.fotoPerfil = url;
                        setTimeout(() => this.carregar(), 0);
                        this.cdr.markForCheck();
                    },
                    error: () => { this.cdr.detectChanges(); }
                });
            },
            error: () => { this.cdr.detectChanges(); }
        });
    }

    resetarSenhaAdmin(): void {
        if (!this.usuarioVisualizado) return;
        this.usuarioParaResetar = this.usuarioVisualizado;
    }

    cancelarReset(): void {
        this.usuarioParaResetar = null;
    }

    confirmarResetSenha(): void {
        if (!this.usuarioParaResetar) return;

        this.salvando = true;
        this.usuariosService.resetarSenha(this.usuarioParaResetar.id).subscribe({
            next: () => {
                this.salvando = false;
                this.usuarioParaResetar = null;
                this.toast.sucesso('Senha resetada com sucesso para Ilbes@123');
                this.cdr.markForCheck();
            },
            error: (err) => {
                this.salvando = false;
                this.usuarioParaResetar = null;
                const msg = err.error?.message || 'Erro ao resetar senha.';
                this.toast.erro(typeof msg === 'string' ? msg : msg[0]);
                this.cdr.markForCheck();
            }
        });
    }
}
