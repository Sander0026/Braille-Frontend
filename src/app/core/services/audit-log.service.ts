import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { map } from 'rxjs/operators';
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
    oldValue: unknown;
    newValue: unknown;
    criadoEm: string;
}

export interface AuditStats {
    totalLogs: number;
    logsHoje: number;
    topAcoes: { acao: AuditAcao; total: number }[]; // backend garante array, mas a interface defende contra shape inesperado
}

/** Cria um AuditStats seguro com valores padrÃ£o â€” evita crash por resposta parcial da API. */
export function defaultAuditStats(): AuditStats {
    return { totalLogs: 0, logsHoje: 0, topAcoes: [] };
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

// â”€â”€â”€ Tipos internos de cache â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface CacheEntry<T> {
    obs$: Observable<T>;
    expiresAt: number;
}

const CACHE_TTL_MS = 60_000; // 1 minuto

@Injectable({ providedIn: 'root' })
export class AuditLogService {
    private readonly url = '/api/audit-log';

    // Cache da listagem: chave = query serializada
    private readonly listarCache = new Map<string, CacheEntry<PaginatedResponse<AuditLog>>>();

    // Cache das stats (Ãºnica entrada)
    private statsCache: CacheEntry<AuditStats> | null = null;

    constructor(private readonly http: HttpClient) { }

    /** Limpa todo o cache (chamar apÃ³s operaÃ§Ãµes que alteram logs). */
    limparCache(): void {
        this.listarCache.clear();
        this.statsCache = null;
    }

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

        const key = params.toString();
        const cached = this.listarCache.get(key);

        if (cached && Date.now() < cached.expiresAt) {
            return cached.obs$;
        }

        const obs$ = this.http
            .get<unknown>(this.url, { params })
            .pipe(
                map(res => {
                    // Se o backend envolveu em { success, data, message }
                    const payload = (res && typeof (res as { success?: unknown }).success === 'boolean' && (res as { data: PaginatedResponse<AuditLog> }).data) ? (res as { data: PaginatedResponse<AuditLog> }).data : (res as PaginatedResponse<AuditLog>);
                    return {
                        ...payload,
                        data: Array.isArray(payload?.data) ? payload.data : [],
                    };
                }),
                shareReplay(1),
            );

        this.listarCache.set(key, { obs$, expiresAt: Date.now() + CACHE_TTL_MS });
        return obs$;
    }

    stats(): Observable<AuditStats> {
        if (this.statsCache && Date.now() < this.statsCache.expiresAt) {
            return this.statsCache.obs$;
        }

        const obs$ = this.http
            .get<unknown>(`${this.url}/stats`)
            .pipe(
                map(res => { const w = res as { success?: boolean; data?: AuditStats }; return (w && typeof w.success === 'boolean' && w.data) ? w.data : (res as AuditStats); }),
                shareReplay(1)
            );

        this.statsCache = { obs$, expiresAt: Date.now() + CACHE_TTL_MS };
        return obs$;
    }

    historicoPorRegistro(entidade: string, registroId: string): Observable<AuditLog[]> {
        // HistÃ³rico por registro nÃ£o Ã© cacheado â€” sempre fresco
        return this.http.get<unknown>(`${this.url}/${entidade}/${registroId}`)
            .pipe(
                map(res => { const w = res as { success?: boolean; data?: AuditLog[] }; return (w && typeof w.success === 'boolean' && w.data) ? w.data : (res as AuditLog[]); })
            );
    }
}
