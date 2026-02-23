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
    username: ['', [Validators.required]],
    senha: ['', [Validators.required, Validators.minLength(8)]]
  });

  mensagemErro = '';

  fazerLogin() {
    if (this.loginForm.valid) {
      const { username, senha } = this.loginForm.value;
      
      this.authService.login(username, senha).subscribe({
        next: () => {
          // Deu certo! Vai para o Painel Admin
          this.router.navigate(['/admin']);
        },
        error: (err) => {
          // Deu erro (senha errada, usuário não existe, etc)
          this.mensagemErro = 'Nome de usuário ou senha incorretos!';
          console.error(err);
        }
      });
    }
  }
}