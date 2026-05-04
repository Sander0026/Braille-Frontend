import { Component, ChangeDetectionStrategy, signal, computed, inject, DestroyRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { senhaForteValidator } from '../../../shared/validators/password.validator';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  // ── DIP: injeção explícita via inject() — testável e sem acoplamento ──────
  private readonly fb           = inject(FormBuilder);
  private readonly authService  = inject(AuthService);
  private readonly router       = inject(Router);
  // DestroyRef vincula o ciclo de vida do componente a subscrições fora do constructor
  private readonly destroyRef   = inject(DestroyRef);
  private readonly liveAnnouncer = inject(LiveAnnouncer);

  loginForm:    FormGroup;
  novaSenhaForm: FormGroup;

  // ── Estado Reativo Atômico ─────────────────────────────────────────────────
  erroLogin          = signal<string>('');
  carregando         = signal<boolean>(false);
  precisaTrocarSenha = signal<boolean>(false);
  senhaAntigaTemp    = signal<string>('');
  mostrarSenha       = signal<boolean>(false);
  mostrarNovaSenha   = signal<boolean>(false);
  mostrarConfirmarSenha = signal<boolean>(false);
  senhaAlteradaOk    = signal<boolean>(false); // substitui alert() nativo (inacessível/inacessível a11y)

  private novaSenhaValue = signal<string>('');

  senhaReqs = computed(() => {
    const s = this.novaSenhaValue();
    return [
      { label: 'Pelo menos 8 caracteres',              isValid: s.length >= 8 },
      { label: 'Uma letra maiúscula',                  isValid: /[A-Z]/.test(s) },
      { label: 'Uma letra minúscula',                  isValid: /[a-z]/.test(s) },
      { label: 'Pelo menos um número',                 isValid: /[0-9]/.test(s) },
      { label: 'Um caractere especial (@, !, #, etc.)', isValid: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(s) },
    ];
  });

  constructor() {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      senha:    ['', Validators.required],
    });

    this.novaSenhaForm = this.fb.group({
      novaSenha:      ['', [Validators.required, senhaForteValidator]],
      confirmarSenha: ['', Validators.required],
    }, { validators: this.senhasIguaisValidator });

    // ✅ takeUntilDestroyed() DENTRO do constructor — contexto de injeção válido
    this.novaSenhaForm.get('novaSenha')?.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(v => this.novaSenhaValue.set(v ?? ''));
  }

  // ── Validators ────────────────────────────────────────────────────────────
  senhasIguaisValidator(g: AbstractControl) {
    const form = g as FormGroup;
    return form.get('novaSenha')?.value === form.get('confirmarSenha')?.value
      ? null
      : { mismatch: true };
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  toggleSenha(): void {
    this.mostrarSenha.update(v => !v);
  }

  toggleNovaSenha(): void {
    this.mostrarNovaSenha.update(v => !v);
  }

  toggleConfirmarSenha(): void {
    this.mostrarConfirmarSenha.update(v => !v);
  }

  fazerLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.liveAnnouncer.announce('Preencha os campos obrigatórios para acessar.', 'assertive');
      return;
    }

    this.carregando.set(true);
    this.erroLogin.set('');
    this.senhaAlteradaOk.set(false);
    this.liveAnnouncer.announce('Acessando o sistema...', 'polite');

    const payload = {
      username: (this.loginForm.value.username as string)?.trim(),
      senha:    this.loginForm.value.senha as string,
    };

    // ✅ DestroyRef passado explicitamente — funciona fora do constructor (NG0203 corrigido)
    this.authService.login(payload).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        const user = this.authService.getUser();
        if (user?.precisaTrocarSenha) {
          this.precisaTrocarSenha.set(true);
          this.senhaAntigaTemp.set(payload.senha);
          this.carregando.set(false);
          this.liveAnnouncer.announce('Ação Necessária: Você precisa criar uma nova senha pessoal.', 'assertive');
        } else {
          void this.router.navigate(['/admin']).then(() => {
            this.carregando.set(false);
            this.liveAnnouncer.announce('Login realizado com sucesso. Carregando painel...', 'polite');
          });
        }
      },
      error: (err: HttpErrorResponse) => {
        this.carregando.set(false);
        const errorMsg = this.resolveErrorMessage(err);
        this.erroLogin.set(errorMsg);
        this.liveAnnouncer.announce(`Erro de login: ${errorMsg}`, 'assertive');
      },
    });
  }

  confirmarNovaSenha(): void {
    if (this.novaSenhaForm.invalid) {
      this.novaSenhaForm.markAllAsTouched();
      this.liveAnnouncer.announce('A senha digitada não cumpre os requisitos mínimos ou não coincide.', 'assertive');
      return;
    }

    this.carregando.set(true);
    this.erroLogin.set('');
    this.liveAnnouncer.announce('Salvando nova senha...', 'polite');

    const novaSenha = this.novaSenhaForm.value.novaSenha as string;

    // ✅ DestroyRef passado explicitamente — funciona fora do constructor (NG0203 corrigido)
    this.authService.trocarSenha(this.senhaAntigaTemp(), novaSenha).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.senhaAlteradaOk.set(true);
        this.authService.logout();
        this.precisaTrocarSenha.set(false);
        this.loginForm.reset();
        this.novaSenhaForm.reset();
        this.carregando.set(false);
        this.liveAnnouncer.announce('Senha alterada com sucesso! Faça login novamente com a nova senha.', 'polite');
      },
      error: () => {
        this.carregando.set(false);
        this.erroLogin.set('Erro ao alterar a senha. A senha não atende aos requisitos ou expirou.');
        this.liveAnnouncer.announce('Erro ao alterar a senha.', 'assertive');
      },
    });
  }

  // ── Private Helpers ───────────────────────────────────────────────────────
  /** Resolve a mensagem de erro sem expor stack traces internos ao usuário (OWASP A3). */
  private resolveErrorMessage(err: HttpErrorResponse): string {
    if (err.status === 401 || err.status === 403) {
      const apiMsg = (err.error as { message?: string | string[] })?.message;
      if (typeof apiMsg === 'string') return apiMsg;
      if (Array.isArray(apiMsg))      return apiMsg[0];
      return 'Usuário ou senha incorretos. Verifique e tente novamente.';
    }
    if (err.status === 0) {
      return 'Não foi possível conectar ao servidor. Verifique sua conexão.';
    }
    return 'Ocorreu um erro inesperado. Tente novamente mais tarde.';
  }
}
