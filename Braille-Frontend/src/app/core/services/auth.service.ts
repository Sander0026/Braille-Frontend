import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/auth'; // A URL do nosso backend

  login(username: string, senha: string) {
    // Faz o POST para a API e, se der certo, salva o token no LocalStorage do navegador
    return this.http.post<{ access_token: string }>(`${this.apiUrl}/login`, { username, senha })
      .pipe(
        tap(resposta => {
          localStorage.setItem('braille_token', resposta.access_token);
        })
      );
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('braille_token');
  }

  logout() {
    localStorage.removeItem('braille_token');
  }
}