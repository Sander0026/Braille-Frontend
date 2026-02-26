import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaginatedResponse } from './beneficiarios.service';

export interface Usuario {
    id: string;
    nome: string;
    username: string;
    email: string;
    role: 'ADMIN' | 'SECRETARIA' | 'PROFESSOR';
    fotoPerfil?: string;
}

export interface CreateUsuarioDto {
    nome: string;
    username: string;
    email: string;
    senha: string;
    role: string;
}

@Injectable({ providedIn: 'root' })
export class UsuariosService {
    private readonly url = '/api/users';

    constructor(private http: HttpClient) { }

    listar(page = 1, limit = 10, nome?: string): Observable<PaginatedResponse<Usuario>> {
        let params = new HttpParams().set('page', page).set('limit', limit);
        if (nome) params = params.set('nome', nome);
        return this.http.get<PaginatedResponse<Usuario>>(this.url, { params });
    }

    criar(dados: CreateUsuarioDto): Observable<Usuario> {
        return this.http.post<Usuario>(this.url, dados);
    }

    atualizar(id: string, dados: Partial<CreateUsuarioDto>): Observable<Usuario> {
        return this.http.patch<Usuario>(`${this.url}/${id}`, dados);
    }

    excluir(id: string): Observable<any> {
        return this.http.delete(`${this.url}/${id}`);
    }
}
