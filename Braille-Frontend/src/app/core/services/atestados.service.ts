import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface Atestado {
  id: string;
  alunoId: string;
  dataInicio: string;
  dataFim: string;
  motivo: string;
  arquivoUrl?: string;
  registradoPorId: string;
  criadoEm: string;
  frequencias?: {
    id: string;
    dataAula: string;
    status: 'PRESENTE' | 'FALTA' | 'FALTA_JUSTIFICADA';
    turma: { id: string; nome: string };
  }[];
  aluno?: { id: string; nomeCompleto: string; matricula?: string };
}

export interface CriarAtestadoDto {
  dataInicio: string;
  dataFim: string;
  motivo: string;
  arquivoUrl?: string;
}

export interface AtualizarAtestadoDto {
  motivo?: string;
  arquivoUrl?: string;
}

export interface ResultadoCriacaoAtestado {
  atestado: Atestado;
  faltasJustificadas: number;
  mensagem: string;
}

export interface PreviewAtestado {
  totalFaltasNoPeriodo: number;
  faltas: { id: string; dataAula: string; turma: { nome: string } }[];
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class AtestadosService {
  private readonly baseUrl = '/api/alunos';
  private readonly atestadosUrl = '/api/atestados';

  constructor(private readonly http: HttpClient) {}

  criar(alunoId: string, dto: CriarAtestadoDto): Observable<ResultadoCriacaoAtestado> {
    return this.http
      .post<ApiResponse<ResultadoCriacaoAtestado>>(`${this.baseUrl}/${alunoId}/atestados`, dto)
      .pipe(map((response) => response.data));
  }

  listar(alunoId: string): Observable<Atestado[]> {
    return this.http
      .get<ApiResponse<Atestado[]>>(`${this.baseUrl}/${alunoId}/atestados`)
      .pipe(map((response) => Array.isArray(response.data) ? response.data : []));
  }

  preview(alunoId: string, dataInicio: string, dataFim: string): Observable<PreviewAtestado> {
    const params = new HttpParams().set('dataInicio', dataInicio).set('dataFim', dataFim);
    return this.http
      .get<ApiResponse<PreviewAtestado>>(`${this.baseUrl}/${alunoId}/atestados/preview`, { params })
      .pipe(map((response) => response.data));
  }

  findOne(id: string): Observable<Atestado> {
    return this.http
      .get<ApiResponse<Atestado>>(`${this.atestadosUrl}/${id}`)
      .pipe(map((response) => response.data));
  }

  remover(id: string): Observable<{ mensagem: string }> {
    return this.http
      .delete<ApiResponse<{ id: string; revertidas: number }>>(`${this.atestadosUrl}/${id}`)
      .pipe(map((response) => ({ mensagem: response.message ?? 'Atestado removido com sucesso.' })));
  }

  atualizar(id: string, dto: AtualizarAtestadoDto): Observable<Atestado> {
    return this.http
      .patch<ApiResponse<Atestado>>(`${this.atestadosUrl}/${id}`, dto)
      .pipe(map((response) => response.data));
  }
}
