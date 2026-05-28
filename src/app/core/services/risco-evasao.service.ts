import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  NivelRiscoEvasao,
  StatusAcaoRiscoEvasao,
  TipoAcaoRiscoEvasao,
} from './relatorios.service';

export interface CriarAcaoRiscoEvasaoPayload {
  alunoId: string;
  turmaId?: string;
  responsavelId?: string;
  nivel: NivelRiscoEvasao;
  tipoAcao: TipoAcaoRiscoEvasao;
  motivoRisco: string;
  descricao?: string;
  prazo?: string;
}

export interface AtualizarAcaoRiscoEvasaoPayload {
  responsavelId?: string;
  tipoAcao?: TipoAcaoRiscoEvasao;
  status?: StatusAcaoRiscoEvasao;
  descricao?: string;
  resultado?: string;
  prazo?: string;
}

export interface AcaoRiscoEvasao {
  id: string;
  alunoId: string;
  turmaId?: string | null;
  responsavelId?: string | null;
  nivel: NivelRiscoEvasao;
  tipoAcao: TipoAcaoRiscoEvasao;
  status: StatusAcaoRiscoEvasao;
  motivoRisco: string;
  descricao?: string | null;
  prazo?: string | null;
  resultado?: string | null;
  criadoPorId?: string | null;
  criadoEm: string;
  atualizadoEm: string;
  resolvidoEm?: string | null;
  vencida: boolean;
  aluno: {
    id: string;
    nomeCompleto: string;
    matricula?: string | null;
  };
  turma?: {
    id: string;
    nome: string;
    professorId: string;
    professor: { id: string; nome: string };
  } | null;
  responsavel?: {
    id: string;
    nome: string;
    role: string;
  } | null;
}

@Injectable({ providedIn: 'root' })
export class RiscoEvasaoService {
  private readonly url = '/api/risco-evasao/acoes';

  constructor(private readonly http: HttpClient) {}

  criar(payload: CriarAcaoRiscoEvasaoPayload): Observable<AcaoRiscoEvasao> {
    return this.http.post<AcaoRiscoEvasao>(this.url, this.limpar(payload));
  }

  buscar(id: string): Observable<AcaoRiscoEvasao> {
    return this.http.get<AcaoRiscoEvasao>(`${this.url}/${id}`);
  }

  atualizar(id: string, payload: AtualizarAcaoRiscoEvasaoPayload): Observable<AcaoRiscoEvasao> {
    return this.http.patch<AcaoRiscoEvasao>(`${this.url}/${id}`, this.limpar(payload));
  }

  atualizarStatus(
    id: string,
    status: StatusAcaoRiscoEvasao,
    resultado?: string,
  ): Observable<AcaoRiscoEvasao> {
    return this.http.patch<AcaoRiscoEvasao>(`${this.url}/${id}/status`, this.limpar({ status, resultado }));
  }

  listar(params: Record<string, string | number | undefined> = {}): Observable<unknown> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') httpParams = httpParams.set(key, String(value));
    });
    return this.http.get(this.url, { params: httpParams });
  }

  cancelar(id: string): Observable<AcaoRiscoEvasao> {
    return this.http.delete<AcaoRiscoEvasao>(`${this.url}/${id}`);
  }

  private limpar<T extends object>(payload: T): Partial<T> {
    const limpo: Partial<T> = {};
    Object.entries(payload as Record<string, unknown>).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        limpo[key as keyof T] = value as T[keyof T];
      }
    });
    return limpo;
  }
}
