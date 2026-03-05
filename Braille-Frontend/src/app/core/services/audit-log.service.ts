import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaginatedResponse } from './beneficiarios.service';

export type AuditAcao =
    | 'CRIAR' | 'ATUALIZAR' | 'EXCLUIR' | 'ARQUIVAR' | 'RESTAURAR'
    | 'LOGIN' | 'LOGOUT' | 'MATRICULAR' | 'DESMATRICULAR'
    | 'FECHAR_DIARIO' | 'REABRIR_DIARIO' | 'MUDAR_STATUS';

export interface AuditLog {
    id: string;
    entidade: string;
    registroId: string | null;
    acao: AuditAcao;
    autorId: string | null;
    autorNome: string | null;
    autorRole: string | null;
    ip: string | null;
    userAgent: string | null;
    oldValue: any;
    newValue: any;
    criadoEm: string;
}

export interface AuditStats {
    totalLogs: number;
    logsHoje: number;
    topAcoes: { acao: AuditAcao; total: number }[];
}

export interface QueryAuditDto {
    page?: number;
    limit?: number;
    entidade?: string;
    registroId?: string;
    autorId?: string;
    acao?: AuditAcao;
    de?: string;
    ate?: string;
}

@Injectable({ providedIn: 'root' })
export class AuditLogService {
    private readonly url = '/api/audit-log';

    constructor(private http: HttpClient) { }

    listar(q: QueryAuditDto = {}): Observable<PaginatedResponse<AuditLog>> {
        let params = new HttpParams()
            .set('page', q.page ?? 1)
            .set('limit', q.limit ?? 20);
        if (q.entidade) params = params.set('entidade', q.entidade);
        if (q.registroId) params = params.set('registroId', q.registroId);
        if (q.autorId) params = params.set('autorId', q.autorId);
        if (q.acao) params = params.set('acao', q.acao);
        if (q.de) params = params.set('de', q.de);
        if (q.ate) params = params.set('ate', q.ate);
        return this.http.get<PaginatedResponse<AuditLog>>(this.url, { params });
    }

    stats(): Observable<AuditStats> {
        return this.http.get<AuditStats>(`${this.url}/stats`);
    }

    historicoPorRegistro(entidade: string, registroId: string): Observable<AuditLog[]> {
        return this.http.get<AuditLog[]>(`${this.url}/${entidade}/${registroId}`);
    }
}
