import { Component, OnInit, ChangeDetectionStrategy, signal, inject, DestroyRef, Directive, ElementRef, Input, ViewChildren, QueryList, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FocusKeyManager, FocusableOption, A11yModule, LiveAnnouncer } from '@angular/cdk/a11y';

import { UsuariosService, Usuario } from '../../../../core/services/usuarios.service';
import { ConfirmDialogService } from '../../../../core/services/confirm-dialog.service';
import { ToastService } from '../../../../core/services/toast.service';

import { UsuarioPerfilModalComponent } from '../components/usuario-perfil-modal/usuario-perfil-modal.component';
import { UsuarioFormModalComponent } from '../components/usuario-form-modal/usuario-form-modal.component';

// Acessibilidade WCAG - Tabela Focável
@Directive({
    selector: '[appTabelaTrFocavel]',
    standalone: true
})
export class TabelaTrFocavelDirective implements FocusableOption {
    @Input() disabled = false;
    constructor(public element: ElementRef<HTMLElement>) { }
    focus(): void { this.element.nativeElement.focus(); }
}

@Component({
    selector: 'app-usuarios-lista',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, RouterModule, FormsModule, A11yModule, UsuarioPerfilModalComponent, UsuarioFormModalComponent, TabelaTrFocavelDirective],
    templateUrl: './usuarios-lista.html',
    styleUrl: './usuarios-lista.scss'
})
export class UsuariosLista implements OnInit, AfterViewInit {
    private readonly usuariosService = inject(UsuariosService);
    private readonly confirmDialog = inject(ConfirmDialogService);
    private readonly toast = inject(ToastService);
    private readonly liveAnnouncer = inject(LiveAnnouncer);
    private readonly destroyRef = inject(DestroyRef);

    // Estado da Lista (Signals)
    readonly usuarios = signal<Usuario[]>([]);
    readonly isLoading = signal(true);
    readonly erro = signal('');
    
    // Paginação & Busca
    readonly total = signal(0);
    readonly paginaAtual = signal(1);
    readonly totalPaginas = signal(1);
    readonly limite = 10;
    readonly abaAtiva = signal<'ativos' | 'inativos'>('ativos');

    buscaNome = '';
    private buscaTimeout: any;

    // Estado dos Modais Sub-Components
    readonly usuarioVisualizado = signal<Usuario | null>(null);
    readonly usuarioEmEdicao = signal<Usuario | null>(null);

    // Controle de Acessibilidade
    private trFocusOrigin: HTMLElement | null = null;
    @ViewChildren(TabelaTrFocavelDirective) linhasTabela!: QueryList<TabelaTrFocavelDirective>;
    public keyManager!: FocusKeyManager<TabelaTrFocavelDirective>;

    readonly roles = [
        { value: 'ADMIN', label: 'Administrador' },
        { value: 'SECRETARIA', label: 'Secretaria' },
        { value: 'PROFESSOR', label: 'Professor' },
        { value: 'COMUNICACAO', label: 'Comunicação' }
    ];

    ngOnInit(): void {
        this.carregar();
    }

    ngAfterViewInit(): void {
        this.keyManager = new FocusKeyManager(this.linhasTabela).withWrap();
        this.linhasTabela.changes.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
            this.keyManager.withWrap();
        });
    }

    // Acessibilidade para a tabela list
    @HostListener('keydown', ['$event'])
    onKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape') { return; } // Handled by standard Dialog natively
        
        if (this.keyManager && !this.usuarioEmEdicao() && !this.usuarioVisualizado()) {
            if (['ArrowUp', 'ArrowDown'].includes(event.key)) {
                this.keyManager.onKeydown(event);
                event.preventDefault();
            }
        }
    }

    onBuscarChange(val: string): void {
        clearTimeout(this.buscaTimeout);
        this.buscaTimeout = setTimeout(() => {
            this.buscaNome = val;
            this.paginaAtual.set(1);
            this.carregar();
        }, 400);
    }

    setAba(aba: 'ativos' | 'inativos'): void {
        this.abaAtiva.set(aba);
        this.paginaAtual.set(1);
        this.carregar();
    }

    carregar(): void {
        this.isLoading.set(true);
        const nome = this.buscaNome.trim() || undefined;
        const inativos = this.abaAtiva() === 'inativos';
        
        this.usuariosService.listar(this.paginaAtual(), this.limite, nome, inativos)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (res) => {
                    this.usuarios.set(res.data);
                    this.total.set(res.meta.total);
                    this.totalPaginas.set(res.meta.lastPage);
                    this.isLoading.set(false);
                    this.liveAnnouncer.announce(`Lista atualizada: ${this.total()} registros.`);
                },
                error: () => { 
                    this.erro.set('Erro ao carregar usuários.'); 
                    this.isLoading.set(false);
                }
            });
    }

    irParaPagina(p: number): void {
        const tp = this.totalPaginas();
        if (p < 1 || p > tp) return;
        this.paginaAtual.set(p);
        this.carregar();
    }

    get paginasArray(): number[] {
        return Array.from({ length: this.totalPaginas() }, (_, i) => i + 1);
    }

    labelRole(role: string): string {
        return this.roles.find(r => r.value === role)?.label ?? role;
    }

    // --- Controles de Modais Delegados ---
    abrirPerfil(u: Usuario): void {
        if (!this.usuarioVisualizado() && !this.usuarioEmEdicao()) {
            this.trFocusOrigin = document.activeElement as HTMLElement;
        }
        this.usuarioVisualizado.set(u);
    }

    fecharPerfil(): void {
        this.usuarioVisualizado.set(null);
        if (!this.usuarioEmEdicao()) {
            setTimeout(() => this.trFocusOrigin?.focus(), 50);
        }
    }

    abrirModal(u: Usuario): void {
        if (!this.usuarioVisualizado() && !this.usuarioEmEdicao()) {
            this.trFocusOrigin = document.activeElement as HTMLElement;
        }
        this.usuarioEmEdicao.set(u);
    }

    async tentarFecharSujo(dirty: boolean): Promise<void> {
        if (dirty) {
            const ok = await this.confirmDialog.confirmar({
                titulo: 'Descartar alterações?',
                mensagem: 'Você tem mudanças não salvas. Deseja sair sem salvar?',
                textoBotaoConfirmar: 'Descartar',
                textoBotaoCancelar: 'Continuar editando'
            });
            if (ok) {
                this.usuarioEmEdicao.set(null);
                if (!this.usuarioVisualizado()) setTimeout(() => this.trFocusOrigin?.focus(), 50);
            }
        } else {
            this.usuarioEmEdicao.set(null);
            if (!this.usuarioVisualizado()) setTimeout(() => this.trFocusOrigin?.focus(), 50);
        }
    }

    onFormFechado(): void {
       this.usuarioEmEdicao.set(null);
       if (!this.usuarioVisualizado()) setTimeout(() => this.trFocusOrigin?.focus(), 50);
    }

    onFormAtualizado() {
        this.carregar();
    }

    // --- Ações de Arquivamento/Restore/Delete (Delegados ao Service) ---
    async excluir(usuario: Usuario): Promise<void> {
        const confirmed = await this.confirmDialog.confirmar({
            titulo: 'Inativar Usuário',
            mensagem: `Você está prestes a inativar ${usuario.nome}. Esta ação afeta o login imediato no painel.`,
            textoBotaoConfirmar: 'Sim, inativar',
            tipo: 'danger'
        });
        if (!confirmed) return;

        this.usuariosService.excluir(usuario.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.toast.sucesso('Usuário inativado com sucesso!');
                    this.carregar();
                },
                error: (err) => {
                    const msg = err.error?.message || 'Erro ao inativar usuário.';
                    this.toast.erro(typeof msg === 'string' ? msg : msg[0]);
                }
            });
    }

    async excluirDefinitivamente(usuario: Usuario): Promise<void> {
        const confirmed = await this.confirmDialog.confirmar({
            titulo: 'Apagar Permanentemente?',
            mensagem: `Você está prestes a apagar completamente o usuário ${usuario.nome}. Isso não afeta relatórios onde ele foi tutor, mas removerá o acesso ao sistema.`,
            textoBotaoConfirmar: 'Apagar Registro',
            tipo: 'danger'
        });
        if (!confirmed) return;

        this.usuariosService.excluirDefinitivo(usuario.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.toast.sucesso('Usuário excluído permanentemente.');
                    this.carregar();
                },
                error: (err) => {
                    const msg = err.error?.message || 'Erro ao excluir usuário.';
                    this.toast.erro(typeof msg === 'string' ? msg : msg[0]);
                }
            });
    }

    async restaurarConta(usuario: Usuario): Promise<void> {
        const confirmed = await this.confirmDialog.confirmar({
            titulo: 'Restaurar Acesso',
            mensagem: `${usuario.nome} será reativado e voltará a ter permissão de login no sistema. Confirma?`,
            textoBotaoConfirmar: 'Sim, restaurar'
        });
        if (!confirmed) return;

        this.usuariosService.restaurar(usuario.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.toast.sucesso('Conta restaurada com sucesso.');
                    this.carregar();
                },
                error: (err) => {
                    const msg = err.error?.message || 'Erro ao restaurar usuário.';
                    this.toast.erro(typeof msg === 'string' ? msg : msg[0]);
                }
            });
    }
}
