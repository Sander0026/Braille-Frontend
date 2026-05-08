import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FiltroRelatorioAtendimento } from '../models/filtros-atendimento.model';
import { RelatorioAtendimentoIndividual } from '../models/relatorio-atendimento.model';

@Injectable({ providedIn: 'root' })
export class RelatorioAtendimentoApiService {
  private readonly url = '/api/atendimentos-individuais/relatorios';

  constructor(private readonly http: HttpClient) {}

  gerar(filtros: FiltroRelatorioAtendimento = {}): Observable<RelatorioAtendimentoIndividual> {
    let params = new HttpParams();
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<RelatorioAtendimentoIndividual>(this.url, { params });
  }
}
