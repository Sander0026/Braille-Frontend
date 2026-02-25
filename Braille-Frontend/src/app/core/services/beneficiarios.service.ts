import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Beneficiario {
    id: string;
    nomeCompleto: string;
    cpfRg: string;
    dataNascimento: string;
    telefoneContato?: string;
    tipoDeficiencia?: string;
    statusAtivo: boolean;
    criadoEm: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: { total: number; page: number; lastPage: number };
}

@Injectable({ providedIn: 'root' })
export class BeneficiariosService {
    private readonly url = 'http://localhost:3000/beneficiaries';

    constructor(private http: HttpClient) { }

    listar(page = 1, limit = 10, nome?: string): Observable<PaginatedResponse<Beneficiario>> {
        let params = new HttpParams().set('page', page).set('limit', limit);
        if (nome) params = params.set('nome', nome);
        return this.http.get<PaginatedResponse<Beneficiario>>(this.url, { params });
    }

    buscarPorId(id: string): Observable<Beneficiario> {
        return this.http.get<Beneficiario>(`${this.url}/${id}`);
    }

    atualizar(id: string, dados: Partial<Beneficiario>): Observable<Beneficiario> {
        return this.http.patch<Beneficiario>(`${this.url}/${id}`, dados);
    }

    inativar(id: string): Observable<any> {
        return this.http.delete(`${this.url}/${id}`);
    }

    criarBeneficiario(dados: Record<string, unknown>): Observable<Beneficiario> {
        return this.http.post<Beneficiario>(this.url, dados);
    }

    uploadImagem(file: File): Observable<{ url: string }> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<{ url: string }>('http://localhost:3000/upload', formData);
    }
}
