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
  // Opcionais recebidos/processados
  modeloCertificadoId?: string;
  motivoPersonalizado?: string;
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

  listar(skip?: number, take?: number, tipo?: string, search?: string, forceRefresh = false, ativo?: boolean): Observable<PaginatedResult<Apoiador>> {
    const cacheKey = `${skip}-${take}-${tipo}-${search}-${ativo}`;

    if (!forceRefresh && this.cacheLista[cacheKey]) {
      return of(this.cacheLista[cacheKey]);
    }

    let params = new HttpParams();
    if (skip !== undefined) params = params.set('skip', skip.toString());
    if (take !== undefined) params = params.set('take', take.toString());
    if (tipo) params = params.set('tipo', tipo);
    if (search) params = params.set('search', search);
    if (ativo !== undefined) params = params.set('ativo', ativo.toString());

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

  inativar(id: string): Observable<Apoiador> {
    return this.http.patch<Apoiador>(`${this.apiUrl}/${id}/inativar`, {}).pipe(
      tap(() => this.limparCache())
    );
  }

  reativar(id: string): Observable<Apoiador> {
    return this.http.patch<Apoiador>(`${this.apiUrl}/${id}/reativar`, {}).pipe(
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

  adicionarAcao(id: string, payload: {
    dataEvento: string;
    descricaoAcao: string;
    modeloCertificadoId?: string;
    motivoPersonalizado?: string;
  }): Observable<AcaoApoiador> {
    return this.http.post<AcaoApoiador>(`${this.apiUrl}/${id}/acoes`, payload).pipe(
      tap(() => this.limparCache())
    );
  }

  editarAcao(apoiadorId: string, acaoId: string, payload: {
    dataEvento: string;
    descricaoAcao: string;
    modeloCertificadoId?: string;
    motivoPersonalizado?: string;
  }): Observable<AcaoApoiador> {
    return this.http.patch<AcaoApoiador>(`${this.apiUrl}/${apoiadorId}/acoes/${acaoId}`, payload).pipe(
      tap(() => this.limparCache())
    );
  }

  removerAcao(apoiadorId: string, acaoId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${apoiadorId}/acoes/${acaoId}`).pipe(
      tap(() => this.limparCache())
    );
  }

  // ---- Certificados de Honraria ---- //

  listarCertificados(apoiadorId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${apoiadorId}/certificados`);
  }

  emitirCertificado(apoiadorId: string, payload: {
    modeloId: string;
    acaoId?: string;
    motivoPersonalizado?: string;
    dataEmissao?: string;
  }): Observable<{ certificado: any; pdfBase64: string }> {
    return this.http.post<{ certificado: any; pdfBase64: string }>(
      `${this.apiUrl}/${apoiadorId}/certificados`,
      payload
    );
  }

  gerarPdfCertificado(apoiadorId: string, certId: string): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/${apoiadorId}/certificados/${certId}/pdf`,
      { responseType: 'blob' }
    );
  }
}
