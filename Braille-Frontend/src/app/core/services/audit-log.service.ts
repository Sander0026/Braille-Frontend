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

/** Cria um AuditStats seguro com valores padrão — evita crash por resposta parcial da API. */
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

// ─── Tipos internos de cache ────────────────────────────────────────────────
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

    // Cache das stats (única entrada)
    private statsCache: CacheEntry<AuditStats> | null = null;

    constructor(private readonly http: HttpClient) { }

    /** Limpa todo o cache (chamar após operações que alteram logs). */
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
            .get<PaginatedResponse<AuditLog>>(this.url, { params })
            .pipe(
                // ✅ Normaliza o contrato na camada de serviço: garante que data seja sempre Array
                // Protege contra backends que retornam objetos indexados ou shapes parciais
                map(res => ({
                    ...res,
                    data: Array.isArray(res?.data) ? res.data : [],
                })),
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
            .get<AuditStats>(`${this.url}/stats`)
            .pipe(shareReplay(1));

        this.statsCache = { obs$, expiresAt: Date.now() + CACHE_TTL_MS };
        return obs$;
    }

    historicoPorRegistro(entidade: string, registroId: string): Observable<AuditLog[]> {
        // Histórico por registro não é cacheado — sempre fresco
        return this.http.get<AuditLog[]>(`${this.url}/${entidade}/${registroId}`);
    }
}
