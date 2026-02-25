import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DashboardStats {
    alunosAtivos: number;
    turmasAtivas: number;
    membrosEquipe: number;
    comunicadosGerais: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
    private readonly url = 'http://localhost:3000/dashboard';

    constructor(private http: HttpClient) { }

    getEstatisticas(): Observable<DashboardStats> {
        return this.http.get<DashboardStats>(`${this.url}/estatisticas`);
    }
}
