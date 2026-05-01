import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { PaginatedResponse } from './beneficiarios.service';
import { DashboardService } from './dashboard.service';
import { StorageService } from './storage.service';

export type UsuarioRole = 'ADMIN' | 'SECRETARIA' | 'PROFESSOR' | 'COMUNICACAO';

export interface Usuario {
    id: string;
    nome: string;
    username: string;
    email?: string;
    cpf?: string;
    matricula?: string;
    role: UsuarioRole;
    fotoPerfil?: string | null;
    precisaTrocarSenha?: boolean;
    statusAtivo?: boolean;
    telefone?: string;
    cep?: string;
    rua?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
    criadoEm?: string;
}

/** Resposta quando o CPF já existe inativo — o frontend deve perguntar se quer reativar */
export interface ReativacaoResponse {
    _reativacao: true;
    id: string;
    nome: string;
    username: string;
    statusAtivo: boolean;
    excluido: boolean;
    message: string;
}

/** Credenciais geradas automaticamente pelo backend */
export interface CredenciaisGeradas {
    username: string;
    senha: string;
    instrucao: string;
}

/** Resposta de criação bem-sucedida */
export interface CreateUsuarioResponse extends Usuario {
    _credenciais: CredenciaisGeradas;
}

/** DTO de criação — apenas nome, CPF e cargo. O backend gera tudo mais. */
export interface CreateUsuarioDto {
    nome: string;
    cpf: string;
    role?: UsuarioRole;
    email?: string;
    telefone?: string;
    cep?: string;
    rua?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
    fotoPerfil?: string | null;
}

export type VerificacaoCpfUsuarioResponse =
    | { status: 'livre'; id?: undefined; nome?: undefined; username?: undefined; matricula?: undefined; excluido?: undefined }
    | {
        status: 'ativo' | 'inativo' | 'excluido';
        id: string;
        nome: string;
        username?: string;
        matricula: string | null;
        excluido?: boolean;
    };


@Injectable({ providedIn: 'root' })
export class UsuariosService {
    private readonly url = '/api/users';
    private readonly cache = new Map<string, { data$: Observable<PaginatedResponse<Usuario>>, expiresAt: number }>();
    private readonly cacheTimeMs = 2 * 60 * 1000;

    constructor(
        private readonly http: HttpClient,
        private readonly dashboardService: DashboardService,
        private readonly storage: StorageService
    ) { }

    limparCache(): void {
        this.cache.clear();
        this.dashboardService.limparCache();
    }

    private buildCacheKey(page: number, limit: number, nome?: string, inativos?: boolean, role?: UsuarioRole): string {
        return `${page}|${limit}|${nome ?? ''}|${inativos ?? false}|${role ?? ''}`;
    }

    verificarCpf(cpf: string): Observable<VerificacaoCpfUsuarioResponse> {
        let params = new HttpParams();
        if (cpf) params = params.set('cpf', cpf);
        return this.http.get<VerificacaoCpfUsuarioResponse>(`${this.url}/check-cpf`, { params });
    }

    listar(page = 1, limit = 10, nome?: string, inativos = false, role?: UsuarioRole): Observable<PaginatedResponse<Usuario>> {
        const key = this.buildCacheKey(page, limit, nome, inativos, role);
        const now = Date.now();

        if (this.cache.has(key) && this.cache.get(key)!.expiresAt > now) {
            return this.cache.get(key)!.data$;
        }

        let params = new HttpParams().set('page', page).set('limit', limit);
        if (nome) params = params.set('nome', nome);
        if (inativos) params = params.set('inativos', 'true');
        if (role) params = params.set('role', role);
        
        const req$ = this.http.get<PaginatedResponse<Usuario>>(this.url, { params }).pipe(shareReplay(1));
        this.cache.set(key, { data$: req$, expiresAt: now + this.cacheTimeMs });
        
        return req$;
    }

    /** Cria um novo usuário. O backend retorna `_reativacao: true` se o CPF já existir inativo. */
    criar(dados: CreateUsuarioDto): Observable<CreateUsuarioResponse | ReativacaoResponse> {
        this.limparCache();
        return this.http.post<CreateUsuarioResponse | ReativacaoResponse>(this.url, dados);
    }

    /** Reativa um usuário inativo pelo ID, gerando nova senha padrão. */
    reativar(id: string): Observable<CreateUsuarioResponse> {
        this.limparCache();
        return this.http.post<CreateUsuarioResponse>(`${this.url}/${id}/reativar`, {});
    }

    atualizar(id: string, dados: Partial<CreateUsuarioDto>): Observable<Usuario> {
        this.limparCache();
        return this.http.patch<Usuario>(`${this.url}/${id}`, dados);
    }

    excluir(id: string): Observable<void> {
        this.limparCache();
        return this.http.delete<void>(`${this.url}/${id}`);
    }

    resetarSenha(id: string): Observable<Usuario> {
        this.limparCache();
        return this.http.patch<Usuario>(`${this.url}/${id}/reset-password`, {});
    }

    restaurar(id: string): Observable<Usuario> {
        this.limparCache();
        return this.http.patch<Usuario>(`${this.url}/${id}/restore`, {});
    }

    excluirDefinitivo(id: string): Observable<void> {
        this.limparCache();
        return this.http.delete<void>(`${this.url}/${id}/hard`);
    }

    uploadFoto(file: File): Observable<{ url: string }> {
        return this.storage.uploadGlobalImage(file);
    }
}
