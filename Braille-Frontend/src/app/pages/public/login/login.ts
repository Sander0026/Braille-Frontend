import { Component, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { AbstractControl, ValidationErrors } from '@angular/forms';

export function senhaForteValidator(control: AbstractControl): ValidationErrors | null {
  const s = control.value || '';
  if (!s) return null; // let 'required' handle empty
  const hasUpper = /[A-Z]/.test(s);
  const hasLower = /[a-z]/.test(s);
  const hasNumber = /[0-9]/.test(s);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(s);
  
  if (s.length >= 8 && hasUpper && hasLower && hasNumber && hasSpecial) {
    return null;
  }
  return { senhaFraca: true };
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  loginForm: FormGroup;
  novaSenhaForm: FormGroup;
  erroLogin = '';
  carregando = false;
  precisaTrocarSenha = false;
  senhaAntigaTemp = '';
  mostrarSenha = false;

  toggleSenha() {
    this.mostrarSenha = !this.mostrarSenha;
  }

  get hasMinLength() { return (this.novaSenhaForm?.get('novaSenha')?.value || '').length >= 8; }
  get hasUpperCase() { return /[A-Z]/.test(this.novaSenhaForm?.get('novaSenha')?.value || ''); }
  get hasLowerCase() { return /[a-z]/.test(this.novaSenhaForm?.get('novaSenha')?.value || ''); }
  get hasNumber() { return /[0-9]/.test(this.novaSenhaForm?.get('novaSenha')?.value || ''); }
  get hasSpecial() { return /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(this.novaSenhaForm?.get('novaSenha')?.value || ''); }
  
  get missingColor() {
    return this.novaSenhaForm?.get('novaSenha')?.touched ? '#dc2626' : '#64748b';
  }

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      senha: ['', Validators.required]
    });

    this.novaSenhaForm = this.fb.group({
      novaSenha: ['', [Validators.required, senhaForteValidator]],
      confirmarSenha: ['', [Validators.required]]
    }, { validators: this.senhasIguaisValidator });
  }

  senhasIguaisValidator(g: FormGroup) {
    return g.get('novaSenha')?.value === g.get('confirmarSenha')?.value ? null : { mismatch: true };
  }

  fazerLogin() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.carregando = true;
    this.erroLogin = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.carregando = false;
        const user = this.authService.getUser();

        if (user?.precisaTrocarSenha) {
          this.precisaTrocarSenha = true;
          this.senhaAntigaTemp = this.loginForm.value.senha;
        } else {
          this.router.navigate(['/admin']);
        }
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.carregando = false;

        if (err.status === 401 || err.status === 403) {
          const apiMsg = err.error?.message;
          this.erroLogin = (typeof apiMsg === 'string') 
            ? apiMsg 
            : (Array.isArray(apiMsg) ? apiMsg[0] : 'Usuário ou senha incorretos. Verifique e tente novamente.');
        } else if (err.status === 0) {
          this.erroLogin = 'Não foi possível conectar ao servidor. Verifique sua conexão.';
        } else {
          this.erroLogin = 'Ocorreu um erro inesperado. Tente novamente mais tarde.';
        }

        this.cdr.markForCheck();
      }
    });
  }

  confirmarNovaSenha() {
    if (this.novaSenhaForm.invalid) {
      this.novaSenhaForm.markAllAsTouched();
      return;
    }

    this.carregando = true;
    this.erroLogin = '';

    const novaSenha = this.novaSenhaForm.value.novaSenha;

    this.authService.trocarSenha(this.senhaAntigaTemp, novaSenha).subscribe({
      next: () => {
        alert('Senha alterada com sucesso! Faça login novamente com a nova senha.');
        this.authService.logout();
        this.precisaTrocarSenha = false;
        this.loginForm.reset();
        this.novaSenhaForm.reset();
        this.carregando = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.carregando = false;
        this.erroLogin = 'Erro ao alterar a senha. A senha não atende aos requisitos ou expirou.';
        this.cdr.markForCheck();
      }
    });
  }
}
