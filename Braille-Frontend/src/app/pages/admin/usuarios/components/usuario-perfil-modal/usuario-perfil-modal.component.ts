import { 
  Component, 
  ChangeDetectionStrategy, 
  Input, 
  Output, 
  EventEmitter, 
  inject, 
  signal,
  DestroyRef,
  ElementRef,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { A11yModule } from '@angular/cdk/a11y';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { UsuariosService, Usuario } from '../../../../../core/services/usuarios.service';
import { ConfirmDialogService } from '../../../../../core/services/confirm-dialog.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { AuthService } from '../../../../../core/services/auth.service';

@Component({
  selector: 'app-usuario-perfil-modal',
  standalone: true,
  imports: [CommonModule, A11yModule],
  templateUrl: './usuario-perfil-modal.component.html',
  styleUrl: './usuario-perfil-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsuarioPerfilModalComponent {
  private readonly usuariosService = inject(UsuariosService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  private readonly authConfig = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  // Exposto para a UI checar bloqueio de auto-reset
  readonly loggedUserSub = this.authConfig.getUser()?.sub;

  @ViewChild('dialogPerfil') dialogRef!: ElementRef<HTMLDialogElement>;

  // Input explícito do Model ou nulo se fechado
  @Input() set usuario(val: Usuario | null) {
    this._usuario = val;
    if (val) {
      this.abrirModal();
    } else {
      this.fecharModal(false);
    }
  }
  get usuario(): Usuario | null {
    return this._usuario;
  }
  private _usuario: Usuario | null = null;
  
  @Output() fechar = new EventEmitter<void>();
  @Output() editar = new EventEmitter<Usuario>();
  // Emitido quando foto é alterada ou removida para atualizar a lista Pai
  @Output() atualizado = new EventEmitter<Usuario>();

  readonly salvando = signal(false);

  readonly roles = [
    { value: 'ADMIN', label: 'Administrador' },
    { value: 'SECRETARIA', label: 'Secretaria' },
    { value: 'PROFESSOR', label: 'Professor' },
    { value: 'COMUNICACAO', label: 'Comunicação' }
  ];

  labelRole(role?: string): string {
    if (!role) return '--';
    return this.roles.find(r => r.value === role)?.label ?? role;
  }

  abrirModal(): void {
    const d = this.dialogRef?.nativeElement;
    if (d && !d.open) {
      d.showModal();
    }
  }

  fecharModal(emitEvent = true): void {
    const d = this.dialogRef?.nativeElement;
    if (d && d.open) {
      d.close();
    }
    if (emitEvent) {
      this.fechar.emit();
    }
  }

  onAvatarKeydown(event: Event, fileInput: HTMLInputElement): void {
    event.preventDefault();
    if (!this.salvando()) {
      fileInput.click();
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    const uId = this._usuario?.id;
    if (!file || !uId) return;

    this.salvando.set(true);
    this.usuariosService.uploadFoto(file)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.usuariosService.atualizar(uId, { fotoPerfil: res.url })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: () => {
                this.salvando.set(false);
                if (this._usuario) {
                  this._usuario = { ...this._usuario, fotoPerfil: res.url };
                  this.atualizado.emit(this._usuario);
                }
              },
              error: () => this.handleError()
            });
        },
        error: () => this.handleError()
      });
  }

  async removerFotoAdmin(): Promise<void> {
    const uId = this._usuario?.id;
    if (!uId || !this._usuario?.fotoPerfil) return;
    
    const confirmado = await this.confirmDialog.confirmar({
        titulo: 'Remover Foto',
        mensagem: 'Deseja realmente remover a foto deste perfil?',
        tipo: 'danger',
        textoBotaoConfirmar: 'Remover',
        textoBotaoCancelar: 'Cancelar'
    });
    if (!confirmado) return;

    this.salvando.set(true);
    this.usuariosService.atualizar(uId, { fotoPerfil: null })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.salvando.set(false);
          this.toast.sucesso('Foto removida com sucesso!');
          if (this._usuario) {
            this._usuario = { ...this._usuario, fotoPerfil: null };
            this.atualizado.emit(this._usuario);
          }
        },
        error: () => this.handleError()
      });
  }

  async resetarSenhaAdmin(): Promise<void> {
    const uId = this._usuario?.id;
    if (!uId) return;

    const confirmado = await this.confirmDialog.confirmar({
        titulo: 'Forçar Reset de Senha?',
        mensagem: `A nova senha provisória de ${this._usuario?.nome} será "Ilbes@123". Ele será forçado a criar uma senha segura no primeiro acesso.`,
        textoBotaoConfirmar: 'Confirmar Reset',
        textoBotaoCancelar: 'Cancelar'
    });
    if (!confirmado) return;

    this.salvando.set(true);
    this.usuariosService.resetarSenha(uId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.salvando.set(false);
          this.toast.sucesso('Senha resetada com sucesso para Ilbes@123');
          if (this._usuario) {
            this._usuario = { ...this._usuario, precisaTrocarSenha: true };
            this.atualizado.emit(this._usuario);
          }
        },
        error: (err) => {
          this.salvando.set(false);
          const msg = err.error?.message || 'Erro ao resetar senha.';
          this.toast.erro(typeof msg === 'string' ? msg : msg[0]);
        }
      });
  }

  private handleError(): void {
    this.salvando.set(false);
    this.toast.erro('Falha na operação com o servidor. Verifique a conexão.');
  }
}
