import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface AcaoApoiador {
  id: string;
  dataEvento: string;
  descricaoAcao: string;
  apoiadorId: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface Apoiador {
  id: string;
  tipo: 'VOLUNTARIO' | 'EMPRESA' | 'IMPRENSA' | 'PROFISSIONAL_LIBERAL' | 'ONG' | 'OUTRO';
  nomeRazaoSocial: string;
  nomeFantasia?: string;
  cpfCnpj?: string;
  contatoPessoa?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  atividadeEspecialidade?: string;
  observacoes?: string;
  logoUrl?: string;
  exibirNoSite: boolean;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
  acoes?: AcaoApoiador[];
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class ApoiadoresService {
  private readonly apiUrl = `${environment.apiUrl}/apoiadores`;

  private cacheLista: { [key: string]: PaginatedResult<Apoiador> } = {};
  private cachePublicos: Apoiador[] | null = null;

  constructor(private readonly http: HttpClient) {}

  limparCache(): void {
    this.cacheLista = {};
    this.cachePublicos = null;
  }

  listar(skip?: number, take?: number, tipo?: string, search?: string, forceRefresh = false): Observable<PaginatedResult<Apoiador>> {
    const cacheKey = `${skip}-${take}-${tipo}-${search}`;

    if (!forceRefresh && this.cacheLista[cacheKey]) {
      return of(this.cacheLista[cacheKey]);
    }

    let params = new HttpParams();
    if (skip !== undefined) params = params.set('skip', skip.toString());
    if (take !== undefined) params = params.set('take', take.toString());
    if (tipo) params = params.set('tipo', tipo);
    if (search) params = params.set('search', search);

    return this.http.get<PaginatedResult<Apoiador>>(this.apiUrl, { params }).pipe(
      tap(res => this.cacheLista[cacheKey] = res)
    );
  }

  buscarPublicos(forceRefresh = false): Observable<Apoiador[]> {
    if (!forceRefresh && this.cachePublicos) {
      return of(this.cachePublicos);
    }
    return this.http.get<Apoiador[]>(`${this.apiUrl}/publicos`).pipe(
      tap(res => this.cachePublicos = res)
    );
  }

  obterPorId(id: string): Observable<Apoiador> {
    return this.http.get<Apoiador>(`${this.apiUrl}/${id}`);
  }

  criar(dados: Partial<Apoiador>): Observable<Apoiador> {
    return this.http.post<Apoiador>(this.apiUrl, dados).pipe(
      tap(() => this.limparCache())
    );
  }

  atualizar(id: string, dados: Partial<Apoiador>): Observable<Apoiador> {
    return this.http.patch<Apoiador>(`${this.apiUrl}/${id}`, dados).pipe(
      tap(() => this.limparCache())
    );
  }

  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.limparCache())
    );
  }

  uploadLogo(id: string, file: File): Observable<Apoiador> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.patch<Apoiador>(`${this.apiUrl}/${id}/logo`, formData).pipe(
      tap(() => this.limparCache())
    );
  }

  // ---- Histórico de Ações (CRM Tracking) ---- //

  buscarAcoes(id: string): Observable<AcaoApoiador[]> {
    return this.http.get<AcaoApoiador[]>(`${this.apiUrl}/${id}/acoes`);
  }

  adicionarAcao(id: string, dataEvento: string, descricaoAcao: string): Observable<AcaoApoiador> {
    return this.http.post<AcaoApoiador>(`${this.apiUrl}/${id}/acoes`, { dataEvento, descricaoAcao }).pipe(
      tap(() => this.limparCache())
    );
  }

  removerAcao(apoiadorId: string, acaoId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${apoiadorId}/acoes/${acaoId}`).pipe(
      tap(() => this.limparCache())
    );
  }
}
