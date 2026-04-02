import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaginatedResponse } from './beneficiarios.service';

export interface Comunicado {
    id: string;
    titulo: string;
    conteudo: string;
    categoria: string;
    fixado: boolean;
    imagemCapa?: string;
    criadoEm: string;
    atualizadoEm: string;
}

export interface ComunicadoResponse {
    data: Comunicado[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }
}

@Injectable({ providedIn: 'root' })
export class ComunicadosService {
    private readonly url = '/api/comunicados';

    constructor(private http: HttpClient) { }

    listar(page = 1, limit = 50, categoria?: string, titulo?: string): Observable<ComunicadoResponse | Comunicado[]> {
        let qs = `?page=${page}&limit=${limit}`;
        if (categoria) qs += `&categoria=${categoria}`;
        if (titulo) qs += `&titulo=${encodeURIComponent(titulo)}`;
        return this.http.get<ComunicadoResponse | Comunicado[]>(`${this.url}${qs}`);
    }

    criar(dados: Record<string, any>): Observable<Comunicado> {
        return this.http.post<Comunicado>(this.url, dados);
    }

    buscarPorId(id: string): Observable<Comunicado> {
        return this.http.get<Comunicado>(`${this.url}/${id}`);
    }

    atualizar(id: string, dados: Record<string, any>): Observable<Comunicado> {
        return this.http.patch<Comunicado>(`${this.url}/${id}`, dados);
    }

    excluir(id: string): Observable<any> {
        return this.http.delete(`${this.url}/${id}`);
    }
}
