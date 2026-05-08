import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  CertificadoLayoutConfig,
  TipoModeloCertificado
} from '../interfaces/certificados.interface';

export interface ModeloCertificado {
  id: string;
  nome: string;
  arteBaseUrl: string;
  assinaturaUrl: string;
  assinaturaUrl2?: string;
  textoTemplate: string;
  nomeAssinante: string;
  cargoAssinante: string;
  nomeAssinante2?: string;
  cargoAssinante2?: string;
  layoutConfig?: CertificadoLayoutConfig;
  tipo: TipoModeloCertificado;
  criadoEm?: string;
  atualizadoEm?: string;
  dataCriacao: string;
  dataAtualizacao: string;
}

export interface CertificadoCicloVidaResponse {
  id?: string;
  certificadoId?: string;
  pdfUrl?: string;
  codigoValidacao?: string;
  status?: string;
}

export interface EmitirManualAcademicoPayload {
  modeloId: string;
  alunoId: string;
  turmaId: string;
  matricula?: string;
  nomeAluno?: string;
  nomeCurso?: string;
  cargaHoraria?: string;
  dataInicio?: string;
  dataFim?: string;
  dataEmissao?: string;
}

export interface PreviewCertificadoPdfPayload {
  nomeAluno?: string;
  nomeCurso?: string;
  cargaHoraria?: string;
  nomeApoiador?: string;
  tituloAcao?: string;
  dataInicio?: string;
  dataFim?: string;
  dataEmissao?: string;
  motivo?: string;
}

type ModeloCertificadoApi = Omit<ModeloCertificado, 'dataCriacao' | 'dataAtualizacao'> & {
  dataCriacao?: string;
  dataAtualizacao?: string;
};

@Injectable({
  providedIn: 'root'
})
export class ModelosCertificadosService {
  private http = inject(HttpClient);
  private apiUrl = '/api/modelos-certificados';
  private certificadosUrl = '/api/certificados';

  listar(): Observable<ModeloCertificado[]> {
    return this.http.get<ModeloCertificadoApi[]>(this.apiUrl).pipe(
      map((modelos) => modelos.map((modelo) => this.normalizarModelo(modelo)))
    );
  }

  buscarPorId(id: string): Observable<ModeloCertificado> {
    return this.http.get<ModeloCertificadoApi>(`${this.apiUrl}/${id}`).pipe(
      map((modelo) => this.normalizarModelo(modelo))
    );
  }

  criar(dados: FormData): Observable<ModeloCertificado> {
    // FormData por conta dos uploads de arteBase e assinatura
    return this.http.post<ModeloCertificadoApi>(this.apiUrl, dados).pipe(
      map((modelo) => this.normalizarModelo(modelo))
    );
  }

  atualizar(id: string, dados: FormData): Observable<ModeloCertificado> {
    return this.http.patch<ModeloCertificadoApi>(`${this.apiUrl}/${id}`, dados).pipe(
      map((modelo) => this.normalizarModelo(modelo))
    );
  }

  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  validarAutenticidade(codigo: string): Observable<{
    valido: boolean;
    nome: string;
    curso: string;
    data: string;
    dataEmissao?: string;
    cargaHoraria?: string;
    codigoValidacao?: string;
    status?: string;
    mensagem?: string;
    tipo: string;
  }> {
    return this.http.get<{
      valido: boolean;
      nome: string;
      curso: string;
      data: string;
      dataEmissao?: string;
      cargaHoraria?: string;
      codigoValidacao?: string;
      status?: string;
      mensagem?: string;
      tipo: string;
    }>(`${this.certificadosUrl}/validar/${codigo}`);
  }

  emitirAcademico(turmaId: string, alunoId: string): Observable<{ pdfUrl: string; codigoValidacao: string }> {
    return this.http.post<{ pdfUrl: string; codigoValidacao: string }>(
      `${this.apiUrl}/emitir-academico`,
      { turmaId, alunoId },
    );
  }

  emitirManualAcademico(payload: EmitirManualAcademicoPayload): Observable<CertificadoCicloVidaResponse> {
    return this.http.post<CertificadoCicloVidaResponse>(
      `${this.apiUrl}/emitir-manual-academico`,
      payload,
    );
  }

  previewPdfReal(id: string, payload: PreviewCertificadoPdfPayload = {}): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/${id}/preview-pdf`, payload, {
      responseType: 'blob',
    });
  }

  emitirHonrariaManual(payload: {
    modeloId: string;
    apoiadorId: string;
    tituloAcao: string;
    motivo?: string;
    dataEvento: string;
  }): Observable<HttpResponse<Blob>> {
    return this.http.post(`${this.apiUrl}/emitir-honraria`, payload, {
      observe: 'response',
      responseType: 'blob',
    });
  }

  cancelarCertificado(certificadoId: string, motivo: string): Observable<CertificadoCicloVidaResponse> {
    return this.http.patch<CertificadoCicloVidaResponse>(
      `${this.apiUrl}/certificados/${certificadoId}/cancelar`,
      { motivo },
    );
  }

  reemitirCertificado(certificadoId: string): Observable<CertificadoCicloVidaResponse> {
    return this.http.post<CertificadoCicloVidaResponse>(
      `${this.apiUrl}/certificados/${certificadoId}/reemitir`,
      {},
    );
  }

  private normalizarModelo(modelo: ModeloCertificadoApi): ModeloCertificado {
    return {
      ...modelo,
      dataCriacao: modelo.dataCriacao || modelo.criadoEm || '',
      dataAtualizacao: modelo.dataAtualizacao || modelo.atualizadoEm || '',
    };
  }
}
