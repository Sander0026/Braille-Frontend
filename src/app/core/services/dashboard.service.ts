import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';

export interface DashboardStats {
    alunosAtivos: number;
    turmasAtivas: number;
    membrosEquipe: number;
    comunicadosGerais: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
    private readonly url = '/api/dashboard';
    private cache: { data$: Observable<DashboardStats>, expiresAt: number } | null = null;
    private readonly cacheTimeMs = 5 * 60 * 1000; // 5 minutos

    constructor(private readonly http: HttpClient) { }

    getEstatisticas(): Observable<DashboardStats> {
        const now = Date.now();
        if (this.cache && this.cache.expiresAt > now) {
            return this.cache.data$;
        }

        const req$ = this.http.get<DashboardStats>(`${this.url}/estatisticas`).pipe(shareReplay(1));
        this.cache = { data$: req$, expiresAt: now + this.cacheTimeMs };
        return req$;
    }

    limparCache(): void {
        this.cache = null;
    }
}
