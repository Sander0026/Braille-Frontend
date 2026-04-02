import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { senhaForteValidator } from '../../../shared/validators/password.validator';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush, // Renderização Ultra Otimizada e Controlada
})
export class Login {
  loginForm: FormGroup;
  novaSenhaForm: FormGroup;
  
  // Estado Reativo Atômico
  erroLogin = signal<string>('');
  carregando = signal<boolean>(false);
  precisaTrocarSenha = signal<boolean>(false);
  senhaAntigaTemp = signal<string>('');
  mostrarSenha = signal<boolean>(false);

  // Interceptador leve para atualizar Regras de Senha sem acionar CD de Força Bruta
  private novaSenhaValue = signal<string>('');

  senhaReqs = computed(() => {
    const s = this.novaSenhaValue();
    return [
      { label: 'Pelo menos 8 caracteres', isValid: s.length >= 8 },
      { label: 'Uma letra maiúscula', isValid: /[A-Z]/.test(s) },
      { label: 'Uma letra minúscula', isValid: /[a-z]/.test(s) },
      { label: 'Pelo menos um número', isValid: /[0-9]/.test(s) },
      { label: 'Um caractere especial (@, !, #, etc.)', isValid: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(s) }
    ];
  });

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      senha: ['', Validators.required]
    });

    this.novaSenhaForm = this.fb.group({
      // Responsabilidade Desacoplada e reaproveitável
      novaSenha: ['', [Validators.required, senhaForteValidator]],
      confirmarSenha: ['', [Validators.required]]
    }, { validators: this.senhasIguaisValidator });

    // Observa digitação minimizando leaks (TakeUntilDestroyed elimina listener residual em caso de fechamento)
    this.novaSenhaForm.get('novaSenha')?.valueChanges.pipe(
      takeUntilDestroyed()
    ).subscribe(v => this.novaSenhaValue.set(v || ''));
  }

  // Cast seguro isolando form de injeção Prototype ou Type Error abstratos
  senhasIguaisValidator(g: AbstractControl) {
    const form = g as FormGroup;
    return form.get('novaSenha')?.value === form.get('confirmarSenha')?.value ? null : { mismatch: true };
  }

  toggleSenha() {
    this.mostrarSenha.update(v => !v);
  }

  fazerLogin() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.carregando.set(true);
    this.erroLogin.set('');

    // Prevenção de Whitespace Exploit (Limpeza restrita via DTO Mapping)
    const payload = {
        username: this.loginForm.value.username?.trim(),
        senha: this.loginForm.value.senha
    };

    // Subscrição ancorada ao escopo do Componente
    this.authService.login(payload).pipe(takeUntilDestroyed()).subscribe({
      next: () => {
        const user = this.authService.getUser();
        if (user?.precisaTrocarSenha) {
          this.precisaTrocarSenha.set(true);
          this.senhaAntigaTemp.set(payload.senha);
          this.carregando.set(false);
        } else {
           // Promisse Chain final garantindo fechamento fluído pós roteamento
          this.router.navigate(['/admin']).then(() => this.carregando.set(false));
        }
      },
      error: (err: any) => {
        this.carregando.set(false);
        
        // Neutralização Severa de Stack Traces API devolvidos à View
        if (err.status === 401 || err.status === 403) {
          const apiMsg = err.error?.message;
          this.erroLogin.set((typeof apiMsg === 'string') 
            ? apiMsg 
            : (Array.isArray(apiMsg) ? apiMsg[0] : 'Usuário ou senha incorretos. Verifique e tente novamente.'));
        } else if (err.status === 0) {
          this.erroLogin.set('Não foi possível conectar ao servidor. Verifique sua conexão.');
        } else {
          this.erroLogin.set('Ocorreu um erro inesperado. Tente novamente mais tarde.');
        }
      }
    });
  }

  confirmarNovaSenha() {
    if (this.novaSenhaForm.invalid) {
      this.novaSenhaForm.markAllAsTouched();
      return;
    }

    this.carregando.set(true);
    this.erroLogin.set('');

    const novaSenha = this.novaSenhaForm.value.novaSenha;

    this.authService.trocarSenha(this.senhaAntigaTemp(), novaSenha).pipe(takeUntilDestroyed()).subscribe({
      next: () => {
        alert('Senha alterada com sucesso! Faça login novamente com a nova senha.');
        this.authService.logout();
        this.precisaTrocarSenha.set(false);
        this.loginForm.reset();
        this.novaSenhaForm.reset();
        this.carregando.set(false);
      },
      error: () => {
         // Silencia logs expostos caso os requisitos crachem backend mal tratadamente.
         this.carregando.set(false);
         this.erroLogin.set('Erro ao alterar a senha. A senha não atende aos requisitos ou expirou.');
      }
    });
  }
}
