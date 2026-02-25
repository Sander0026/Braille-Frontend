import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaginatedResponse } from './beneficiarios.service';

export interface Inscricao {
    id: string;
    nomeCompleto: string;
    email: string;
    telefone: string;
    dataNascimento: string;
    status: 'PENDENTE' | 'APROVADA' | 'RECUSADA';
    observacoesAdmin?: string;
    criadoEm: string;
}

@Injectable({ providedIn: 'root' })
export class InscricoesService {
    private readonly url = 'http://localhost:3000/inscricoes';

    constructor(private http: HttpClient) { }

    listar(page = 1, limit = 20, status?: string): Observable<PaginatedResponse<Inscricao>> {
        let params = new HttpParams().set('page', page).set('limit', limit);
        if (status) params = params.set('status', status);
        return this.http.get<PaginatedResponse<Inscricao>>(this.url, { params });
    }

    buscarPorId(id: string): Observable<Inscricao> {
        return this.http.get<Inscricao>(`${this.url}/${id}`);
    }

    atualizarStatus(id: string, status: string, observacoesAdmin?: string): Observable<any> {
        return this.http.patch(`${this.url}/${id}/status`, { status, observacoesAdmin });
    }

    excluir(id: string): Observable<any> {
        return this.http.delete(`${this.url}/${id}`);
    }
}
