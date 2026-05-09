import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaginatedResponse } from '../../../core/services/beneficiarios.service';
import {
  AcompanhamentoIndividual,
  CriarAcompanhamentoIndividualPayload,
} from '../models/acompanhamento-individual.model';
import {
  AtendimentoIndividual,
  CriarAtendimentoIndividualPayload,
} from '../models/atendimento-individual.model';
import { FiltroAcompanhamentoIndividual } from '../models/filtros-atendimento.model';
import { DashboardAtendimentoIndividual } from '../models/dashboard-atendimento.model';

@Injectable({ providedIn: 'root' })
export class AtendimentosIndividuaisApiService {
  private readonly url = '/api/atendimentos-individuais';

  constructor(private readonly http: HttpClient) {}

  listar(filtros: FiltroAcompanhamentoIndividual = {}): Observable<PaginatedResponse<AcompanhamentoIndividual>> {
    let params = new HttpParams()
      .set('page', filtros.page ?? 1)
      .set('limit', filtros.limit ?? 20);

    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && key !== 'page' && key !== 'limit') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<PaginatedResponse<AcompanhamentoIndividual>>(`${this.url}/acompanhamentos`, { params });
  }

  buscar(id: string): Observable<AcompanhamentoIndividual> {
    return this.http.get<AcompanhamentoIndividual>(`${this.url}/acompanhamentos/${id}`);
  }

  dashboard(): Observable<DashboardAtendimentoIndividual> {
    return this.http.get<DashboardAtendimentoIndividual>(`${this.url}/acompanhamentos/dashboard`);
  }

  criar(payload: CriarAcompanhamentoIndividualPayload): Observable<AcompanhamentoIndividual> {
    return this.http.post<AcompanhamentoIndividual>(`${this.url}/acompanhamentos`, payload);
  }

  verificarDuplicidade(params: {
    alunoId: string;
    professorId?: string;
    assuntoAtual: string;
  }): Observable<{ duplicado: boolean; acompanhamento?: AcompanhamentoIndividual | null; mensagem?: string | null }> {
    let httpParams = new HttpParams()
      .set('alunoId', params.alunoId)
      .set('assuntoAtual', params.assuntoAtual);

    if (params.professorId) {
      httpParams = httpParams.set('professorId', params.professorId);
    }

    return this.http.get<{ duplicado: boolean; acompanhamento?: AcompanhamentoIndividual | null; mensagem?: string | null }>(
      `${this.url}/acompanhamentos/duplicidade`,
      { params: httpParams },
    );
  }

  atualizarAssunto(id: string, payload: { assuntoAtual: string; motivoAlteracao?: string }): Observable<AcompanhamentoIndividual> {
    return this.http.patch<AcompanhamentoIndividual>(`${this.url}/acompanhamentos/${id}/assunto`, payload);
  }

  finalizar(id: string, payload: { resultadoFinal?: string; resumoFinal?: string }): Observable<AcompanhamentoIndividual> {
    return this.http.patch<AcompanhamentoIndividual>(`${this.url}/acompanhamentos/${id}/finalizar`, payload);
  }

  reabrir(id: string): Observable<AcompanhamentoIndividual> {
    return this.http.patch<AcompanhamentoIndividual>(`${this.url}/acompanhamentos/${id}/reabrir`, {});
  }

  arquivar(id: string): Observable<AcompanhamentoIndividual> {
    return this.http.patch<AcompanhamentoIndividual>(`${this.url}/acompanhamentos/${id}/arquivar`, {});
  }

  desarquivar(id: string): Observable<AcompanhamentoIndividual> {
    return this.http.patch<AcompanhamentoIndividual>(`${this.url}/acompanhamentos/${id}/desarquivar`, {});
  }

  criarAtendimento(acompanhamentoId: string, payload: CriarAtendimentoIndividualPayload): Observable<AtendimentoIndividual> {
    return this.http.post<AtendimentoIndividual>(`${this.url}/acompanhamentos/${acompanhamentoId}/atendimentos`, payload);
  }

  listarAtendimentos(acompanhamentoId: string): Observable<AtendimentoIndividual[]> {
    return this.http.get<AtendimentoIndividual[]>(`${this.url}/acompanhamentos/${acompanhamentoId}/atendimentos`);
  }
}
