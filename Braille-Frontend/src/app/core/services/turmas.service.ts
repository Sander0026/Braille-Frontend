import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
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
    cargaHoraria?: string;
    dataInicio?: string;
    dataFim?: string;
    statusAtivo: boolean;
    excluido: boolean;
    status: TurmaStatus;         
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
    dataInicio?: string;
    dataFim?: string;
    cargaHoraria?: string;
    modeloCertificadoId?: string;
}

@Injectable({ providedIn: 'root' })
export class TurmasService {
    private readonly url = '/api/turmas';
    private readonly cache = new Map<string, { data$: Observable<PaginatedResponse<Turma>>, expiresAt: number }>();
    private readonly cacheTimeMs = 2 * 60 * 1000; // 2 minutos

    constructor(private readonly http: HttpClient) { }

    limparCache(): void {
        this.cache.clear();
    }

    private buildCacheKey(page: number, limit: number, nome?: string, statusAtivo?: boolean | 'all', professorId?: string, status?: string, excluido?: boolean | 'all'): string {
        return `${page}|${limit}|${nome ?? ''}|${statusAtivo ?? 'all'}|${professorId ?? ''}|${status ?? ''}|${excluido ?? 'false'}`;
    }

    listar(page = 1, limit = 10, nome?: string, statusAtivo?: boolean | 'all', professorId?: string, status?: string, excluido?: boolean | 'all'): Observable<PaginatedResponse<Turma>> {
        const key = this.buildCacheKey(page, limit, nome, statusAtivo, professorId, status, excluido);
        const now = Date.now();

        if (this.cache.has(key) && this.cache.get(key)!.expiresAt > now) {
            return this.cache.get(key)!.data$;
        }

        let params = new HttpParams().set('page', page).set('limit', limit);
        if (excluido !== 'all') {
            params = params.set('excluido', excluido !== undefined ? String(excluido) : 'false');
        }
        if (nome) params = params.set('nome', nome);
        if (statusAtivo !== undefined && statusAtivo !== 'all') params = params.set('statusAtivo', String(statusAtivo));
        else if (statusAtivo === 'all') params = params.set('statusAtivo', 'all');
        if (professorId) params = params.set('professorId', professorId);
        if (status) params = params.set('status', status);

        const req$ = this.http.get<PaginatedResponse<Turma>>(this.url, { params }).pipe(shareReplay(1));
        this.cache.set(key, { data$: req$, expiresAt: now + this.cacheTimeMs });

        return req$;
    }

    listarProfessoresAtivos(): Observable<{ id: string; nome: string }[]> {
        return this.http.get<{ id: string; nome: string }[]>(`${this.url}/professores-ativos`);
    }

    buscarPorId(id: string): Observable<Turma> {
        return this.http.get<Turma>(`${this.url}/${id}`);
    }

    alunosDisponiveis(turmaId: string, nome?: string): Observable<{ id: string; nomeCompleto: string; matricula: string | null }[]> {
        let params = new HttpParams();
        if (nome?.trim()) params = params.set('nome', nome.trim());
        return this.http.get<{ id: string; nomeCompleto: string; matricula: string | null }[]>(
            `${this.url}/${turmaId}/alunos-disponiveis`, { params }
        );
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

    cancelar(id: string): Observable<Turma> {
        this.limparCache(); // CORREÇÃO 2
        return this.http.patch<Turma>(`${this.url}/${id}/cancelar`, {}); // CORREÇÃO 1
    }

    concluir(id: string): Observable<Turma> {
        this.limparCache(); // CORREÇÃO 2
        return this.http.patch<Turma>(`${this.url}/${id}/concluir`, {}); // CORREÇÃO 1
    }
}