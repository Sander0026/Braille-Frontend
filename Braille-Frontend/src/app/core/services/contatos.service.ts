import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { PaginatedResponse } from './beneficiarios.service';

export interface Contato {
    id: string;
    nome: string;
    email: string;
    telefone?: string;
    assunto?: string;
    mensagem?: string | null; // Proteção contra logs legado/corrompidos sem quebrar tipagem
    lida: boolean;
    criadoEm: string;
}

@Injectable({ providedIn: 'root' })
export class ContatosService {
    private readonly url = '/api/contatos';
    // Cache Passivo O(1) sem Leaks (GC Collector tracking)
    private readonly cache = new Map<string, { data$: Observable<PaginatedResponse<Contato>>, expiresAt: number }>();
    private readonly cacheTimeMs = 2 * 60 * 1000; // 2 minutos

    constructor(private readonly http: HttpClient) { }

    limparCache(): void {
        this.cache.clear();
    }

    private buildCacheKey(page: number, limit: number, lida?: boolean): string {
        return `${page}|${limit}|${lida ?? 'all'}`;
    }

    listar(page = 1, limit = 20, lida?: boolean): Observable<PaginatedResponse<Contato>> {
        const key = this.buildCacheKey(page, limit, lida);
        const now = Date.now();

        if (this.cache.has(key) && this.cache.get(key)!.expiresAt > now) {
            return this.cache.get(key)!.data$;
        }

        let params = new HttpParams().set('page', page).set('limit', limit);
        if (lida !== undefined) params = params.set('lida', String(lida));

        const req$ = this.http.get<PaginatedResponse<Contato>>(this.url, { params }).pipe(shareReplay(1));
        this.cache.set(key, { data$: req$, expiresAt: now + this.cacheTimeMs });

        return req$;
    }

    buscarPorId(id: string): Observable<Contato> {
        return this.http.get<Contato>(`${this.url}/${id}`);
    }

    marcarComoLida(id: string): Observable<any> {
        this.limparCache();
        return this.http.patch(`${this.url}/${id}/lida`, {});
    }

    excluir(id: string): Observable<any> {
        this.limparCache();
        return this.http.delete(`${this.url}/${id}`);
    }
}
