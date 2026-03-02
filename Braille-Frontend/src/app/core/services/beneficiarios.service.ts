import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Beneficiario {
    id: string;
    nomeCompleto: string;
    cpfRg: string;
    dataNascimento: string;
    genero?: string;
    telefoneContato?: string;
    email?: string;
    fotoPerfil?: string;
    cep?: string;
    rua?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
    tipoDeficiencia?: string;
    causaDeficiencia?: string;
    idadeOcorrencia?: string;
    laudoUrl?: string;
    tecAssistivas?: string;
    prefAcessibilidade?: string;
    escolaridade?: string;
    profissao?: string;
    rendaFamiliar?: string;
    beneficiosGov?: string;
    composicaoFamiliar?: string;
    precisaAcompanhante?: boolean;
    acompOftalmologico?: boolean;
    outrasComorbidades?: string;
    contatoEmergencia?: string;
    statusAtivo: boolean;
    criadoEm: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: { total: number; page: number; lastPage: number };
}

@Injectable({ providedIn: 'root' })
export class BeneficiariosService {
    private readonly url = '/api/beneficiaries';

    constructor(private http: HttpClient) { }

    listar(page = 1, limit = 10, nome?: string, inativos?: boolean): Observable<PaginatedResponse<Beneficiario>> {
        let params = new HttpParams().set('page', page).set('limit', limit);
        if (nome) params = params.set('nome', nome);
        if (inativos) params = params.set('inativos', 'true');
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

    restaurar(id: string): Observable<any> {
        return this.http.patch(`${this.url}/${id}/restore`, {});
    }

    excluirDefinitivo(id: string): Observable<any> {
        return this.http.delete(`${this.url}/${id}/hard`);
    }

    criarBeneficiario(dados: Record<string, unknown>): Observable<Beneficiario> {
        return this.http.post<Beneficiario>(this.url, dados);
    }

    uploadImagem(file: File): Observable<{ url: string }> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<{ url: string }>('/api/upload', formData);
    }

    excluirArquivo(urlArquivo: string): Observable<any> {
        let params = new HttpParams().set('url', urlArquivo);
        return this.http.delete('/api/upload', { params });
    }
}
