import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map } from 'rxjs';
import { StorageService } from './storage.service';
import type { UsuarioRole } from './usuarios.service';

export interface UserInfo {
  sub: string;
  username: string;
  nome?: string;
  role: UsuarioRole;
  precisaTrocarSenha?: boolean;
}

interface AuthTokenPayload extends UserInfo {
  exp?: number;
  iat?: number;
  sid?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token?: string;
}

export interface PerfilUsuario {
  id: string;
  nome: string;
  username: string;
  email: string | null;
  role: UsuarioRole;
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

  login(credenciais: { username: string; senha: string }): Observable<AuthTokens> {
    return this.http.post<AuthTokens>(`${this.apiUrl}/login`, credenciais).pipe(
      tap((resposta) => {
        this.salvarTokens(resposta);
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

  renovarToken(): Observable<AuthTokens> {
    const refreshToken = this.getRefreshToken();
    const subId = this.getUser()?.sub;

    return this.http.post<AuthTokens>(`${this.apiUrl}/refresh`, { userId: subId, refreshToken }).pipe(
      tap((resposta) => {
        this.salvarTokens(resposta);
      })
    );
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
    const payload = this.decodeToken(token);
    return !!payload && (payload.exp ? payload.exp * 1000 > Date.now() : true);
  }

  getUser(): UserInfo | null {
    const token = this.getToken();
    if (!token) return null;
    const payload = this.decodeToken(token);
    return this.isUserInfo(payload) ? payload : null;
  }

  trocarSenha(senhaAtual: string, novaSenha: string): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.apiUrl}/trocar-senha`, { senhaAtual, novaSenha });
  }

  getMe(): Observable<PerfilUsuario> {
    // A API retorna ApiResponse<PerfilUsuario> ({ success, data, message })
    // O map extrai apenas o payload real para não quebrar o binding de fotoPerfil no header
    return this.http.get<{ data: PerfilUsuario }>(`${this.apiUrl}/me`).pipe(
      map(r => r.data)
    );
  }

  atualizarFoto(fotoPerfil: string | null): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.apiUrl}/foto-perfil`, { fotoPerfil });
  }

  atualizarPerfil(dados: { nome?: string; email?: string }): Observable<PerfilUsuario> {
    return this.http.patch<{ data: PerfilUsuario }>(`${this.apiUrl}/perfil`, dados).pipe(
      map(r => r.data)
    );
  }

  uploadFoto(file: File): Observable<{ url: string }> {
    return this.storage.uploadGlobalImage(file);
  }

  private salvarTokens(resposta: Partial<AuthTokens>): void {
    if (resposta.access_token) {
      localStorage.setItem(this.TOKEN_KEY, resposta.access_token);
    }

    if (resposta.refresh_token) {
      localStorage.setItem(this.REFRESH_KEY, resposta.refresh_token);
    }
  }

  private decodeToken(token: string): AuthTokenPayload | null {
    try {
        const payload = token.split('.')[1];
        if (!payload) return null;
        // Snyk Mitigation: Normalizar Base64Url para Base64 standard e usar decodeURIComponent contra UTF-8 Crashes
        const base64 = payload.replaceAll('-', '+').replaceAll('_', '/');
        const jsonPayload = decodeURIComponent(globalThis.atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.codePointAt(0)!.toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload) as AuthTokenPayload;
    } catch {
        // SonarQube / Falback Control (Evita crash total caso de corrupção massiva)
        return null;
    }
  }

  private isUserInfo(payload: AuthTokenPayload | null): payload is AuthTokenPayload {
    return !!payload
      && typeof payload.sub === 'string'
      && typeof payload.username === 'string'
      && this.isUsuarioRole(payload.role);
  }

  private isUsuarioRole(role: unknown): role is UsuarioRole {
    return role === 'ADMIN'
      || role === 'SECRETARIA'
      || role === 'PROFESSOR'
      || role === 'COMUNICACAO';
  }
}
