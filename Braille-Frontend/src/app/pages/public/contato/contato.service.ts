import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ContatoPayload {
  nome: string;
  email?: string;
  telefone?: string;
  assunto: string;
  mensagem: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContatoService {
  private readonly apiUrl = '/api/contatos';

  constructor(private http: HttpClient) {}

  enviarContato(payload: ContatoPayload): Observable<void> {
    return this.http.post<void>(this.apiUrl, payload);
  }
}
