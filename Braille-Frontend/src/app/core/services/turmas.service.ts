import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaginatedResponse } from './beneficiarios.service';

export interface Turma {
    id: string;
    nome: string;
    descricao?: string;
    horario?: string;
    capacidadeMaxima?: number;
    statusAtivo: boolean;
    professor?: { id: string; nome: string; email: string };
    alunos?: { id: string; nomeCompleto: string }[];
}

export interface CreateTurmaDto {
    nome: string;
    descricao?: string;
    horario?: string;
    capacidadeMaxima?: number;
    professorId: string;
}

@Injectable({ providedIn: 'root' })
export class TurmasService {
    private readonly url = '/api/turmas';

    constructor(private http: HttpClient) { }

    listar(page = 1, limit = 10, nome?: string): Observable<PaginatedResponse<Turma>> {
        let params = new HttpParams().set('page', page).set('limit', limit);
        if (nome) params = params.set('nome', nome);
        return this.http.get<PaginatedResponse<Turma>>(this.url, { params });
    }

    buscarPorId(id: string): Observable<Turma> {
        return this.http.get<Turma>(`${this.url}/${id}`);
    }

    criar(dados: CreateTurmaDto): Observable<Turma> {
        return this.http.post<Turma>(this.url, dados);
    }

    atualizar(id: string, dados: Partial<CreateTurmaDto>): Observable<Turma> {
        return this.http.patch<Turma>(`${this.url}/${id}`, dados);
    }

    excluir(id: string): Observable<any> {
        return this.http.delete(`${this.url}/${id}`);
    }

    matricularAluno(turmaId: string, alunoId: string): Observable<any> {
        return this.http.post(`${this.url}/${turmaId}/alunos/${alunoId}`, {});
    }

    desmatricularAluno(turmaId: string, alunoId: string): Observable<any> {
        return this.http.delete(`${this.url}/${turmaId}/alunos/${alunoId}`);
    }
}
