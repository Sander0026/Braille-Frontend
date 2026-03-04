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
    aluno?: { id: string; nomeCompleto: string };
    turma?: { id: string; nome: string };
}

@Injectable({ providedIn: 'root' })
export class FrequenciasService {
    private readonly url = '/api/frequencias';
    // Para frequências, o cache é por turma+data — muito específico, não vale o padrão de "default"
    // Usamos cache apenas no resumo, que é a listagem principal da tela de chamada
    private resumoCache$: Observable<PaginatedResponse<any>> | null = null;
    private readonly cacheTimeMs = 1 * 60 * 1000; // 1 minuto (chamada muda com frequência)

    constructor(private http: HttpClient) { }

    limparCache(): void {
        this.resumoCache$ = null;
    }

    listar(page = 1, limit = 20, turmaId?: string, dataAula?: string, professorId?: string): Observable<PaginatedResponse<Frequencia>> {
        // Frequências por data/turma não devem ser cacheadas pois variam muito
        let params = new HttpParams().set('page', page).set('limit', limit);
        if (turmaId) params = params.set('turmaId', turmaId);
        if (dataAula) params = params.set('dataAula', dataAula);
        if (professorId) params = params.set('professorId', professorId);
        return this.http.get<PaginatedResponse<Frequencia>>(this.url, { params });
    }

    listarResumo(page = 1, limit = 20, turmaId?: string, professorId?: string): Observable<PaginatedResponse<any>> {
        const isDefaultList = page === 1 && limit === 20 && !turmaId && !professorId;

        if (isDefaultList) {
            if (!this.resumoCache$) {
                const params = new HttpParams().set('page', '1').set('limit', '20');
                this.resumoCache$ = this.http.get<PaginatedResponse<any>>(`${this.url}/resumo`, { params }).pipe(shareReplay(1));
                setTimeout(() => this.limparCache(), this.cacheTimeMs);
            }
            return this.resumoCache$;
        }

        let params = new HttpParams().set('page', page).set('limit', limit);
        if (turmaId) params = params.set('turmaId', turmaId);
        if (professorId) params = params.set('professorId', professorId);
        return this.http.get<PaginatedResponse<any>>(`${this.url}/resumo`, { params });
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

    excluir(id: string): Observable<any> {
        this.limparCache();
        return this.http.delete(`${this.url}/${id}`);
    }
}
