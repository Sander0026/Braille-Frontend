import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { PaginatedResponse } from './beneficiarios.service';

export interface Usuario {
    id: string;
    nome: string;
    username: string;
    email: string;
    role: 'ADMIN' | 'SECRETARIA' | 'PROFESSOR';
    fotoPerfil?: string;
    precisaTrocarSenha?: boolean;
}

export interface CreateUsuarioDto {
    nome: string;
    username: string;
    email: string;
    senha: string;
    role: string;
    fotoPerfil?: string;
    precisaTrocarSenha?: boolean;
}

@Injectable({ providedIn: 'root' })
export class UsuariosService {
    private readonly url = '/api/users';
    private defaultCache$: Observable<PaginatedResponse<Usuario>> | null = null;
    private readonly cacheTimeMs = 2 * 60 * 1000; // 2 minutos

    constructor(private http: HttpClient) { }

    limparCache(): void {
        this.defaultCache$ = null;
    }

    listar(page = 1, limit = 10, nome?: string, inativos: boolean = false): Observable<PaginatedResponse<Usuario>> {
        const isDefaultList = page === 1 && limit === 10 && !nome && !inativos;

        if (isDefaultList) {
            if (!this.defaultCache$) {
                const params = new HttpParams().set('page', '1').set('limit', '10');
                this.defaultCache$ = this.http.get<PaginatedResponse<Usuario>>(this.url, { params }).pipe(shareReplay(1));
                setTimeout(() => this.limparCache(), this.cacheTimeMs);
            }
            return this.defaultCache$;
        }

        let params = new HttpParams().set('page', page).set('limit', limit);
        if (nome) params = params.set('nome', nome);
        if (inativos) params = params.set('inativos', 'true');
        return this.http.get<PaginatedResponse<Usuario>>(this.url, { params });
    }

    criar(dados: CreateUsuarioDto): Observable<Usuario> {
        this.limparCache();
        return this.http.post<Usuario>(this.url, dados);
    }

    atualizar(id: string, dados: Partial<CreateUsuarioDto>): Observable<Usuario> {
        this.limparCache();
        return this.http.patch<Usuario>(`${this.url}/${id}`, dados);
    }

    excluir(id: string): Observable<any> {
        this.limparCache();
        return this.http.delete(`${this.url}/${id}`);
    }

    resetarSenha(id: string): Observable<Usuario> {
        return this.http.patch<Usuario>(`${this.url}/${id}/reset-password`, {});
    }

    restaurar(id: string): Observable<Usuario> {
        this.limparCache();
        return this.http.patch<Usuario>(`${this.url}/${id}/restore`, {});
    }

    excluirDefinitivo(id: string): Observable<any> {
        this.limparCache();
        return this.http.delete(`${this.url}/${id}/hard`);
    }

    uploadFoto(file: File): Observable<{ url: string }> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<{ url: string }>('/api/upload', formData);
    }
}
