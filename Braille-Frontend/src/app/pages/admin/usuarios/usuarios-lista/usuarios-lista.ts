import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { UsuariosService, Usuario } from '../../../../core/services/usuarios.service';
import { ConfirmDialogService } from '../../../../core/services/confirm-dialog.service';

@Component({
    selector: 'app-usuarios-lista',
    standalone: true,
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
    usuarioEmEdicao: Usuario | null = null;
    usuarioVisualizado: Usuario | null = null;
    usuarioParaExcluir: Usuario | null = null;
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

    carregar(): void {
        this.isLoading = true;
        const nome = this.buscaCtrl.value?.trim() || undefined;
        this.usuariosService.listar(this.paginaAtual, this.limite, nome).subscribe({
            next: (res) => {
                this.usuarios = res.data;
                this.total = res.meta.total;
                this.totalPaginas = res.meta.lastPage;
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: () => { this.erro = 'Erro ao carregar usuários.'; this.isLoading = false; this.cdr.detectChanges(); }
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
            next: () => { this.salvando = false; this.fecharModal(); this.carregar(); },
            error: () => { this.salvando = false; this.cdr.detectChanges(); }
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
                this.carregar();
            },
            error: () => {
                this.salvando = false;
                this.cdr.detectChanges();
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
                        this.carregar();
                        this.cdr.detectChanges();
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
                this.cdr.detectChanges();
            },
            error: () => {
                this.salvando = false;
                this.usuarioParaResetar = null;
                this.cdr.detectChanges();
            }
        });
    }
}
