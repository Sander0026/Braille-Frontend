import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaginatedResponse } from './beneficiarios.service';

export interface Contato {
    id: string;
    nome: string;
    email: string;
    assunto?: string;
    mensagem: string;
    lida: boolean;
    criadoEm: string;
}

@Injectable({ providedIn: 'root' })
export class ContatosService {
    private readonly url = '/api/contatos';

    constructor(private http: HttpClient) { }

    listar(page = 1, limit = 20, lida?: boolean): Observable<PaginatedResponse<Contato>> {
        let params = new HttpParams().set('page', page).set('limit', limit);
        if (lida !== undefined) params = params.set('lida', String(lida));
        return this.http.get<PaginatedResponse<Contato>>(this.url, { params });
    }

    buscarPorId(id: string): Observable<Contato> {
        return this.http.get<Contato>(`${this.url}/${id}`);
    }

    marcarComoLida(id: string): Observable<any> {
        return this.http.patch(`${this.url}/${id}/lida`, {});
    }

    excluir(id: string): Observable<any> {
        return this.http.delete(`${this.url}/${id}`);
    }
}
