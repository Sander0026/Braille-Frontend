import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { PaginatedResponse } from './beneficiarios.service';

export interface GradeHorariaDto {
    dia: 'SEG' | 'TER' | 'QUA' | 'QUI' | 'SEX' | 'SAB' | 'DOM';
    horaInicio: number; // minutos desde meia-noite
    horaFim: number;
}

export type TurmaStatus = 'PREVISTA' | 'ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA';

export interface Turma {
    id: string;
    nome: string;
    descricao?: string;
    horario?: string;
    capacidadeMaxima?: number;
    statusAtivo: boolean;
    excluido: boolean;
    status: TurmaStatus;         // Fase 4: ciclo de vida acadêmico
    professor?: { id: string; nome: string; email: string };
    gradeHoraria?: GradeHorariaDto[];
    matriculasOficina?: {
        id: string;
        status: string;
        dataEntrada: string;
        aluno: { id: string; nomeCompleto: string; matricula?: string };
    }[];
    _count?: { matriculasOficina: number };
}



export interface CreateTurmaDto {
    nome: string;
    descricao?: string;
    horario?: string;
    capacidadeMaxima?: number;
    professorId: string;
    gradeHoraria?: GradeHorariaDto[];
}


@Injectable({ providedIn: 'root' })
export class TurmasService {
    private readonly url = '/api/turmas';
    // Cache por chave de parâmetros — funciona para todas as abas (ativas/arquivadas) e paginações
    private cache = new Map<string, Observable<PaginatedResponse<Turma>>>();
    private readonly cacheTimeMs = 2 * 60 * 1000; // 2 minutos

    constructor(private http: HttpClient) { }

    limparCache(): void {
        this.cache.clear();
    }

    private buildCacheKey(page: number, limit: number, nome?: string, statusAtivo?: boolean, professorId?: string, status?: string): string {
        return `${page}|${limit}|${nome ?? ''}|${statusAtivo ?? 'all'}|${professorId ?? ''}|${status ?? ''}`;
    }

    listar(page = 1, limit = 10, nome?: string, statusAtivo?: boolean, professorId?: string, status?: string): Observable<PaginatedResponse<Turma>> {
        const key = this.buildCacheKey(page, limit, nome, statusAtivo, professorId, status);

        if (!this.cache.has(key)) {
            let params = new HttpParams().set('page', page).set('limit', limit).set('excluido', 'false');
            if (nome) params = params.set('nome', nome);
            if (statusAtivo !== undefined) params = params.set('statusAtivo', String(statusAtivo));
            if (professorId) params = params.set('professorId', professorId);
            if (status) params = params.set('status', status);

            const req$ = this.http.get<PaginatedResponse<Turma>>(this.url, { params }).pipe(shareReplay(1));
            this.cache.set(key, req$);
            setTimeout(() => this.cache.delete(key), this.cacheTimeMs);
        }

        return this.cache.get(key)!;
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

    mudarStatus(id: string, status: TurmaStatus): Observable<{ id: string; nome: string; status: TurmaStatus; statusAtivo: boolean }> {
        this.limparCache();
        return this.http.patch<{ id: string; nome: string; status: TurmaStatus; statusAtivo: boolean }>(`${this.url}/${id}/status`, { status });
    }
}
