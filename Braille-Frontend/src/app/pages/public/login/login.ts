import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.html',
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required, Validators.minLength(6)]]
  });

  mensagemErro = '';

  fazerLogin() {
    if (this.loginForm.valid) {
      const { email, senha } = this.loginForm.value;
      
      this.authService.login(email, senha).subscribe({
        next: () => {
          // Deu certo! Vai para o Painel Admin
          this.router.navigate(['/admin']);
        },
        error: (err) => {
          // Deu erro (senha errada, etc)
          this.mensagemErro = 'E-mail ou senha incorretos!';
          console.error(err);
        }
      });
    }
  }
}