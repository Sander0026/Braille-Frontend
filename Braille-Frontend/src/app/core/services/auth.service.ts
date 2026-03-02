import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface UserInfo {
  sub: string;
  username: string;
  nome?: string;
  role: string;
  precisaTrocarSenha?: boolean;
}

export interface PerfilUsuario {
  id: string;
  nome: string;
  username: string;
  email: string | null;
  role: string;
  fotoPerfil: string | null;
  statusAtivo: boolean;
  criadoEm: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = '/api/auth';
  private readonly TOKEN_KEY = 'token_braille';

  constructor(private http: HttpClient) { }

  login(credenciais: { username: string; senha: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credenciais).pipe(
      tap((resposta: any) => {
        if (resposta.access_token) {
          localStorage.setItem(this.TOKEN_KEY, resposta.access_token);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      const payload = this.decodeToken(token);
      // Verifica se o token expirou
      return payload.exp ? payload.exp * 1000 > Date.now() : true;
    } catch {
      return false;
    }
  }

  getUser(): UserInfo | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      return this.decodeToken(token) as UserInfo;
    } catch {
      return null;
    }
  }

  trocarSenha(senhaAtual: string, novaSenha: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/trocar-senha`, { senhaAtual, novaSenha });
  }

  getMe(): Observable<PerfilUsuario> {
    return this.http.get<PerfilUsuario>(`${this.apiUrl}/me`);
  }

  atualizarFoto(fotoPerfil: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/foto-perfil`, { fotoPerfil });
  }

  atualizarPerfil(dados: { nome?: string; email?: string }): Observable<PerfilUsuario> {
    return this.http.patch<PerfilUsuario>(`${this.apiUrl}/perfil`, dados);
  }

  uploadFoto(file: File): Observable<{ url: string }> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<{ url: string }>('/api/upload', form);
  }

  private decodeToken(token: string): any {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  }
}