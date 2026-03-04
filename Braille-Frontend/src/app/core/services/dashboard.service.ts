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
    private cache$: Observable<DashboardStats> | null = null;
    private readonly cacheTimeMs = 5 * 60 * 1000; // 5 minutos

    constructor(private http: HttpClient) { }

    getEstatisticas(): Observable<DashboardStats> {
        if (!this.cache$) {
            this.cache$ = this.http.get<DashboardStats>(`${this.url}/estatisticas`).pipe(
                shareReplay(1)
            );
            // Invalida o cache após o tempo definido
            setTimeout(() => this.cache$ = null, this.cacheTimeMs);
        }
        return this.cache$;
    }

    limparCache(): void {
        this.cache$ = null;
    }
}
