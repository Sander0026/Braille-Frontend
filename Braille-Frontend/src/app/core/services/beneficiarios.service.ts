import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { DashboardService } from './dashboard.service';

export interface Beneficiario {
    id: string;
    nomeCompleto: string;
    cpf: string | null;
  rg: string | null;
    dataNascimento: string;
    genero?: string;
    corRaca?: string;
    estadoCivil?: string;
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
    termoLgpdUrl?: string;
    termoLgpdAceito?: boolean;
    termoLgpdAceitoEm?: string;
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
    matricula?: string;
    matriculasOficina?: {
        id: string;
        status: 'ATIVA' | 'CONCLUIDA' | 'EVADIDA' | 'CANCELADA';
        dataEntrada: string;
        dataEncerramento?: string;
        turma: { id: string; nome: string; horario?: string };
    }[];
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: { total: number; page: number; lastPage: number };
}

/** Resposta quando o CPF/RG já existe inativo no sistema */
export interface ReativacaoAluno {
    _reativacao: true;
    id: string;
    nomeCompleto: string;
    matricula?: string;
    statusAtivo: boolean;
    excluido: boolean;
    message: string;
}


@Injectable({ providedIn: 'root' })
export class BeneficiariosService {
    private readonly url = '/api/beneficiaries';
    // Cache por chave — cobre ativos, inativos, busca por nome e qualquer paginaçao
    private cache = new Map<string, Observable<PaginatedResponse<Beneficiario>>>();
    private readonly cacheTimeMs = 2 * 60 * 1000; // 2 minutos

    constructor(private readonly http: HttpClient, private readonly dashboardService: DashboardService) { }

    limparCache(): void {
        this.cache.clear();
        this.dashboardService.limparCache();
    }

    private buildCacheKey(page: number, limit: number, busca?: string, inativos?: boolean, filtros?: Record<string, any>): string {
        const filtrosStr = filtros ? JSON.stringify(filtros) : '';
        return `${page}|${limit}|${busca ?? ''}|${inativos ?? false}|${filtrosStr}`;
    }

    listar(page = 1, limit = 10, busca?: string, inativos?: boolean, filtros?: Record<string, any>): Observable<PaginatedResponse<Beneficiario>> {
        const key = this.buildCacheKey(page, limit, busca, inativos, filtros);

        if (!this.cache.has(key)) {
            let params = new HttpParams().set('page', page).set('limit', limit);
            if (busca) params = params.set('busca', busca);
            if (inativos) params = params.set('inativos', 'true');

            // Adiciona todos os filtros extras dinamicamente
            if (filtros) {
                Object.entries(filtros).forEach(([k, v]) => {
                    if (v !== null && v !== undefined && v !== '') {
                        params = params.set(k, String(v));
                    }
                });
            }

            const req$ = this.http.get<PaginatedResponse<Beneficiario>>(this.url, { params }).pipe(shareReplay(1));
            this.cache.set(key, req$);
            setTimeout(() => this.cache.delete(key), this.cacheTimeMs);
        }

        return this.cache.get(key)!;
    }

    exportarLista(busca?: string, inativos?: boolean, filtros?: Record<string, any>): Observable<ArrayBuffer> {
        let params = new HttpParams();
        if (busca) params = params.set('busca', busca);
        if (inativos) params = params.set('inativos', 'true');
        if (filtros) {
            Object.entries(filtros).forEach(([k, v]) => {
                if (v !== null && v !== undefined && v !== '') {
                    params = params.set(k, String(v));
                }
            });
        }
        return this.http.get(`${this.url}/export`, { params, responseType: 'arraybuffer' });
    }

    buscarPorId(id: string): Observable<Beneficiario> {
        return this.http.get<Beneficiario>(`${this.url}/${id}`);
    }

    checkCpfRg(cpf?: string, rg?: string): Observable<
        | { status: 'livre' }
        | { status: 'ativo'; id: string; nomeCompleto: string; matricula: string | null }
        | { status: 'inativo'; id: string; nomeCompleto: string; matricula: string | null; excluido: boolean }
    > {
        let params = new HttpParams();
        if (cpf) params = params.set('cpf', cpf);
        if (rg) params = params.set('rg', rg);
        return this.http.get<any>(`${this.url}/check-cpf-rg`, { params });
    }

    atualizar(id: string, dados: Partial<Beneficiario>): Observable<Beneficiario> {
        this.limparCache();
        return this.http.patch<Beneficiario>(`${this.url}/${id}`, dados);
    }

    inativar(id: string): Observable<any> {
        this.limparCache();
        return this.http.delete(`${this.url}/${id}`);
    }

    restaurar(id: string): Observable<any> {
        this.limparCache();
        return this.http.patch(`${this.url}/${id}/restore`, {});
    }

    excluirDefinitivo(id: string): Observable<any> {
        this.limparCache();
        return this.http.delete(`${this.url}/${id}/hard`);
    }

    criarBeneficiario(dados: Record<string, unknown>): Observable<Beneficiario | ReativacaoAluno> {
        this.limparCache();
        return this.http.post<Beneficiario | ReativacaoAluno>(this.url, dados);
    }

    reativar(id: string): Observable<Beneficiario> {
        this.limparCache();
        return this.http.post<Beneficiario>(`${this.url}/${id}/reactivate`, {});
    }

    uploadImagem(file: File): Observable<{ url: string }> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<{ url: string }>('/api/upload', formData);
    }

    uploadPdf(file: File, tipo: 'lgpd' | 'atestado'): Observable<{ url: string }> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<{ url: string }>(`/api/upload/pdf?tipo=${tipo}`, formData);
    }

    excluirArquivo(urlArquivo: string): Observable<any> {
        let params = new HttpParams().set('url', urlArquivo);
        return this.http.delete('/api/upload', { params });
    }

    importar(file: File): Observable<ImportResult> {
        const formData = new FormData();
        formData.append('file', file);
        this.limparCache();
        return this.http.post<ImportResult>(`${this.url}/import`, formData);
    }
}

export interface ImportResult {
    importados: number;
    ignorados: number;
    erros: { linha: number; documento: string; motivo: string }[];
}
