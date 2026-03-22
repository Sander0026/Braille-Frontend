import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  totalFaltasNoperiodo: number;
  faltas: { id: string; dataAula: string; turma: { nome: string } }[];
}

@Injectable({ providedIn: 'root' })
export class AtestadosService {
  private readonly baseUrl = '/api/alunos';
  private readonly atestadosUrl = '/api/atestados';

  constructor(private readonly http: HttpClient) {}

  criar(alunoId: string, dto: CriarAtestadoDto): Observable<ResultadoCriacaoAtestado> {
    return this.http.post<ResultadoCriacaoAtestado>(`${this.baseUrl}/${alunoId}/atestados`, dto);
  }

  listar(alunoId: string): Observable<Atestado[]> {
    return this.http.get<Atestado[]>(`${this.baseUrl}/${alunoId}/atestados`);
  }

  preview(alunoId: string, dataInicio: string, dataFim: string): Observable<PreviewAtestado> {
    const params = new HttpParams().set('dataInicio', dataInicio).set('dataFim', dataFim);
    return this.http.get<PreviewAtestado>(`${this.baseUrl}/${alunoId}/atestados/preview`, { params });
  }

  findOne(id: string): Observable<Atestado> {
    return this.http.get<Atestado>(`${this.atestadosUrl}/${id}`);
  }

  remover(id: string): Observable<{ mensagem: string }> {
    return this.http.delete<{ mensagem: string }>(`${this.atestadosUrl}/${id}`);
  }

  atualizar(id: string, dto: AtualizarAtestadoDto): Observable<Atestado> {
    return this.http.patch<Atestado>(`${this.atestadosUrl}/${id}`, dto);
  }
}
