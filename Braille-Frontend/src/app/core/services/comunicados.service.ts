import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaginatedResponse } from './beneficiarios.service';

export interface Comunicado {
    id: string;
    titulo: string;
    conteudo: string;
    criadoEm: string;
    atualizadoEm: string;
}

@Injectable({ providedIn: 'root' })
export class ComunicadosService {
    private readonly url = '/api/comunicados';

    constructor(private http: HttpClient) { }

    listar(): Observable<Comunicado[]> {
        return this.http.get<Comunicado[]>(this.url);
    }

    criar(dados: { titulo: string; conteudo: string }): Observable<Comunicado> {
        return this.http.post<Comunicado>(this.url, dados);
    }

    atualizar(id: string, dados: { titulo?: string; conteudo?: string }): Observable<Comunicado> {
        return this.http.patch<Comunicado>(`${this.url}/${id}`, dados);
    }

    excluir(id: string): Observable<any> {
        return this.http.delete(`${this.url}/${id}`);
    }
}
