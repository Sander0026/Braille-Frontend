import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LaudoMedico {
  id: string;
  alunoId: string;
  dataEmissao: string;
  medicoResponsavel?: string;
  descricao?: string;
  arquivoUrl: string;
  registradoPorId?: string;
  criadoEm: string;
}

export interface CriarLaudoDto {
  dataEmissao: string;
  medicoResponsavel?: string;
  descricao?: string;
  arquivoUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class LaudosService {
  private readonly apiUrl = `${environment.apiUrl}`;

  constructor(private readonly http: HttpClient) {}

  listarPorAluno(alunoId: string): Observable<LaudoMedico[]> {
    return this.http.get<LaudoMedico[]>(`${this.apiUrl}/alunos/${alunoId}/laudos`);
  }

  criar(alunoId: string, dto: CriarLaudoDto): Observable<LaudoMedico> {
    return this.http.post<LaudoMedico>(`${this.apiUrl}/alunos/${alunoId}/laudos`, dto);
  }

  atualizar(id: string, dto: Partial<CriarLaudoDto>): Observable<LaudoMedico> {
    return this.http.patch<LaudoMedico>(`${this.apiUrl}/laudos/${id}`, dto);
  }

  remover(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/laudos/${id}`);
  }
}
