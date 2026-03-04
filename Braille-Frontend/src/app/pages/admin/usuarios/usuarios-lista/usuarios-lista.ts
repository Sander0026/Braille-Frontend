import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { UsuariosService, Usuario } from '../../../../core/services/usuarios.service';
import { ConfirmDialogService } from '../../../../core/services/confirm-dialog.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
    selector: 'app-usuarios-lista',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, RouterModule, ReactiveFormsModule],
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

    private destroy$ = new Subject<void>();

    readonly roles = [
        { value: 'ADMIN', label: 'Administrador' },
        { value: 'SECRETARIA', label: 'Secretaria' },
        { value: 'PROFESSOR', label: 'Professor' }
    ];

    constructor(
        private usuariosService: UsuariosService,
        private fb: FormBuilder,
        private cdr: ChangeDetectorRef,
        private confirmDialog: ConfirmDialogService,
        private toast: ToastService
    ) {
        this.editForm = this.fb.group({
            nome: ['', [Validators.required, Validators.minLength(3)]],
            username: ['', [Validators.required, Validators.minLength(3)]],
            email: ['', [Validators.required, Validators.email]],
            role: ['', Validators.required]
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
            },
            error: () => { this.erro = 'Erro ao carregar usuários.'; this.isLoading = false; this.cdr.markForCheck(); }
        });
    }

    abrirPerfil(usuario: Usuario): void {
        this.usuarioVisualizado = usuario;
    }

    fecharPerfil(): void {
        this.usuarioVisualizado = null;
    }

    abrirModal(usuario: Usuario): void {
        this.usuarioEmEdicao = usuario;
        // Primeiro define o usuario, depois popula o form e força detecção de mudanças
        // (necessário por conta do withFetch() que roda fora do Zone.js)
        Promise.resolve().then(() => {
            this.editForm.patchValue({
                nome: usuario.nome,
                username: usuario.username,
                email: usuario.email,
                role: usuario.role
            });
            this.cdr.markForCheck();
            this.cdr.detectChanges();
        });
    }

    fecharModal(): void {
        this.usuarioEmEdicao = null;
        this.editForm.reset();
    }

    salvar(): void {
        if (this.editForm.invalid || !this.usuarioEmEdicao) return;
        this.salvando = true;
        this.usuariosService.atualizar(this.usuarioEmEdicao.id, this.editForm.value).subscribe({
            next: () => {
                this.salvando = false;
                this.fecharModal();
                this.toast.sucesso('Usuário editado com sucesso!');
                setTimeout(() => this.carregar(), 0);
            },
            error: () => {
                this.salvando = false;
                this.toast.erro('Erro ao editar usuário.');
                this.cdr.markForCheck();
            }
        });
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
            error: () => {
                this.salvando = false;
                this.toast.erro('Erro ao inativar usuário.');
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
            error: () => {
                this.salvando = false;
                this.toast.erro('Erro ao excluir usuário definitivamente.');
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
            error: () => {
                this.salvando = false;
                this.toast.erro('Erro ao restaurar usuário.');
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
            error: () => {
                this.salvando = false;
                this.usuarioParaResetar = null;
                this.toast.erro('Erro ao resetar senha.');
                this.cdr.markForCheck();
            }
        });
    }
}
