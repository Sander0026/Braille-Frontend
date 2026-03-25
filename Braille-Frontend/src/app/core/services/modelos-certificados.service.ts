import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

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
  layoutConfig?: any;
  tipo: 'ACADEMICO' | 'HONRARIA';
  dataCriacao: string;
  dataAtualizacao: string;
}

@Injectable({
  providedIn: 'root'
})
export class ModelosCertificadosService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/modelos-certificados`;
  private certificadosUrl = `${environment.apiUrl}/certificados`;

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

  validarAutenticidade(codigo: string): Observable<{ valido: boolean, nome: string, curso: string, data: string, tipo: string }> {
    return this.http.get<{ valido: boolean, nome: string, curso: string, data: string, tipo: string }>(`${this.certificadosUrl}/validar/${codigo}`);
  }

  testarGeracaoGeometrica(payload: any): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/teste`, payload, { responseType: 'blob' });
  }

  emitirAcademico(matriculaId: string): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/emitir/${matriculaId}`, {}, { responseType: 'blob' });
  }
}
