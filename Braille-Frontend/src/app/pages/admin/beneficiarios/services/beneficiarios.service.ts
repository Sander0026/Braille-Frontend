import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BeneficiariosService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  // 👇 NOVA FUNÇÃO: Pega o "Crachá" (Token JWT) do usuário logado
  private getHeaders(): HttpHeaders {
    // Aqui assumimos que o token é guardado no localStorage no momento do login
    const token = localStorage.getItem('token_braille'); 
    
    // Se tiver token, envia. Se não tiver, envia vazio (e o backend vai bloquear com o 401)
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  uploadImagem(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    
    // 👇 Agora passamos os headers na requisição
    return this.http.post<{ url: string }>(`${this.apiUrl}/upload`, formData, { 
      headers: this.getHeaders() 
    });
  }

  criarBeneficiario(dados: any): Observable<any> {
    // 👇 Aqui também!
    return this.http.post(`${this.apiUrl}/beneficiaries`, dados, { 
      headers: this.getHeaders() 
    });
  }
}