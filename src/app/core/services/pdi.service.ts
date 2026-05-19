import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type StatusPdi = 'ATIVO' | 'CONCLUIDO' | 'SUSPENSO' | 'ARQUIVADO';
export type AreaPdi =
  | 'BRAILLE'
  | 'ORIENTACAO_MOBILIDADE'
  | 'INFORMATICA_ACESSIVEL'
  | 'AUTONOMIA'
  | 'SOCIALIZACAO'
  | 'ATIVIDADE_PEDAGOGICA'
  | 'OUTRO';
export type StatusMetaPdi =
  | 'NAO_INICIADA'
  | 'EM_ANDAMENTO'
  | 'ALCANCADA'
  | 'PARCIALMENTE_ALCANCADA'
  | 'NAO_ALCANCADA'
  | 'CANCELADA';

export interface PdiMeta {
  id: string;
  pdiId: string;
  area: AreaPdi;
  descricao: string;
  estrategia?: string | null;
  prazo?: string | null;
  status: StatusMetaPdi;
  criadoEm: string;
  atualizadoEm: string;
}

export interface PdiEvolucao {
  id: string;
  pdiId: string;
  dataRegistro: string;
  descricao: string;
  dificuldades?: string | null;
  avancos?: string | null;
  proximosPassos?: string | null;
  registradoPor?: { id: string; nome: string; role: string } | null;
  criadoEm: string;
}

export interface PdiAluno {
  id: string;
  alunoId: string;
  professorResponsavelId?: string | null;
  titulo: string;
  objetivoGeral: string;
  diagnosticoInicial?: string | null;
  necessidadesAcessibilidade?: string | null;
  recursosUtilizados?: string | null;
  observacoesGerais?: string | null;
  dataInicio: string;
  dataFimPrevista?: string | null;
  dataConclusao?: string | null;
  status: StatusPdi;
  criadoPorId?: string | null;
  criadoEm: string;
  atualizadoEm: string;
  aluno?: { id: string; nomeCompleto: string; matricula?: string | null; statusAtivo?: boolean };
  professorResponsavel?: { id: string; nome: string; role: string } | null;
  metas: PdiMeta[];
  evolucoes: PdiEvolucao[];
}

export interface CriarPdiPayload {
  alunoId: string;
  professorResponsavelId?: string;
  titulo: string;
  objetivoGeral: string;
  diagnosticoInicial?: string;
  necessidadesAcessibilidade?: string;
  recursosUtilizados?: string;
  observacoesGerais?: string;
  dataInicio?: string;
  dataFimPrevista?: string;
}

export interface AtualizarPdiPayload extends Partial<Omit<CriarPdiPayload, 'alunoId'>> {
  dataConclusao?: string;
  status?: StatusPdi;
}

export interface CriarPdiMetaPayload {
  area: AreaPdi;
  descricao: string;
  estrategia?: string;
  prazo?: string;
}

export interface AtualizarPdiMetaPayload extends Partial<CriarPdiMetaPayload> {
  status?: StatusMetaPdi;
}

export interface CriarPdiEvolucaoPayload {
  descricao: string;
  dificuldades?: string;
  avancos?: string;
  proximosPassos?: string;
  dataRegistro?: string;
}

@Injectable({ providedIn: 'root' })
export class PdiService {
  private readonly url = '/api/pdi';

  constructor(private readonly http: HttpClient) {}

  listar(params: Record<string, string | number | undefined> = {}): Observable<{ data: PdiAluno[]; meta: unknown }> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') httpParams = httpParams.set(key, String(value));
    });
    return this.http.get<{ data: PdiAluno[]; meta: unknown }>(this.url, { params: httpParams });
  }

  criar(payload: CriarPdiPayload): Observable<PdiAluno> {
    return this.http.post<PdiAluno>(this.url, this.limpar(payload));
  }

  buscar(id: string): Observable<PdiAluno> {
    return this.http.get<PdiAluno>(`${this.url}/${id}`);
  }

  atualizar(id: string, payload: AtualizarPdiPayload): Observable<PdiAluno> {
    return this.http.patch<PdiAluno>(`${this.url}/${id}`, this.limpar(payload));
  }

  arquivar(id: string): Observable<PdiAluno> {
    return this.http.delete<PdiAluno>(`${this.url}/${id}`);
  }

  listarPorAluno(alunoId: string): Observable<PdiAluno[]> {
    return this.http.get<PdiAluno[]>(`${this.url}/aluno/${alunoId}`);
  }

  buscarAtivoPorAluno(alunoId: string): Observable<PdiAluno | null> {
    return this.http.get<PdiAluno | null>(`${this.url}/aluno/${alunoId}/ativo`);
  }

  criarMeta(pdiId: string, payload: CriarPdiMetaPayload): Observable<PdiMeta> {
    return this.http.post<PdiMeta>(`${this.url}/${pdiId}/metas`, this.limpar(payload));
  }

  atualizarMeta(pdiId: string, metaId: string, payload: AtualizarPdiMetaPayload): Observable<PdiMeta> {
    return this.http.patch<PdiMeta>(`${this.url}/${pdiId}/metas/${metaId}`, this.limpar(payload));
  }

  excluirMeta(pdiId: string, metaId: string): Observable<{ id: string }> {
    return this.http.delete<{ id: string }>(`${this.url}/${pdiId}/metas/${metaId}`);
  }

  criarEvolucao(pdiId: string, payload: CriarPdiEvolucaoPayload): Observable<PdiEvolucao> {
    return this.http.post<PdiEvolucao>(`${this.url}/${pdiId}/evolucoes`, this.limpar(payload));
  }

  listarEvolucoes(pdiId: string): Observable<PdiEvolucao[]> {
    return this.http.get<PdiEvolucao[]>(`${this.url}/${pdiId}/evolucoes`);
  }

  excluirEvolucao(pdiId: string, evolucaoId: string): Observable<{ id: string }> {
    return this.http.delete<{ id: string }>(`${this.url}/${pdiId}/evolucoes/${evolucaoId}`);
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
