import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  CertificadoLayoutConfig,
  TesteGeracaoCertificadoPayload,
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

  validarAutenticidade(codigo: string): Observable<{ valido: boolean, nome: string, curso: string, data: string, tipo: string }> {
    return this.http.get<{ valido: boolean, nome: string, curso: string, data: string, tipo: string }>(`${this.certificadosUrl}/validar/${codigo}`);
  }

  testarGeracaoGeometrica(payload: TesteGeracaoCertificadoPayload): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/teste`, payload, { responseType: 'blob' });
  }

  emitirAcademico(turmaId: string, alunoId: string): Observable<{ pdfUrl: string; codigoValidacao: string }> {
    return this.http.post<{ pdfUrl: string; codigoValidacao: string }>(
      `${this.apiUrl}/emitir-academico`,
      { turmaId, alunoId },
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
