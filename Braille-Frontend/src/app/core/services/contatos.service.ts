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
    // Cache separado para não-lidas (aba padrão) e lidas
    private cacheNaoLidas$: Observable<PaginatedResponse<Contato>> | null = null;
    private readonly cacheTimeMs = 2 * 60 * 1000; // 2 minutos

    constructor(private http: HttpClient) { }

    limparCache(): void {
        this.cacheNaoLidas$ = null;
    }

    listar(page = 1, limit = 20, lida?: boolean): Observable<PaginatedResponse<Contato>> {
        const isDefaultList = page === 1 && limit === 20 && lida === undefined;

        if (isDefaultList) {
            if (!this.cacheNaoLidas$) {
                const params = new HttpParams().set('page', '1').set('limit', '20');
                this.cacheNaoLidas$ = this.http.get<PaginatedResponse<Contato>>(this.url, { params }).pipe(shareReplay(1));
                setTimeout(() => this.limparCache(), this.cacheTimeMs);
            }
            return this.cacheNaoLidas$;
        }

        let params = new HttpParams().set('page', page).set('limit', limit);
        if (lida !== undefined) params = params.set('lida', String(lida));
        return this.http.get<PaginatedResponse<Contato>>(this.url, { params });
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
