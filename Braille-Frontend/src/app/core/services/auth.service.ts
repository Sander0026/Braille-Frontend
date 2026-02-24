import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/auth'; // Rota do nosso NestJS

  constructor(private http: HttpClient) {}

  login(credenciais: { username: string; senha: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credenciais).pipe(
      tap((resposta: any) => {
        if (resposta.access_token) {
          localStorage.setItem('token_braille', resposta.access_token);
        }
      })
    );
  }

  logout() {
    localStorage.removeItem('token_braille');
  }
}