import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { StorageService } from './storage.service';

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
  private readonly REFRESH_KEY = 'refresh_braille';

  constructor(
      private readonly http: HttpClient,
      private readonly storage: StorageService
  ) { }

  login(credenciais: { username: string; senha: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credenciais).pipe(
      tap((resposta: any) => {
        if (resposta.access_token) {
          localStorage.setItem(this.TOKEN_KEY, resposta.access_token);
        }
        if (resposta.refresh_token) {
          localStorage.setItem(this.REFRESH_KEY, resposta.refresh_token);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_KEY);
  }

  renovarToken(): Observable<any> {
    const refreshToken = this.getRefreshToken();
    const subId = this.getUser()?.sub;

    return this.http.post(`${this.apiUrl}/refresh`, { userId: subId, refreshToken }).pipe(
      tap((resposta: any) => {
        if (resposta.access_token) {
          localStorage.setItem(this.TOKEN_KEY, resposta.access_token);
        }
      })
    );
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

  atualizarFoto(fotoPerfil: string | null): Observable<any> {
    return this.http.patch(`${this.apiUrl}/foto-perfil`, { fotoPerfil });
  }

  atualizarPerfil(dados: { nome?: string; email?: string }): Observable<PerfilUsuario> {
    return this.http.patch<PerfilUsuario>(`${this.apiUrl}/perfil`, dados);
  }

  uploadFoto(file: File): Observable<{ url: string }> {
    return this.storage.uploadGlobalImage(file);
  }

  private decodeToken(token: string): any {
    try {
        const payload = token.split('.')[1];
        // Snyk Mitigation: Normalizar Base64Url para Base64 standard e usar decodeURIComponent contra UTF-8 Crashes
        const base64 = payload.replaceAll('-', '+').replaceAll('_', '/');
        const jsonPayload = decodeURIComponent(globalThis.atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.codePointAt(0)!.toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch {
        // SonarQube / Falback Control (Evita crash total caso de corrupção massiva)
        return {};
    }
  }
}