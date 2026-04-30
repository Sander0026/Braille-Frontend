import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

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

export interface ComunicadoPayload {
    titulo: string;
    conteudo: string;
    categoria: string;
    fixado: boolean;
    imagemCapa?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ComunicadosService {
    private readonly url = '/api/comunicados';

    constructor(private http: HttpClient) { }

    listar(page = 1, limit = 50, categoria?: string, titulo?: string): Observable<ComunicadoResponse | Comunicado[]> {
        let params = new HttpParams()
            .set('page', page)
            .set('limit', limit);

        if (categoria) params = params.set('categoria', categoria);
        if (titulo) params = params.set('titulo', titulo);

        return this.http.get<ComunicadoResponse | Comunicado[]>(this.url, { params });
    }

    criar(dados: ComunicadoPayload): Observable<Comunicado> {
        return this.http.post<Comunicado>(this.url, dados);
    }

    buscarPorId(id: string): Observable<Comunicado> {
        return this.http.get<Comunicado>(`${this.url}/${id}`);
    }

    atualizar(id: string, dados: Partial<ComunicadoPayload>): Observable<Comunicado> {
        return this.http.patch<Comunicado>(`${this.url}/${id}`, dados);
    }

    excluir(id: string): Observable<void> {
        return this.http.delete<void>(`${this.url}/${id}`);
    }
}
