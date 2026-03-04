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
    mensagem: string;
    lida: boolean;
    criadoEm: string;
}

@Injectable({ providedIn: 'root' })
export class ContatosService {
    private readonly url = '/api/contatos';
    // Cache por chave — funciona para todos os filtros (todas, lidas, não-lidas) e paginações
    private cache = new Map<string, Observable<PaginatedResponse<Contato>>>();
    private readonly cacheTimeMs = 2 * 60 * 1000; // 2 minutos

    constructor(private http: HttpClient) { }

    limparCache(): void {
        this.cache.clear();
    }

    private buildCacheKey(page: number, limit: number, lida?: boolean): string {
        return `${page}|${limit}|${lida ?? 'all'}`;
    }

    listar(page = 1, limit = 20, lida?: boolean): Observable<PaginatedResponse<Contato>> {
        const key = this.buildCacheKey(page, limit, lida);

        if (!this.cache.has(key)) {
            let params = new HttpParams().set('page', page).set('limit', limit);
            if (lida !== undefined) params = params.set('lida', String(lida));

            const req$ = this.http.get<PaginatedResponse<Contato>>(this.url, { params }).pipe(shareReplay(1));
            this.cache.set(key, req$);
            setTimeout(() => this.cache.delete(key), this.cacheTimeMs);
        }

        return this.cache.get(key)!;
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
