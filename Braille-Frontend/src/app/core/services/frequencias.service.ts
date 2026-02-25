import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaginatedResponse } from './beneficiarios.service';

export interface Frequencia {
    id: string;
    presente: boolean;
    dataAula: string;
    alunoId: string;
    turmaId: string;
    aluno?: { id: string; nomeCompleto: string };
    turma?: { id: string; nome: string };
}

@Injectable({ providedIn: 'root' })
export class FrequenciasService {
    private readonly url = 'http://localhost:3000/frequencias';

    constructor(private http: HttpClient) { }

    listar(page = 1, limit = 20, turmaId?: string, dataAula?: string): Observable<PaginatedResponse<Frequencia>> {
        let params = new HttpParams().set('page', page).set('limit', limit);
        if (turmaId) params = params.set('turmaId', turmaId);
        if (dataAula) params = params.set('dataAula', dataAula);
        return this.http.get<PaginatedResponse<Frequencia>>(this.url, { params });
    }

    registrar(dados: { alunoId: string; turmaId: string; dataAula: string; presente: boolean }): Observable<Frequencia> {
        return this.http.post<Frequencia>(this.url, dados);
    }

    atualizar(id: string, dados: Partial<Frequencia>): Observable<Frequencia> {
        return this.http.patch<Frequencia>(`${this.url}/${id}`, dados);
    }

    excluir(id: string): Observable<any> {
        return this.http.delete(`${this.url}/${id}`);
    }
}
