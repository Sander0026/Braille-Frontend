import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service'; // 👈 Verifique se o caminho está certo

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
      novaSenha: ['', [Validators.required, Validators.minLength(8)]],
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
          this.senhaAntigaTemp = this.loginForm.value.senha; // Salva para enviar no Patch
        } else {
          this.router.navigate(['/admin']);
        }
      },
      error: (err: any) => {
        this.carregando = false;
        this.erroLogin = 'Usuário ou senha incorretos. Tente novamente.';
        console.error(err);
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
      },
      error: (err) => {
        this.carregando = false;
        this.erroLogin = 'Erro ao alterar a senha. A senha não atende aos requisitos ou expirou.';
      }
    });
  }
}