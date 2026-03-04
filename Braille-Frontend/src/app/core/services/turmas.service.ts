import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { PaginatedResponse } from './beneficiarios.service';

export interface Turma {
    id: string;
    nome: string;
    descricao?: string;
    horario?: string;
    capacidadeMaxima?: number;
    statusAtivo: boolean;
    excluido: boolean;
    professor?: { id: string; nome: string; email: string };
    alunos?: { id: string; nomeCompleto: string }[];
    _count?: { alunos: number };
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
    private defaultCache$: Observable<PaginatedResponse<Turma>> | null = null;
    private readonly cacheTimeMs = 2 * 60 * 1000; // 2 minutos

    constructor(private http: HttpClient) { }

    limparCache(): void {
        this.defaultCache$ = null;
    }

    listar(page = 1, limit = 10, nome?: string, statusAtivo?: boolean, professorId?: string): Observable<PaginatedResponse<Turma>> {
        const isDefaultList = page === 1 && limit === 10 && !nome && statusAtivo === undefined && !professorId;

        if (isDefaultList) {
            if (!this.defaultCache$) {
                const params = new HttpParams().set('page', '1').set('limit', '10').set('excluido', 'false');
                this.defaultCache$ = this.http.get<PaginatedResponse<Turma>>(this.url, { params }).pipe(shareReplay(1));
                setTimeout(() => this.limparCache(), this.cacheTimeMs);
            }
            return this.defaultCache$;
        }

        let params = new HttpParams().set('page', page).set('limit', limit);
        if (nome) params = params.set('nome', nome);
        if (statusAtivo !== undefined) params = params.set('statusAtivo', String(statusAtivo));
        if (professorId) params = params.set('professorId', professorId);
        params = params.set('excluido', 'false');
        return this.http.get<PaginatedResponse<Turma>>(this.url, { params });
    }

    buscarPorId(id: string): Observable<Turma> {
        return this.http.get<Turma>(`${this.url}/${id}`);
    }

    criar(dados: CreateTurmaDto): Observable<Turma> {
        this.limparCache();
        return this.http.post<Turma>(this.url, dados);
    }

    atualizar(id: string, dados: Partial<CreateTurmaDto>): Observable<Turma> {
        this.limparCache();
        return this.http.patch<Turma>(`${this.url}/${id}`, dados);
    }

    arquivar(id: string): Observable<Turma> {
        this.limparCache();
        return this.http.delete<Turma>(`${this.url}/${id}`);
    }

    excluir(id: string): Observable<Turma> {
        return this.arquivar(id);
    }

    restaurar(id: string): Observable<Turma> {
        this.limparCache();
        return this.http.patch<Turma>(`${this.url}/${id}/restaurar`, {});
    }

    ocultarDaAba(id: string): Observable<Turma> {
        this.limparCache();
        return this.http.patch<Turma>(`${this.url}/${id}/ocultar`, {});
    }

    matricularAluno(turmaId: string, alunoId: string): Observable<any> {
        this.limparCache();
        return this.http.post(`${this.url}/${turmaId}/alunos/${alunoId}`, {});
    }

    desmatricularAluno(turmaId: string, alunoId: string): Observable<any> {
        this.limparCache();
        return this.http.delete(`${this.url}/${turmaId}/alunos/${alunoId}`);
    }
}
