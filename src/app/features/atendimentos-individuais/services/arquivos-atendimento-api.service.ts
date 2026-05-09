import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ArquivoAtendimentoIndividual, CategoriaArquivoAtendimentoIndividual } from '../models/arquivo-atendimento.model';

@Injectable({ providedIn: 'root' })
export class ArquivosAtendimentoApiService {
  private readonly baseUrl = '/api/atendimentos-individuais';

  constructor(private readonly http: HttpClient) {}

  anexar(
    atendimentoId: string,
    file: File,
    categoria: CategoriaArquivoAtendimentoIndividual = 'OUTRO',
  ): Observable<ArquivoAtendimentoIndividual> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('categoria', categoria);
    return this.http.post<ArquivoAtendimentoIndividual>(`${this.baseUrl}/atendimentos/${atendimentoId}/arquivos`, formData);
  }

  download(arquivoId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/arquivos/${arquivoId}/download`, {
      responseType: 'blob',
    });
  }
}
