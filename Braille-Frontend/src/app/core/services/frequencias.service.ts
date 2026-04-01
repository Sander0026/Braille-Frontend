import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { PaginatedResponse } from './beneficiarios.service';

export interface Frequencia {
    id: string;
    presente: boolean;
    dataAula: string;
    alunoId: string;
    turmaId: string;
    fechado?: boolean;
    fechadoEm?: string;
    aluno?: { id: string; nomeCompleto: string };
    turma?: { id: string; nome: string };
}

export interface ResumoFrequencia {
    dataAula: string;
    turmaId: string;
    turmaNome: string;
    totalAlunos: number;
    presentes: number;
    faltas: number;
    diarioFechado: boolean;
    fechadoEm: string | null;
}

@Injectable({ providedIn: 'root' })
export class FrequenciasService {
    private readonly url = '/api/frequencias';
    private resumoCache: { data$: Observable<PaginatedResponse<ResumoFrequencia>>, expiresAt: number } | null = null;
    private readonly cacheTimeMs = 1 * 60 * 1000;

    constructor(private readonly http: HttpClient) { }

    limparCache(): void { this.resumoCache = null; }

    listar(page = 1, limit = 20, turmaId?: string, dataAula?: string, professorId?: string): Observable<PaginatedResponse<Frequencia>> {
        let params = new HttpParams().set('page', page).set('limit', limit);
        if (turmaId) params = params.set('turmaId', turmaId);
        if (dataAula) params = params.set('dataAula', dataAula);
        if (professorId) params = params.set('professorId', professorId);
        return this.http.get<PaginatedResponse<Frequencia>>(this.url, { params });
    }

    listarResumo(page = 1, limit = 20, turmaId?: string, professorId?: string): Observable<PaginatedResponse<ResumoFrequencia>> {
        const isDefaultList = page === 1 && limit === 20 && !turmaId && !professorId;
        const now = Date.now();

        if (isDefaultList) {
            if (this.resumoCache && this.resumoCache.expiresAt > now) {
                return this.resumoCache.data$;
            }

            const params = new HttpParams().set('page', '1').set('limit', '20');
            const req$ = this.http.get<PaginatedResponse<ResumoFrequencia>>(`${this.url}/resumo`, { params }).pipe(shareReplay(1));
            
            this.resumoCache = { data$: req$, expiresAt: now + this.cacheTimeMs };
            return req$;
        }

        let params = new HttpParams().set('page', page).set('limit', limit);
        if (turmaId) params = params.set('turmaId', turmaId);
        if (professorId) params = params.set('professorId', professorId);
        return this.http.get<PaginatedResponse<ResumoFrequencia>>(`${this.url}/resumo`, { params });
    }

    obterRelatorioAluno(turmaId: string, alunoId: string): Observable<any> {
        return this.http.get<any>(`${this.url}/relatorio/turma/${turmaId}/aluno/${alunoId}`);
    }

    registrar(dados: { alunoId: string; turmaId: string; dataAula: string; presente: boolean }): Observable<Frequencia> {
        this.limparCache();
        return this.http.post<Frequencia>(this.url, dados);
    }

    atualizar(id: string, dados: Partial<Frequencia>): Observable<Frequencia> {
        this.limparCache();
        return this.http.patch<Frequencia>(`${this.url}/${id}`, dados);
    }

    salvarLote(turmaId: string, dataAula: string, alunos: { alunoId: string; presente: boolean, frequenciaId?: string }[]): Observable<any> {
        this.limparCache();
        return this.http.post<any>(`${this.url}/lote`, { turmaId, dataAula, alunos });
    }

    excluir(id: string): Observable<any> {
        this.limparCache();
        return this.http.delete(`${this.url}/${id}`);
    }

    // ── Diário ──────────────────────────────────────────────────────────────

    fecharDiario(turmaId: string, dataAula: string): Observable<any> {
        this.limparCache();
        return this.http.post(`${this.url}/diario/fechar/${turmaId}/${dataAula}`, {});
    }

    reabrirDiario(turmaId: string, dataAula: string): Observable<any> {
        this.limparCache();
        return this.http.post(`${this.url}/diario/reabrir/${turmaId}/${dataAula}`, {});
    }

    getRelatorioAluno(turmaId: string, alunoId: string): Observable<{
        estatisticas: { totalAulas: number; presentes: number; faltas: number; taxaPresenca: number };
        historico: any[];
    }> {
        return this.http.get<{
            estatisticas: { totalAulas: number; presentes: number; faltas: number; taxaPresenca: number };
            historico: any[];
        }>(`${this.url}/relatorio/turma/${turmaId}/aluno/${alunoId}`);
    }
}
