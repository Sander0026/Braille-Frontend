import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CertificadoLayoutConfig,
  TipoModeloCertificado
} from '../interfaces/certificados.interface';

export interface ModeloCertificado {
  id: string;
  nome: string;
  arteBaseUrl: string;
  assinaturaUrl: string;
  assinaturaUrl2?: string | null;
  textoTemplate: string;
  nomeAssinante: string;
  cargoAssinante: string;
  nomeAssinante2?: string | null;
  cargoAssinante2?: string | null;
  layoutConfig?: CertificadoLayoutConfig | null;
  tipo: TipoModeloCertificado;
  criadoEm: string;
  atualizadoEm: string;
}

export interface ValidacaoCertificadoResponse {
  valido: boolean;
  nome: string;
  curso: string;
  data: string;
  dataEmissao?: string;
  cargaHoraria?: string;
  codigoValidacao?: string;
  status?: string;
  tipo: string;
}

@Injectable({
  providedIn: 'root'
})
export class ModelosCertificadosService {
  private http = inject(HttpClient);
  private apiUrl = '/api/modelos-certificados';
  private certificadosUrl = '/api/certificados';

  listar(): Observable<ModeloCertificado[]> {
    return this.http.get<ModeloCertificado[]>(this.apiUrl);
  }

  buscarPorId(id: string): Observable<ModeloCertificado> {
    return this.http.get<ModeloCertificado>(`${this.apiUrl}/${id}`);
  }

  criar(dados: FormData): Observable<ModeloCertificado> {
    // FormData por conta dos uploads de arteBase e assinatura
    return this.http.post<ModeloCertificado>(this.apiUrl, dados);
  }

  atualizar(id: string, dados: FormData): Observable<ModeloCertificado> {
    return this.http.patch<ModeloCertificado>(`${this.apiUrl}/${id}`, dados);
  }

  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  validarAutenticidade(codigo: string): Observable<ValidacaoCertificadoResponse> {
    return this.http.get<ValidacaoCertificadoResponse>(`${this.certificadosUrl}/validar/${codigo}`);
  }

  emitirAcademico(turmaId: string, alunoId: string): Observable<{ pdfUrl: string; codigoValidacao: string }> {
    return this.http.post<{ pdfUrl: string; codigoValidacao: string }>(
      `${this.apiUrl}/emitir-academico`,
      { turmaId, alunoId },
    );
  }
}
