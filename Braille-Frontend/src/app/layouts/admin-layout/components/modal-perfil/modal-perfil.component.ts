import { Component, ChangeDetectionStrategy, EventEmitter, Input, Output, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { A11yModule } from '@angular/cdk/a11y';
import { Subject, takeUntil, finalize } from 'rxjs';
import { AuthService, PerfilUsuario, UserInfo } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-modal-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, A11yModule],
  templateUrl: './modal-perfil.component.html',
  styleUrl: './modal-perfil.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalPerfilComponent implements OnInit, OnDestroy {
  @Input() perfil: PerfilUsuario | null = null;
  @Input() usuario: UserInfo | null = null;
  @Input() fotoPerfil: string | null = null;
  @Input() nomeDisplay: string = '';
  @Input() iniciaisDisplay: string = '';
  @Input() labelCargo: string = '';

  @Output() close = new EventEmitter<void>();
  @Output() action = new EventEmitter<'foto' | 'removerFoto'>();
  @Output() perfilAtualizado = new EventEmitter<PerfilUsuario>();

  formPerfil!: FormGroup;
  perfilErro: string | null = null;
  perfilSucesso = false;
  carregandoPerfil = false;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.inicializarForm();
    if (this.perfil) {
      this.atualizarFormPerfil(this.perfil);
    }
  }

  fecharModal(): void {
    this.close.emit();
  }

  emitAction(tipo: 'foto' | 'removerFoto'): void {
    this.action.emit(tipo);
  }

  private inicializarForm(): void {
    this.formPerfil = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(2)]],
      // OWASP sanitization on emails
      email: ['', [Validators.email]],
    });
  }

  private atualizarFormPerfil(perfil: PerfilUsuario): void {
    this.formPerfil.patchValue({
      nome: perfil.nome ?? '',
      email: perfil.email ?? '',
    });
  }

  salvarPerfil(): void {
    if (this.formPerfil.invalid || this.carregandoPerfil) return;

    // Remove any sensitive properties manually inputted, strictly using sanitized values
    const { nome, email } = this.formPerfil.value;
    
    this.carregandoPerfil = true;
    this.perfilErro = null;

    this.authService.atualizarPerfil({ nome, email: email || undefined })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.carregandoPerfil = false)
      )
      .subscribe({
        next: (p: PerfilUsuario) => {
          this.perfilSucesso = true;
          this.perfilAtualizado.emit(p);
          
          setTimeout(() => {
            this.perfilSucesso = false;
          }, 2500);
        },
        error: (err: any) => {
          this.perfilErro = err?.error?.message ?? 'Erro ao atualizar o perfil. Tente novamente.';
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
